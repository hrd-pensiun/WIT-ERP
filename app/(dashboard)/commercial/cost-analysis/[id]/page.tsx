"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { insForge } from "@/lib/insforge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import CostAnalysisScorecard, { computeScorecard } from "@/components/leads/cost-analysis-scorecard"
import type { ScorecardData } from "@/components/leads/cost-analysis-scorecard"

const fmtIDR = (n: number) => {
  if (n === 0) return "Rp 0"
  return "Rp " + Math.round(n).toLocaleString("id-ID")
}

const SCHEME_LABELS: Record<string, string> = {
  manpower: "Man Power Based",
  procurement: "Procurement",
  product: "Product Based",
}

const SCHEME_CATEGORY: Record<string, string> = {
  manpower: "Man Power Based",
  procurement: "Equipment Cost",
  product: "Operational Cost",
}

export default function CostAnalysisDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lead_id?: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const { lead_id } = use(searchParams)
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null)

  useEffect(() => {
    if (!lead_id || !id || !insForge) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const { data, error }: any = await insForge!.from("lead_cost_analyses")
          .select("*")
          .eq("id", id)
          .is("deleted_at", null)
          .single()
        if (data && !error) {
          setItem(data)
          setScorecard(computeScorecard(data))
        }
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [lead_id, id])

  if (!lead_id) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Lead ID tidak ditemukan.
        <Button variant="link" onClick={() => router.back()}>Kembali</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!item || !scorecard) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Cost Analysis tidak ditemukan.
        <Button variant="link" onClick={() => router.back()}>Kembali</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Cost Analysis Detail</h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
              {SCHEME_LABELS[item.scheme_type] || item.scheme_type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ID: <code className="text-emerald-500 font-mono bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded text-[0.6rem]">{id}</code>
          </p>
        </div>
      </div>

      {/* Stored Data Summary */}
      {item.manpower_data?.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Man Power</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Role</th>
                    <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Months</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">HPP</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Special</th>
                    <th className="text-right py-2 pl-2 font-semibold text-muted-foreground">Publish</th>
                  </tr>
                </thead>
                <tbody>
                  {item.manpower_data.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-2 text-foreground">{r.role || r.nama || "—"}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{r.qty}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{r.months}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{fmtIDR(r.hppRate || 0)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{fmtIDR(r.specialRate || 0)}</td>
                      <td className="py-2 pl-2 text-right text-foreground font-medium">{fmtIDR(r.publishRate || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {item.procurement_data?.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Procurement Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Item</th>
                    <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Harga</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Total</th>
                    <th className="text-right py-2 pl-2 font-semibold text-muted-foreground">Publish</th>
                  </tr>
                </thead>
                <tbody>
                  {item.procurement_data.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-2 text-foreground">{p.item_name || "—"}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{p.qty}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{fmtIDR(p.unit_price || 0)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{fmtIDR(p.total || 0)}</td>
                      <td className="py-2 pl-2 text-right text-foreground font-medium">{fmtIDR(p.publish_rate || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deductions & Pricing Info */}
      {item.deductions_data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {item.deductions_data && (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-3">
                <p className="text-[0.55rem] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Deductions</p>
                <div className="space-y-1 text-xs">
                  <p className="flex justify-between"><span className="text-muted-foreground">Pajak</span><span>{item.deductions_data.pajak || 0}%</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Founder Fee</span><span>{item.deductions_data.founderFee || 0}%</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Management Fee</span><span>{item.deductions_data.managementFee || 0}%</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">SE Fee</span><span>{item.deductions_data.seFee || 0}%</span></p>
                </div>
              </CardContent>
            </Card>
          )}
          {item.topp_data && (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-3">
                <p className="text-[0.55rem] text-muted-foreground uppercase tracking-wider font-semibold mb-2">TOPP</p>
                <div className="space-y-1 text-xs">
                  <p className="flex justify-between"><span className="text-muted-foreground">COGS</span><span>{item.topp_data.cogsPct || 0}%</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">OPEX</span><span>{item.topp_data.opexPct || 0}%</span></p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-3">
              <p className="text-[0.55rem] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Pricing</p>
              <div className="space-y-1 text-xs">
                <p className="flex justify-between"><span className="text-muted-foreground">Quotation</span><span className="font-medium">{fmtIDR(item.quotation_publish || 0)}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Actual Deal</span><span className="font-medium">{fmtIDR(item.actual_deal || 0)}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Grand Total</span><span className="font-medium text-emerald-400">{fmtIDR(item.grand_total || 0)}</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scorecard */}
      <CostAnalysisScorecard data={scorecard} />

      {item.notes && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-[0.55rem] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Catatan</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{item.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
