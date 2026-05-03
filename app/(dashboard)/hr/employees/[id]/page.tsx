import EmployeeDetailClient from "./client"

export const dynamic = "force-dynamic"

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EmployeeDetailClient id={id} />
}
