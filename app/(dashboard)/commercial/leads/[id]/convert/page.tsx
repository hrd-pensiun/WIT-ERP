import ConvertLeadClient from "./client"

export const dynamic = "force-dynamic"

export default async function ConvertLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ConvertLeadClient id={id} />
}
