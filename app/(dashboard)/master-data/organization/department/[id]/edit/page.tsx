import DepartmentEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function DepartmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DepartmentEditClient id={id} />
}
