import { redirect } from "next/navigation"

export default function HrPayrollRedirect() {
  redirect("/payroll/processing")
}
