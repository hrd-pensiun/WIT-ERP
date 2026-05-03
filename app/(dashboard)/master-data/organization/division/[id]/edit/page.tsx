import DivisionEditClient from "./client"

export const dynamic = "force-dynamic"

export default async function DivisionEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DivisionEditClient id={id} />
}
