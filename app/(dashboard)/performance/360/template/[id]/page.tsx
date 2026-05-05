import { Template360DetailView } from "@/components/performance/360/template-detail-view"

export const dynamic = "force-dynamic"

export default async function Template360PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Template360DetailView id={id} />
}
