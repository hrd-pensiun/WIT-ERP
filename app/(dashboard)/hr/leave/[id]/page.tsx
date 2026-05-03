import LeaveDetailClient from "./client"

export const dynamic = "force-dynamic"

export default async function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LeaveDetailClient id={id} />
}
