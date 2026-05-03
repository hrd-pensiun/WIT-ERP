import OpportunityEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function OpportunityEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OpportunityEditClient id={id} />
}
