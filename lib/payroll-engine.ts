import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

type GenerateInput = {
  tenantId?: string
  payrollPeriodId: string
  entityId: string
  periodStart: string
  periodEnd: string
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

function countWorkingDays(startDate: string, endDate: string): number {
  let count = 0
  const current = new Date(startDate)
  const end = new Date(endDate)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

export async function generatePayrollDetailsForPeriod(
  input: GenerateInput
): Promise<EngineResult> {
  const tenantId = input.tenantId ?? getTenantId()
  const result: EngineResult = { generated: 0, skipped: 0, errors: [] }

  if (!insForge) {
    result.errors.push("Database not connected")
    return result
  }

  const { data: employees, error: empErr } = await insForge
    .from("user_profiles")
    .select("id, full_name, employee_number, entity_id, job_grade_id, position_id, npwp, status")
    .eq("tenant_id", tenantId)
    .eq("entity_id", input.entityId)
    .eq("status", "active")

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

      // Fetch attendance for this employee in the payroll period
      const { data: attRows } = await insForge
        .from("attendance_records")
        .select("status")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", emp.id)
        .gte("date", input.periodStart)
        .lte("date", input.periodEnd)

      const workingDays = countWorkingDays(input.periodStart, input.periodEnd)
      const absentDays = (attRows || []).filter((r: any) => r.status === "absent").length
      const presentDays = (attRows || []).filter(
        (r: any) => r.status === "present" || r.status === "late"
      ).length

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

      // Attendance deduction: 1 day absent = basic_salary / working_days
      const attendanceDeductionAmount =
        workingDays > 0 ? (basicSalary / workingDays) * absentDays : 0

      const bpjsTkBase = capAmount(
        basicSalary,
        cfg.bpjs_tk_salary_cap ? toNumber(cfg.bpjs_tk_salary_cap) : null
      )
      const bpjsKesBase = capAmount(
        basicSalary,
        cfg.bpjs_health_salary_cap ? toNumber(cfg.bpjs_health_salary_cap) : null
      )
      const bpjsTkAmount =
        (bpjsTkBase * toNumber(cfg.bpjs_tk_employee_rate, 0)) / 100
      const bpjsKesAmount =
        (bpjsKesBase * toNumber(cfg.bpjs_health_employee_rate, 0)) / 100

      const grossSalary = basicSalary + totalAllowances
      const taxableBase = Math.max(
        0,
        grossSalary - totalDeductions - attendanceDeductionAmount - bpjsTkAmount - bpjsKesAmount
      )
      const taxable = cfg.npwp_required && !emp.npwp ? 0 : taxableBase
      const pph21Amount = (taxable * toNumber(cfg.pph21_rate, 0)) / 100

      const netSalary =
        grossSalary -
        totalDeductions -
        attendanceDeductionAmount -
        bpjsTkAmount -
        bpjsKesAmount -
        pph21Amount

      const fullDeductions = [
        ...deductionDetails,
        ...(attendanceDeductionAmount > 0
          ? [{ name: "Potongan Absensi", amount: attendanceDeductionAmount }]
          : []),
        { name: "BPJS TK", amount: bpjsTkAmount },
        { name: "BPJS Kesehatan", amount: bpjsKesAmount },
        { name: "PPh21", amount: pph21Amount },
      ]

      const { error: insErr } = await insForge.from("payroll_details").insert({
        tenant_id: tenantId,
        payroll_period_id: input.payrollPeriodId,
        user_profile_id: emp.id,
        basic_salary: basicSalary,
        allowance_details: allowanceDetails,
        total_allowances: totalAllowances,
        deduction_details: fullDeductions,
        total_deductions:
          totalDeductions +
          attendanceDeductionAmount +
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
