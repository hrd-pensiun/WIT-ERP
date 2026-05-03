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
    .select("id, full_name, employee_number, entity_id, job_grade_id, npwp, status")
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
      const basicSalary = salaryFromMatrix
        ? toNumber(salaryFromMatrix)
        : toNumber(cfg.umr_amount)

      const { data: empAllowances, error: eaErr } = await insForge
        .from("employee_allowances")
        .select("amount, salary_component_id")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", emp.id)
        .eq("status", "active")

      if (eaErr) throw eaErr

      const componentIds = (empAllowances || []).map((x: any) => x.salary_component_id)
      let componentMap = new Map<string, any>()
      if (componentIds.length > 0) {
        const { data: comps, error: compErr } = await insForge
          .from("salary_components")
          .select("id, name, type")
          .eq("tenant_id", tenantId)
          .in("id", componentIds)
        if (compErr) throw compErr
        componentMap = new Map((comps || []).map((c: any) => [c.id, c]))
      }

      const allowanceDetails: Array<{ name: string; amount: number }> = []
      const deductionDetails: Array<{ name: string; amount: number }> = []
      let totalAllowances = 0
      let totalDeductions = 0

      for (const row of empAllowances || []) {
        const amount = toNumber(row.amount)
        const comp = componentMap.get(row.salary_component_id)
        const name = comp?.name || "Komponen"
        if (comp?.type === "earning") {
          totalAllowances += amount
          allowanceDetails.push({ name, amount })
        } else {
          totalDeductions += amount
          deductionDetails.push({ name, amount })
        }
      }

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
        grossSalary - totalDeductions - bpjsTkAmount - bpjsKesAmount
      )
      const taxable = cfg.npwp_required && !emp.npwp ? 0 : taxableBase
      const pph21Amount = (taxable * toNumber(cfg.pph21_rate, 0)) / 100

      const netSalary =
        grossSalary - totalDeductions - bpjsTkAmount - bpjsKesAmount - pph21Amount

      const fullDeductions = [
        ...deductionDetails,
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
        total_deductions: totalDeductions + bpjsTkAmount + bpjsKesAmount + pph21Amount,
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
