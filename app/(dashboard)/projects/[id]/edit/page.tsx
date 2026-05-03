import ProjectEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProjectEditClient id={id} />
}
