import TaskEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { taskId } = await params
  return <TaskEditClient taskId={taskId} />
}
