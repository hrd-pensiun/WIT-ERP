import EmployeeEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function EmployeeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EmployeeEditClient id={id} />
}
