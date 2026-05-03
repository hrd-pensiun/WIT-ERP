import NewTaskClient from "./client"

export const dynamic = "force-dynamic"

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <NewTaskClient projectId={id} />
}
