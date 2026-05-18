"use client"

import { useState } from "react"
import { Trash2, Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import CostAnalysisScorecard, { computeScorecard } from "./cost-analysis-scorecard"
import type { ScorecardData } from "./cost-analysis-scorecard"

// ============================================================
// Types
// ============================================================
export interface CostAnalysisItem {
  id: string
  category: "Man Power Based" | "Equipment Cost" | "Operational Cost"
  createdAt: string
  totalCost: number
  hpp: number
  publishRate: number
  status: "Approved" | "Pending" | "Draft" | "Conflict"
  breakdown: string[]
  scorecard: ScorecardData
}

interface CostAnalysisListProps {
  items: CostAnalysisItem[]
  loading?: boolean
  onCreate: () => void
  onEdit: (item: CostAnalysisItem) => void
  onViewDetail: (item: CostAnalysisItem) => void
  onDelete: (id: string) => void
}

// ============================================================
// Category Color Styles
// ============================================================
const CATEGORY = {
  "Man Power Based": {
    dot: "bg-emerald-500",
    label: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/50",
    labelBg: "bg-emerald-100 dark:bg-emerald-900/40",
    topBorder: "border-t-emerald-500",
    topBorderClass: "border-t-[4px] border-t-emerald-500",
  },
  "Equipment Cost": {
    dot: "bg-amber-500",
    label: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/50",
    labelBg: "bg-amber-100 dark:bg-amber-900/40",
    topBorderClass: "border-t-[4px] border-t-amber-500",
  },
  "Operational Cost": {
    dot: "bg-blue-500",
    label: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/50",
    labelBg: "bg-blue-100 dark:bg-blue-900/40",
    topBorderClass: "border-t-[4px] border-t-blue-500",
  },
} as const

// ============================================================
// Status Styles
// ============================================================
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-emerald-500", text: "text-white" },
  Pending: { bg: "bg-amber-500", text: "text-white" },
  Draft: { bg: "bg-slate-400", text: "text-white" },
  Conflict: { bg: "bg-red-500", text: "text-white" },
}

// ============================================================
// Formatting
// ============================================================
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const fmtIDR = (n: number) => {
  if (n === 0) return "Rp 0"
  return "Rp " + Math.round(n).toLocaleString("id-ID")
}

// ============================================================
// Skeleton
// ============================================================
function SkeletonRow() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 animate-pulse">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Empty State
// ============================================================
function EmptyState({ onCreate }: { onCreate: () => void }) {
  const categoryKeys = Object.keys(CATEGORY) as (keyof typeof CATEGORY)[]
  return (
    <Card className="border-dashed border-slate-300 dark:border-slate-700">
      <CardContent className="p-10 text-center space-y-5">
        <div className="flex justify-center gap-2">
          {categoryKeys.map((key) => {
            const c = CATEGORY[key]
            return (
              <span key={key} className={`inline-block w-8 h-8 rounded-lg ${c.labelBg} ${c.border} border`} />
            )
          })}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">No cost analysis yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create a new cost analysis to get started.
          </p>
        </div>
        <Button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
          <Plus className="w-4 h-4" /> Create Cost Analysis
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Delete Confirmation Modal
// ============================================================
function DeleteModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Hapus Cost Analysis?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Apakah Anda yakin ingin menghapus cost analysis ini? Data tidak dapat dikembalikan.
        </p>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-9">
            Batalkan
          </Button>
          <Button
            size="sm"
            onClick={() => { onConfirm(); onOpenChange(false) }}
            className="bg-red-600 hover:bg-red-700 text-xs h-9"
          >
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Cost Analysis List Component (Vertical Layout)
// ============================================================
export default function CostAnalysisList({
  items,
  loading,
  onCreate,
  onEdit,
  onViewDetail,
  onDelete,
}: CostAnalysisListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cost Analysis</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Loading...</p>
          </div>
        </div>
        <div className="space-y-4">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    )
  }

  if (items.length === 0) return <EmptyState onCreate={onCreate} />

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cost Analysis</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {items.length} Cost Analysis
          </p>
        </div>
        <Button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
          <Plus className="w-4 h-4" /> Buat Cost Analysis
        </Button>
      </div>

      {/* ── Vertical Cards ── */}
      <div className="space-y-4">
        {items.map((item) => {
          const style = CATEGORY[item.category] || CATEGORY["Man Power Based"]
          const statusStyle = STATUS_STYLE[item.status] || STATUS_STYLE.Draft

          return (
            <Card
              key={item.id}
              className={`group transition-all duration-150 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 ${style.topBorderClass}`}
            >
              <CardContent className="p-4">
                {/* ── ROW 1: Type Badge | Date | Status | Delete ── */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`${style.labelBg} ${style.label} border-0 text-xs font-medium px-2 py-0.5 gap-1.5`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                      {item.category}
                    </Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {fmtDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                      className="text-[0.6rem] h-6 px-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onViewDetail(item) }}
                      className="text-[0.6rem] h-6 px-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white gap-0.5"
                    >
                      Detail <ExternalLink className="w-2.5 h-2.5" />
                    </Button>
                    <span className={`px-1.5 py-0.5 rounded text-[0.55rem] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {item.status}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.id) }}
                      className="p-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-3" />

                {/* ── Scorecard ── */}
                <div className="my-3">
                  <CostAnalysisScorecard data={item.scorecard} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation */}
      <DeleteModal
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

export { fmtIDR as fmtCostIDR }
