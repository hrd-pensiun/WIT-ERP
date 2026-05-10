import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

type GenerateInput = {
  tenantId?: string
  payrollPeriodId: string
  entityId: string
  periodStart: string       // payroll cut-off start
  periodEnd: string         // payroll cut-off end
  attendanceStart?: string  // attendance cut-off start (fallback = periodStart)
  attendanceEnd?: string    // attendance cut-off end   (fallback = periodEnd)
  prorataEnabled?: boolean  // default true
  prorataDivisor?: number   // default 30
}

type EngineResult = {
  generated: number
  skipped: number
  errors: string[]
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function capAmount(base: number, cap?: number | null): number {
  if (!cap || cap <= 0) return base
  return Math.min(base, cap)
}

import { countWorkingDaysWithHolidays } from "@/lib/attendance-utils"

/** Fetch holidays from hr_work_calendars and count working days excluding them */
async function countWorkingDays(
  startDate: string,
  endDate: string,
  tenantId: string,
  entityId?: string
): Promise<number> {
  try {
    const db = insForge as any
    let q = db
      .from("hr_work_calendars")
      .select("date")
      .eq("tenant_id", tenantId)
      .eq("is_holiday", true)
      .gte("date", startDate)
      .lte("date", endDate)

    if (entityId) {
      q = q.or(`entity_id.eq.${entityId},entity_id.is.null`)
    }

    const { data } = await q
    const holidays: string[] = (data || []).map((r: any) => r.date)
    return countWorkingDaysWithHolidays(startDate, endDate, holidays)
  } catch {
    // Fallback: weekdays only, no holiday exclusion
    return countWorkingDaysWithHolidays(startDate, endDate, [])
  }
}

export async function generatePayrollDetailsForPeriod(
  input: GenerateInput
): Promise<EngineResult> {
  const tenantId = input.tenantId ?? getTenantId()
  const result: EngineResult = { generated: 0, skipped: 0, errors: [] }

  // Attendance window (may differ from payroll period for cut-off configs)
  const attStart = input.attendanceStart ?? input.periodStart
  const attEnd   = input.attendanceEnd   ?? input.periodEnd
  const prorataEnabled = input.prorataEnabled ?? true
  const prorataDivisor = input.prorataDivisor ?? 30

  if (!insForge) {
    result.errors.push("Database not connected")
    return result
  }

  // Include employees assigned to this entity OR with no entity assigned yet (entity_id IS NULL)
  const { data: employees, error: empErr } = await (insForge as any)
    .from("user_profiles")
    .select("id, full_name, employee_number, entity_id, job_grade_id, position_id, npwp, status, join_date")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .or(`entity_id.eq.${input.entityId},entity_id.is.null`)

  if (empErr) {
    result.errors.push(empErr.message)
    return result
  }

  const { data: cfgRows, error: cfgErr } = await insForge
    .from("entity_payroll_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("entity_id", input.entityId)
    .eq("status", "active")
    .lte("effective_date", input.periodEnd)
    .order("effective_date", { ascending: false })
    .limit(1)

  if (cfgErr) {
    result.errors.push(`Config payroll: ${cfgErr.message}`)
    return result
  }

  const cfg = cfgRows?.[0]
  if (!cfg) {
    result.errors.push("Konfigurasi payroll entity belum diisi.")
    return result
  }

  const { data: matrix, error: matrixErr } = await insForge
    .from("salary_matrix")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("entity_id", input.entityId)
    .eq("status", "active")
    .lte("effective_date", input.periodEnd)

  if (matrixErr) result.errors.push(`Salary matrix: ${matrixErr.message}`)

  // ── Attendance fine config for this entity ───────────────────────────────
  const { data: fineConfigRows } = await (insForge as any)
    .from("attendance_fine_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("entity_id", input.entityId)
    .eq("is_active", true)
    .limit(1)
  const fineConfig = fineConfigRows?.[0] ?? null

  // ── Position fine eligibility ─────────────────────────────────────────────
  const { data: posFineElig } = await (insForge as any)
    .from("position_fine_eligibility")
    .select("position_id, fine_type, is_subject")
    .eq("tenant_id", tenantId)

  // ── Allowance matrix: default tunjangan per job grade ─────────────────────
  const { data: allowanceMatrix } = await (insForge as any)
    .from("allowance_matrix")
    .select("job_grade_id, salary_component_id, amount")
    .eq("tenant_id", tenantId)

  // ── Position eligibility: jabatan mana yang dapat komponen apa ───────────
  const { data: posEligibility } = await (insForge as any)
    .from("position_allowance_eligibility")
    .select("position_id, salary_component_id, is_eligible")
    .eq("tenant_id", tenantId)

  // ── All active salary components (for allowance matrix auto-fill) ─────────
  const { data: allComponents } = await insForge
    .from("salary_components")
    .select("id, name, type, is_fixed")
    .eq("tenant_id", tenantId)
    .eq("status", "active")

  const allComponentMap = new Map<string, any>(
    (allComponents || []).map((c: any) => [c.id, c])
  )

  // ── Job grades: min_salary fallback (pre-fetched, avoid N+1) ─────────────
  const { data: allGrades } = await (insForge as any)
    .from("hr_job_grades")
    .select("id, min_salary")

  const gradeMinSalaryMap = new Map<string, number>(
    (allGrades || [])
      .filter((g: any) => g.min_salary)
      .map((g: any) => [g.id, toNumber(g.min_salary)])
  )

  for (const emp of employees || []) {
    try {
      const { data: exists, error: existsErr } = await insForge
        .from("payroll_details")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("payroll_period_id", input.payrollPeriodId)
        .eq("user_profile_id", emp.id)
        .limit(1)

      if (existsErr) throw existsErr
      if (exists && exists.length > 0) {
        result.skipped++
        continue
      }

      const salaryFromMatrix =
        (matrix || [])
          .filter((r: any) => r.job_grade_id === emp.job_grade_id)
          .sort((a: any, b: any) => toNumber(b.step) - toNumber(a.step))[0]?.amount ??
        null

      // Per-employee salary override: terbaru dengan effective_date <= periodEnd
      const { data: empSalRows } = await insForge
        .from("employee_salaries")
        .select("amount")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", emp.id)
        .lte("effective_date", input.periodEnd)
        .order("effective_date", { ascending: false })
        .limit(1)

      // hr_job_grades.min_salary as fallback before UMR (from pre-fetched map)
      const gradeMinSalary = emp.job_grade_id
        ? (gradeMinSalaryMap.get(emp.job_grade_id) ?? null)
        : null

      // Priority: employee override > salary_matrix > hr_job_grades.min_salary > UMR
      const basicSalary = empSalRows?.[0]?.amount
        ? toNumber(empSalRows[0].amount)
        : salaryFromMatrix && toNumber(salaryFromMatrix) > 0
        ? toNumber(salaryFromMatrix)
        : gradeMinSalary && gradeMinSalary > 0
        ? gradeMinSalary
        : toNumber(cfg.umr_amount)

      const { data: empAllowances, error: eaErr } = await insForge
        .from("employee_allowances")
        .select("amount, salary_component_id")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", emp.id)
        .eq("status", "active")

      if (eaErr) throw eaErr

      // Map of per-employee overrides: component_id → amount
      const overrideMap = new Map<string, number>(
        (empAllowances || []).map((x: any) => [x.salary_component_id, toNumber(x.amount)])
      )

      // Build resolved allowance list:
      //   Start with allowance_matrix entries for this employee's job grade.
      //   Filter by position eligibility (if position has no row → eligible by default).
      //   Per-employee override takes priority over matrix amount.
      const resolvedAllowances = new Map<string, { amount: number; source: "override" | "matrix" }>()

      if (emp.job_grade_id) {
        const gradeEntries = (allowanceMatrix || []).filter(
          (r: any) => r.job_grade_id === emp.job_grade_id
        )
        for (const entry of gradeEntries) {
          const compId: string = entry.salary_component_id
          const comp = allComponentMap.get(compId)
          if (!comp || comp.type !== "earning") continue

          // Check position eligibility: if no row exists → eligible by default (is_eligible = true)
          const eligEntry = (posEligibility || []).find(
            (e: any) => e.position_id === emp.position_id && e.salary_component_id === compId
          )
          const eligible = emp.position_id
            ? (eligEntry?.is_eligible ?? true)  // has position: respect eligibility row
            : true                               // no position set: always eligible

          if (!eligible) continue

          if (overrideMap.has(compId)) {
            // Employee override wins
            resolvedAllowances.set(compId, { amount: overrideMap.get(compId)!, source: "override" })
          } else if (toNumber(entry.amount) > 0) {
            resolvedAllowances.set(compId, { amount: toNumber(entry.amount), source: "matrix" })
          }
        }
      }

      // Also include any per-employee allowances NOT in the matrix (manual additions)
      for (const [compId, amount] of overrideMap) {
        if (!resolvedAllowances.has(compId)) {
          resolvedAllowances.set(compId, { amount, source: "override" })
        }
      }

      // Collect component ids needed for name/type resolution
      const componentIds = [...resolvedAllowances.keys()]
      const componentMap = new Map<string, any>(
        componentIds
          .map((id) => allComponentMap.get(id))
          .filter(Boolean)
          .map((c: any) => [c.id, c])
      )

      // Back-fill components not yet in allComponentMap (edge case: stale component)
      const missing = componentIds.filter((id) => !allComponentMap.has(id))
      if (missing.length > 0) {
        const { data: comps } = await insForge
          .from("salary_components")
          .select("id, name, type, is_fixed")
          .eq("tenant_id", tenantId)
          .in("id", missing)
        for (const c of comps || []) componentMap.set(c.id, c)
      }

      // Fetch attendance using attendance cut-off window (may differ from payroll period)
      const { data: attRows } = await (insForge as any)
        .from("attendance_records")
        .select("status, check_in_status, check_in, check_out")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", emp.id)
        .gte("date", attStart)
        .lte("date", attEnd)

      const workingDays = await countWorkingDays(attStart, attEnd, tenantId, input.entityId)

      // ── Prorata for new joiners ──────────────────────────────────────────────
      // If employee joined after attStart, prorate basic salary
      let prorataFactor = 1
      if (prorataEnabled && emp.join_date) {
        const joinDate    = new Date(emp.join_date + "T00:00:00")
        const attStartDate = new Date(attStart    + "T00:00:00")
        if (joinDate > attStartDate) {
          const attEndDate  = new Date(attEnd + "T00:00:00")
          const daysInPeriod = Math.max(
            1,
            Math.round((attEndDate.getTime() - joinDate.getTime()) / 86400000) + 1
          )
          prorataFactor = daysInPeriod / prorataDivisor
        }
      }
      const absentDays  = (attRows || []).filter((r: any) => r.status === "absent").length
      const presentDays = (attRows || []).filter(
        (r: any) => r.status === "present" || r.status === "late"
      ).length

      // ── Fine calculation ──────────────────────────────────────────────────
      let lateFineTotal     = 0
      let noCheckinTotal    = 0
      let noCheckoutTotal   = 0

      if (fineConfig) {
        // Check position eligibility (no row = eligible by default)
        const isLateElig = emp.position_id
          ? ((posFineElig || []).find(
              (e: any) => e.position_id === emp.position_id && e.fine_type === "late"
            )?.is_subject ?? true)
          : true
        const isAbsenceElig = emp.position_id
          ? ((posFineElig || []).find(
              (e: any) => e.position_id === emp.position_id && e.fine_type === "absence"
            )?.is_subject ?? true)
          : true

        for (const att of attRows || []) {
          if (att.check_in_status === "late" && isLateElig) {
            // Calculate actual minutes late (assume shift start 08:00 WIB)
            let minutesLate = 0
            if (att.check_in) {
              const ci = new Date(att.check_in)
              const shiftStart = new Date(ci)
              shiftStart.setUTCHours(1, 0, 0, 0) // 08:00 WIB = 01:00 UTC
              minutesLate = Math.max(0, (ci.getTime() - shiftStart.getTime()) / 60000)
            }
            const tolerance = toNumber(fineConfig.late_min_minutes, 0)
            if (minutesLate >= tolerance) {
              let fineAmt = 0
              if (fineConfig.late_method === "fixed") {
                fineAmt = toNumber(fineConfig.late_fixed_amount)
              } else {
                // proportional: (minutes / 60) × rate_per_hour
                const ratePerHour = toNumber(fineConfig.late_fine_per_hour)
                fineAmt = (minutesLate / 60) * ratePerHour
              }
              if (fineConfig.late_max_amount && toNumber(fineConfig.late_max_amount) > 0) {
                fineAmt = Math.min(fineAmt, toNumber(fineConfig.late_max_amount))
              }
              lateFineTotal += fineAmt
            }
          }

          // No check-in: absent records
          if (att.status === "absent" && isAbsenceElig) {
            noCheckinTotal += toNumber(fineConfig.no_checkin_amount)
          }

          // No check-out: present but missing check_out
          if (att.status !== "absent" && !att.check_out && isAbsenceElig) {
            noCheckoutTotal += toNumber(fineConfig.no_checkout_amount)
          }
        }
      }

      // Apply prorata to basic salary
      const effectiveBasicSalary = Math.round(basicSalary * prorataFactor)

      const allowanceDetails: Array<{ name: string; amount: number; is_fixed?: boolean }> = []
      const deductionDetails: Array<{ name: string; amount: number }> = []
      let totalAllowances = 0
      let totalDeductions = 0

      for (const [compId, { amount: rawAmount }] of resolvedAllowances) {
        const comp = componentMap.get(compId)
        const name = comp?.name || "Komponen"
        if (!comp || comp.type === "earning") {
          let amount: number
          if (comp?.is_fixed === false) {
            // Variable allowance: prorated by actual attendance
            const dailyRate = workingDays > 0 ? rawAmount / workingDays : 0
            amount = dailyRate * presentDays
          } else {
            amount = rawAmount
          }
          totalAllowances += amount
          allowanceDetails.push({ name, amount, is_fixed: comp?.is_fixed ?? true })
        } else {
          // Deduction component (from manual employee_allowances)
          totalDeductions += rawAmount
          deductionDetails.push({ name, amount: rawAmount })
        }
      }

      // Per-employee deduction components not already processed above
      for (const row of empAllowances || []) {
        const comp = allComponentMap.get(row.salary_component_id)
        if (comp?.type === "deduction" && !resolvedAllowances.has(row.salary_component_id)) {
          const amount = toNumber(row.amount)
          totalDeductions += amount
          deductionDetails.push({ name: comp.name || "Potongan", amount })
        }
      }

      // Attendance deduction: 1 day absent = effectiveBasicSalary / working_days
      const attendanceDeductionAmount =
        workingDays > 0 ? (effectiveBasicSalary / workingDays) * absentDays : 0

      const bpjsTkBase = capAmount(
        effectiveBasicSalary,
        cfg.bpjs_tk_salary_cap ? toNumber(cfg.bpjs_tk_salary_cap) : null
      )
      const bpjsKesBase = capAmount(
        effectiveBasicSalary,
        cfg.bpjs_health_salary_cap ? toNumber(cfg.bpjs_health_salary_cap) : null
      )
      const bpjsTkAmount =
        (bpjsTkBase * toNumber(cfg.bpjs_tk_employee_rate, 0)) / 100
      const bpjsKesAmount =
        (bpjsKesBase * toNumber(cfg.bpjs_health_employee_rate, 0)) / 100

      const totalFines = Math.round(lateFineTotal + noCheckinTotal + noCheckoutTotal)

      const grossSalary = effectiveBasicSalary + totalAllowances
      const taxableBase = Math.max(
        0,
        grossSalary - totalDeductions - attendanceDeductionAmount - totalFines - bpjsTkAmount - bpjsKesAmount
      )
      const taxable = cfg.npwp_required && !emp.npwp ? 0 : taxableBase
      const pph21Amount = (taxable * toNumber(cfg.pph21_rate, 0)) / 100

      const netSalary =
        grossSalary -
        totalDeductions -
        attendanceDeductionAmount -
        totalFines -
        bpjsTkAmount -
        bpjsKesAmount -
        pph21Amount

      const fullDeductions = [
        ...deductionDetails,
        ...(attendanceDeductionAmount > 0
          ? [{ name: "Potongan Absensi", amount: attendanceDeductionAmount }]
          : []),
        ...(Math.round(lateFineTotal) > 0
          ? [{ name: "Denda Keterlambatan", amount: Math.round(lateFineTotal) }]
          : []),
        ...(Math.round(noCheckinTotal) > 0
          ? [{ name: "Denda Tidak Check-in", amount: Math.round(noCheckinTotal) }]
          : []),
        ...(Math.round(noCheckoutTotal) > 0
          ? [{ name: "Denda Tidak Check-out", amount: Math.round(noCheckoutTotal) }]
          : []),
        { name: "BPJS TK", amount: bpjsTkAmount },
        { name: "BPJS Kesehatan", amount: bpjsKesAmount },
        { name: "PPh21", amount: pph21Amount },
      ]

      const { error: insErr } = await insForge.from("payroll_details").insert({
        tenant_id: tenantId,
        payroll_period_id: input.payrollPeriodId,
        user_profile_id: emp.id,
        basic_salary: effectiveBasicSalary,
        allowance_details: allowanceDetails,
        total_allowances: totalAllowances,
        deduction_details: fullDeductions,
        total_deductions:
          totalDeductions +
          attendanceDeductionAmount +
          totalFines +
          bpjsTkAmount +
          bpjsKesAmount +
          pph21Amount,
        attendance_deduction_amount: attendanceDeductionAmount,
        bpjs_tk_amount: bpjsTkAmount,
        bpjs_kes_amount: bpjsKesAmount,
        pph21_amount: pph21Amount,
        pph21_method: cfg.pph21_method,
        gross_salary: grossSalary,
        net_salary: netSalary,
        take_home_pay: netSalary,
        status: "draft",
      })
      if (insErr) throw insErr
      result.generated++
    } catch (err) {
      result.errors.push(
        `Employee ${emp.employee_number || emp.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }

  return result
}
