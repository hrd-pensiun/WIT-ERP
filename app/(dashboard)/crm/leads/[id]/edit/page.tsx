import LeadEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function LeadEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LeadEditClient id={id} />
}
