import EntityEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function EntityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EntityEditClient id={id} />
}
