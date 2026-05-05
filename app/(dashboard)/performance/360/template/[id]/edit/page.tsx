import { Template360Form } from "@/components/performance/360/template-form"

export const dynamic = "force-dynamic"

export default async function Template360EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Template360Form templateId={id} />
}
