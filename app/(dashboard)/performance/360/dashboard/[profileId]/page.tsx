import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Perf360HrDashboardDetail } from "@/components/performance/360/hr-dashboard-detail"

export const dynamic = "force-dynamic"

export default async function Performance360DashboardDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-sm">Memuat hasil…</span>
        </div>
      }
    >
      <Perf360HrDashboardDetail profileId={profileId} />
    </Suspense>
  )
}
