import PositionEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function PositionEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PositionEditClient id={id} />
}
