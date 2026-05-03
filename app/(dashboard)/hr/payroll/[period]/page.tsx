import PayrollPeriodClient from "./client"

export default async function PayrollPeriodPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params
  return <PayrollPeriodClient period={period} />
}
