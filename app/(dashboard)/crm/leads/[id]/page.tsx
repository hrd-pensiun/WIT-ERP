import LeadViewClient from "./client"

export const dynamic = "force-dynamic"

export default async function LeadViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LeadViewClient id={id} />
}
