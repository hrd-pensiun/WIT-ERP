"use client"

/**
 * useResolvedCompensation
 *
 * Resolves an employee's effective salary + allowances by merging:
 *   1. salary_matrix  (grade-based default gaji pokok)
 *   2. employee_salaries (per-employee override — takes priority)
 *   3. allowance_matrix (grade-based default tunjangan)
 *   4. position_allowance_eligibility (jabatan filter)
 *   5. employee_allowances (per-employee override per komponen)
 *
 * Priority chain identical to payroll-engine.ts so the display
 * matches what will be generated on payroll run.
 */

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export type ResolvedAllowance = {
  salary_component_id: string
  name: string
  type: string
  is_fixed: boolean
  amount: number
  /** "override" = per-employee entry; "matrix" = default dari allowance_matrix */
  source: "override" | "matrix"
  /** id of employee_allowances row (only when source="override") */
  allowance_id?: string
}

export type ResolvedCompensation = {
  /** Effective gaji pokok (override > salary_matrix > null) */
  resolvedSalary: number | null
  /** "override" if from employee_salaries, "matrix" if from salary_matrix */
  salarySource: "override" | "matrix" | null
  /** Effective date of the salary record (override only) */
  salaryEffectiveDate: string | null
  /** All resolved tunjangan (earning components) */
  earnings: ResolvedAllowance[]
  /** All resolved potongan (deduction components from employee_allowances) */
  deductions: ResolvedAllowance[]
  totalEarnings: number
  grossSalary: number
  loading: boolean
  error: string | null
  refetch: () => void
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function useResolvedCompensation(
  employeeId: string,
  tenantId: string = getTenantId()
): ResolvedCompensation {
  const [data, setData] = useState<Omit<ResolvedCompensation, "loading" | "error" | "refetch">>({
    resolvedSalary: null,
    salarySource: null,
    salaryEffectiveDate: null,
    earnings: [],
    deductions: [],
    totalEarnings: 0,
    grossSalary: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!employeeId || !insForge) return
    setLoading(true)
    setError(null)

    try {
      const db = insForge as any

      // 1. Employee profile: need job_grade_id + position_id
      const { data: emp, error: empErr } = await db
        .from("user_profiles")
        .select("id, job_grade_id, position_id")
        .eq("tenant_id", tenantId)
        .eq("id", employeeId)
        .single()
      if (empErr) throw empErr

      const today = new Date().toISOString().slice(0, 10)

      // 2. Salary override (latest effective_date <= today)
      const { data: salRows } = await db
        .from("employee_salaries")
        .select("amount, effective_date")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", employeeId)
        .lte("effective_date", today)
        .order("effective_date", { ascending: false })
        .limit(1)

      // 3. Salary matrix fallback (highest step for this grade)
      let salaryFromMatrix: number | null = null
      let salaryFromGrade: number | null = null

      if (emp?.job_grade_id) {
        const { data: matrixRows } = await db
          .from("salary_matrix")
          .select("amount, step")
          .eq("tenant_id", tenantId)
          .eq("job_grade_id", emp.job_grade_id)
          .eq("status", "active")
          .lte("effective_date", today)
        if (matrixRows?.length) {
          const best = [...matrixRows].sort(
            (a: any, b: any) => toNumber(b.step) - toNumber(a.step)
          )[0]
          salaryFromMatrix = toNumber(best.amount)
        }

        // 4. hr_job_grades.min_salary as final fallback
        const { data: gradeRow } = await db
          .from("hr_job_grades")
          .select("min_salary")
          .eq("id", emp.job_grade_id)
          .single()
        if (gradeRow?.min_salary) {
          salaryFromGrade = toNumber(gradeRow.min_salary)
        }
      }

      let resolvedSalary: number | null = null
      let salarySource: "override" | "matrix" | null = null
      let salaryEffectiveDate: string | null = null

      if (salRows?.[0]?.amount) {
        resolvedSalary = toNumber(salRows[0].amount)
        salarySource = "override"
        salaryEffectiveDate = salRows[0].effective_date
      } else if (salaryFromMatrix !== null && salaryFromMatrix > 0) {
        resolvedSalary = salaryFromMatrix
        salarySource = "matrix"
      } else if (salaryFromGrade !== null && salaryFromGrade > 0) {
        resolvedSalary = salaryFromGrade
        salarySource = "matrix"   // display as "Default" — comes from grade config
      }

      // 4. All active salary components
      const { data: allComps } = await db
        .from("salary_components")
        .select("id, name, type, is_fixed")
        .eq("tenant_id", tenantId)
        .eq("status", "active")

      const compMap = new Map<string, any>(
        (allComps || []).map((c: any) => [c.id, c])
      )

      // 5. Per-employee allowance overrides
      const { data: empAllowances } = await db
        .from("employee_allowances")
        .select("id, salary_component_id, amount")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", employeeId)
        .eq("status", "active")

      const overrideMap = new Map<string, { id: string; amount: number }>(
        (empAllowances || []).map((x: any) => [
          x.salary_component_id,
          { id: x.id, amount: toNumber(x.amount) },
        ])
      )

      // 6. Allowance matrix for this grade
      const resolvedEarnings = new Map<string, ResolvedAllowance>()

      if (emp?.job_grade_id) {
        const { data: amRows } = await db
          .from("allowance_matrix")
          .select("salary_component_id, amount")
          .eq("tenant_id", tenantId)
          .eq("job_grade_id", emp.job_grade_id)

        // 7. Position eligibility
        let eligibilityMap = new Map<string, boolean>()
        if (emp?.position_id) {
          const { data: eligRows } = await db
            .from("position_allowance_eligibility")
            .select("salary_component_id, is_eligible")
            .eq("tenant_id", tenantId)
            .eq("position_id", emp.position_id)
          eligibilityMap = new Map(
            (eligRows || []).map((e: any) => [e.salary_component_id, e.is_eligible])
          )
        }

        for (const row of amRows || []) {
          const compId: string = row.salary_component_id
          const comp = compMap.get(compId)
          if (!comp || comp.type !== "earning") continue

          // Check eligibility
          const eligible = emp.position_id
            ? (eligibilityMap.has(compId) ? eligibilityMap.get(compId)! : true)
            : true

          if (!eligible) continue

          if (overrideMap.has(compId)) {
            const ov = overrideMap.get(compId)!
            resolvedEarnings.set(compId, {
              salary_component_id: compId,
              name: comp.name,
              type: comp.type,
              is_fixed: comp.is_fixed ?? true,
              amount: ov.amount,
              source: "override",
              allowance_id: ov.id,
            })
          } else if (toNumber(row.amount) > 0) {
            resolvedEarnings.set(compId, {
              salary_component_id: compId,
              name: comp.name,
              type: comp.type,
              is_fixed: comp.is_fixed ?? true,
              amount: toNumber(row.amount),
              source: "matrix",
            })
          }
        }
      }

      // Manual earning overrides not in matrix
      for (const [compId, ov] of overrideMap) {
        if (!resolvedEarnings.has(compId)) {
          const comp = compMap.get(compId)
          if (!comp || comp.type !== "earning") continue
          resolvedEarnings.set(compId, {
            salary_component_id: compId,
            name: comp.name,
            type: comp.type,
            is_fixed: comp.is_fixed ?? true,
            amount: ov.amount,
            source: "override",
            allowance_id: ov.id,
          })
        }
      }

      // Deductions: only from employee_allowances (no matrix for deductions)
      const deductions: ResolvedAllowance[] = []
      for (const [compId, ov] of overrideMap) {
        const comp = compMap.get(compId)
        if (!comp || comp.type !== "deduction") continue
        deductions.push({
          salary_component_id: compId,
          name: comp.name,
          type: comp.type,
          is_fixed: comp.is_fixed ?? true,
          amount: ov.amount,
          source: "override",
          allowance_id: ov.id,
        })
      }

      const earnings = [...resolvedEarnings.values()]
      const totalEarnings = earnings.reduce((s, a) => s + a.amount, 0)
      const grossSalary = (resolvedSalary ?? 0) + totalEarnings

      setData({
        resolvedSalary,
        salarySource,
        salaryEffectiveDate,
        earnings,
        deductions,
        totalEarnings,
        grossSalary,
      })
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data kompensasi")
    } finally {
      setLoading(false)
    }
  }, [employeeId, tenantId])

  useEffect(() => { fetch() }, [fetch])

  return { ...data, loading, error, refetch: fetch }
}
