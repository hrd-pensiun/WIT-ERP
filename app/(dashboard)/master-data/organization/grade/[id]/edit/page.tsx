import GradeEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function GradeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <GradeEditClient id={id} />
}
