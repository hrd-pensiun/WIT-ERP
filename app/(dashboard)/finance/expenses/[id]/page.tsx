import ExpenseDetailClient from "./client"

export const dynamic = "force-dynamic"

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ExpenseDetailClient id={id} />
}
