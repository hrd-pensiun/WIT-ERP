import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EditProjectTaskRedirect({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id } = await params
  redirect(`/projects/${id}`)
}
