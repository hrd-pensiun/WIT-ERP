"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ============================================================
// Types
// ============================================================
export interface ScorecardData {
  summary: {
    totalCost: number
    hpp: number
    publishRate: number
    timeline: string
  }
  itemBreakdown: {
    no: number
    role: string
    qty: number
    months: number
    rate: number
  }[]
  itemBreakdownTotals: {
    totalQty: number
    totalMonths: number
    totalRate: number
  }
  financial: {
    statusMargin: { opexHpp: number; opexActual: number; status: string }
    grossProfitPublish: { value: number; percentage: number }
    grossProfitActual: { value: number; percentage: number }
    variance: { value: number; percentage: number }
  }
}

// ============================================================
// Formatting
// ============================================================
const fmtIDR = (n: number) => {
  if (n === 0) return "IDR 0"
  return "IDR " + Math.round(n).toLocaleString("id-ID")
}

// ============================================================
// Section Title
// ============================================================
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
      {children}
    </h3>
  )
}

// ============================================================
// Section 2: Item Breakdown Table
// ============================================================
function ItemBreakdownTable({
  items,
  totals,
}: {
  items: ScorecardData["itemBreakdown"]
  totals: ScorecardData["itemBreakdownTotals"]
}) {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%]">NO</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROLE</th>
            <th className="text-center py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]">QTY</th>
            <th className="text-center py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[15%]">MONTH(S)</th>
            <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[25%]">RATE</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.no} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.no}</td>
              <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">{item.role}</td>
              <td className="py-3 px-4 text-center text-slate-900 dark:text-white">{item.qty}</td>
              <td className="py-3 px-4 text-center text-slate-900 dark:text-white">{item.months}</td>
              <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-semibold">{fmtIDR(item.rate)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 dark:bg-blue-950/20 border-t border-slate-200 dark:border-slate-800">
            <td className="py-3 px-4 text-slate-400 dark:text-slate-500">—</td>
            <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">TOTAL</td>
            <td className="py-3 px-4 text-center text-slate-900 dark:text-white font-bold">{totals.totalQty}</td>
            <td className="py-3 px-4 text-center text-slate-900 dark:text-white font-bold">{totals.totalMonths}</td>
            <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-bold">{fmtIDR(totals.totalRate)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ============================================================
// Section 3: Top-Border Financial Card (simplified)
// ============================================================
function FinCard({
  borderColor,
  label,
  value,
  valueColor,
  badge,
  badgeColor,
}: {
  borderColor: string
  label: string
  value: string
  valueColor?: string
  badge: string
  badgeColor: string
}) {
  return (
    <Card className={`border-t-4 ${borderColor} border-slate-200 dark:border-slate-800`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
            <p className={`text-base font-bold ${valueColor || "text-slate-900 dark:text-white"} truncate`}>{value}</p>
          </div>
          <Badge className={`${badgeColor} border-0 text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0`}>
            {badge}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Cost Analysis Scorecard
// ============================================================
export default function CostAnalysisScorecard({ data }: { data: ScorecardData }) {
  const { summary, itemBreakdown, itemBreakdownTotals, financial } = data

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════
          SECTION 1: SUMMARY (2x2 Grid)
          ═══════════════════════════════════════════════════ */}
      <div>
        <SectionTitle>SUMMARY</SectionTitle>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2">
            {/* TOTAL COST — Top-left */}
            <div className="p-6 border-b border-r border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">TOTAL COST</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{fmtIDR(summary.totalCost)}</p>
            </div>
            {/* HPP — Top-right */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">HPP</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{fmtIDR(summary.hpp)}</p>
            </div>
            {/* PUBLISH RATE — Bottom-left */}
            <div className="p-6 border-r border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">PUBLISH RATE</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{fmtIDR(summary.publishRate)}</p>
            </div>
            {/* TIMELINE — Bottom-right */}
            <div className="p-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">TIMELINE</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.timeline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: ITEM BREAKDOWN TABLE
          ═══════════════════════════════════════════════════ */}
      {itemBreakdown.length > 0 && (
        <div>
          <SectionTitle>MANPOWER BREAKDOWN</SectionTitle>
          <ItemBreakdownTable items={itemBreakdown} totals={itemBreakdownTotals} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 3: FINANCIAL ANALYSIS (4 horizontal cards)
          ═══════════════════════════════════════════════════ */}
      <div>
        <SectionTitle>ANALISIS KEUANGAN</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 3.1 — STATUS MARGIN KOTOR (OPEX) — Amber */}
          <Card className="border-t-4 border-t-amber-500 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <p className="text-[0.65rem] text-slate-500 dark:text-slate-400 uppercase tracking-wider">STATUS MARGIN KOTOR (OPEX)</p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {financial.statusMargin.status}
              </Badge>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] text-slate-500 dark:text-slate-400">OPEX (HPP)</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{fmtIDR(financial.statusMargin.opexHpp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] text-slate-500 dark:text-slate-400">OPEX (Actual)</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{fmtIDR(financial.statusMargin.opexActual)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3.2 — GROSS PROFIT (PUBLISH RATE) — Green */}
          <FinCard
            borderColor="border-t-emerald-500"
            label="GROSS PROFIT (PUBLISH RATE)"
            value={fmtIDR(financial.grossProfitPublish.value)}
            badge={`${financial.grossProfitPublish.percentage.toFixed(1)}%`}
            badgeColor="bg-green-500/10 text-green-400"
          />

          {/* Card 3.3 — GROSS PROFIT (ACTUAL DEAL) — Orange */}
          <FinCard
            borderColor="border-t-orange-500"
            label="GROSS PROFIT (ACTUAL DEAL)"
            value={fmtIDR(financial.grossProfitActual.value)}
            valueColor={financial.grossProfitActual.value >= 0 ? "text-orange-500" : "text-red-500"}
            badge={`${financial.grossProfitActual.percentage.toFixed(1)}%`}
            badgeColor="bg-green-500/10 text-green-400"
          />

          {/* Card 3.4 — VARIANCE (QUOTATION VS ACTUAL) — Purple */}
          <FinCard
            borderColor="border-t-purple-500"
            label="VARIANCE (QUOTATION VS ACTUAL)"
            value={fmtIDR(financial.variance.value)}
            valueColor={financial.variance.value >= 0 ? "text-purple-500" : "text-red-500"}
            badge={`(${financial.variance.percentage.toFixed(1)}%)`}
            badgeColor={financial.variance.percentage >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Compute scorecard from raw stored payload
// ============================================================
export function computeScorecard(item: any): ScorecardData {
  const scheme = item.scheme_type || "manpower"
  const quotation = item.quotation_publish || 0
  const actual = item.actual_deal || 0
  const deductions = item.deductions_data || { pajak: 0, founderFee: 0, managementFee: 0, seFee: 0 }
  const topp = item.topp_data || { cogsPct: 25, opexPct: 75 }

  let totalHpp = item.manpower_total_hpp || 0
  let totalPublish = item.manpower_total_publish || 0
  let totalSpecial = 0
  let maxMonths = 0

  if (item.manpower_data?.length > 0) {
    totalSpecial = item.manpower_data.reduce((s: number, r: any) => s + (r.specialRate || 0) * (r.qty || 1) * (r.months || 1), 0)
    maxMonths = item.manpower_data.reduce((m: number, r: any) => Math.max(m, r.months || 1), 0)
  }

  if (scheme === "procurement") {
    totalHpp = item.procurement_total || 0
    if (item.procurement_data?.length > 0) {
      totalPublish = item.procurement_data.reduce((s: number, p: any) => s + (p.publish_rate || 0), 0)
    }
  }

  if (scheme === "product") {
    const procHpp = item.procurement_total || 0
    totalHpp = totalHpp + procHpp
    if (item.procurement_data?.length > 0) {
      const procPub = item.procurement_data.reduce((s: number, p: any) => s + (p.publish_rate || 0), 0)
      totalPublish = totalPublish + procPub
    }
  }

  const totalDeductions =
    totalPublish * ((deductions.pajak || 0) + (deductions.founderFee || 0) + (deductions.managementFee || 0) + (deductions.seFee || 0)) / 100
  const salesProject = totalPublish - totalDeductions

  const profitPublish = totalPublish - totalHpp
  const marginPublishPct = totalPublish > 0 ? (profitPublish / totalPublish) * 100 : 0
  const profitActual = actual - totalHpp
  const marginActualPct = actual > 0 ? (profitActual / actual) * 100 : 0
  const variance = quotation - actual
  const variancePct = quotation > 0 ? (variance / quotation) * 100 : 0
  const opexHpp = totalPublish > 0 ? (totalPublish - totalDeductions) * (topp.opexPct / 100) : 0
  const opexActual = actual * (topp.opexPct / 100)

  const months = maxMonths > 0 ? maxMonths : 1

  // Build item breakdown from manpower data
  const itemBreakdown = (item.manpower_data || []).map((r: any, i: number) => ({
    no: i + 1,
    role: r.role || r.nama || "—",
    qty: r.qty || 1,
    months: r.months || 1,
    rate: (r.publishRate || 0) * (r.qty || 1) * (r.months || 1),
  }))

  const itemBreakdownTotals = {
    totalQty: itemBreakdown.reduce((s: number, r: any) => s + r.qty, 0),
    totalMonths: itemBreakdown.length > 0 ? itemBreakdown.reduce((s: number, r: any) => s + r.months, 0) : 0,
    totalRate: itemBreakdown.reduce((s: number, r: any) => s + r.rate, 0),
  }

  return {
    summary: {
      totalCost: item.grand_total || totalPublish,
      hpp: totalHpp,
      publishRate: totalPublish,
      timeline: `${months} Month(s)`,
    },
    itemBreakdown,
    itemBreakdownTotals,
    financial: {
      statusMargin: { opexHpp, opexActual, status: opexActual > 0 ? "IDEAL" : "—" },
      grossProfitPublish: { value: profitPublish, percentage: marginPublishPct },
      grossProfitActual: { value: profitActual, percentage: marginActualPct },
      variance: { value: variance, percentage: variancePct },
    },
  }
}
