import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Perf360HrDashboardOverview } from "@/components/performance/360/hr-dashboard-overview"

export const dynamic = "force-dynamic"

export default function Performance360DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-sm">Memuat dashboard…</span>
        </div>
      }
    >
      <Perf360HrDashboardOverview />
    </Suspense>
  )
}
