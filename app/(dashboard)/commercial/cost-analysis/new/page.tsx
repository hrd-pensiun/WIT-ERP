"use client"

import { useState, useMemo, useCallback, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Loader2, RefreshCw } from "lucide-react"
import {
  calculateSummary,
  fmtIDR,
  parseIDR,
  generateRowId,
  resetIdCounter,
  calculateProcurement,
  calcProcurementRow,
  fetchRateCards,
} from "@/lib/commercial-data"
import type { RateCardEntry, CalculatorRow, Deductions, ToppAllocation, SummaryResult, ProcurementItem, ProcurementSummary } from "@/lib/commercial-data"
import { insForge } from "@/lib/insforge"
import { useAuth } from "@/hooks/useAuth"

const PROJECT_TYPES = ["Consultant", "Networking", "Project", "Web", "WMS"]

const emptyRow = (): CalculatorRow => ({
  id: generateRowId(),
  group: "",
  role: "",
  nama: "",
  qty: 1,
  months: 1,
  hppRate: 0,
  specialRate: 0,
  publishRate: 0,
})

let procIdCounter = 0
const emptyProcItem = (): ProcurementItem => ({
  id: `proc_${++procIdCounter}`,
  itemName: "",
  spesifikasi: "",
  vendor: "",
  link: "",
  qty: 1,
  unitPrice: 0,
  total: 0,
  marginPct: 0,
  publishRate: 0,
})

export default function CostAnalysisNewPage({
  searchParams,
}: {
  searchParams: Promise<{ lead_id?: string; scheme?: string; id?: string }>
}) {
  const router = useRouter()
  const params = use(searchParams)
  const leadId = params.lead_id
  const scheme = params.scheme || "manpower"
  const editId = params.id
  const { user } = useAuth()
  const [rateCards, setRateCards] = useState<RateCardEntry[]>([])
  const [rateCardsLoading, setRateCardsLoading] = useState(true)
  const [leadInfo, setLeadInfo] = useState<{ title?: string; lead_number?: string; contact_name?: string; company_name?: string } | null>(null)
  const [editLoading, setEditLoading] = useState(!!editId)

  useEffect(() => {
    if (!leadId) router.push("/commercial/leads")
  }, [leadId, router])

  useEffect(() => {
    fetchRateCards().then((cards) => {
      setRateCards(cards)
      setRateCardsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!insForge || !leadId) return
    insForge.from("crm_leads").select("title, lead_number, contact_name, company_name").eq("id", leadId).single()
      .then(({ data }: any) => {
        if (data) setLeadInfo(data)
      })
  }, [leadId])

  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState("")

  // Man Power state
  const [type, setType] = useState("Consultant")
  const [mpRows, setMpRows] = useState<CalculatorRow[]>([emptyRow(), emptyRow()])
  const [deductions, setDeductions] = useState<Deductions>({ pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 })
  const [topp, setTopp] = useState<ToppAllocation>({ cogsPct: 25, opexPct: 75 })

  // Procurement state
  const [procItems, setProcItems] = useState<ProcurementItem[]>([])
  const [instalasiCost, setInstalasiCost] = useState(0)
  const [commissioningCost, setCommissioningCost] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)

  // Common pricing
  const [quotationRaw, setQuotationRaw] = useState("")
  const [actualDealRaw, setActualDealRaw] = useState("")

  // ── Load existing data for editing ──
  useEffect(() => {
    if (!editId || !insForge) return
    ;(async () => {
      try {
        const { data, error }: any = await insForge!.from("lead_cost_analyses")
          .select("*")
          .eq("id", editId)
          .is("deleted_at", null)
          .single()
        if (data && !error) {
          // Pre-populate manpower rows
          if (Array.isArray(data.manpower_data) && data.manpower_data.length > 0) {
            setMpRows(data.manpower_data.map((m: any) => ({
              id: generateRowId(),
              group: m.group || "",
              role: m.role || "",
              nama: m.nama || "",
              qty: m.qty ?? 1,
              months: m.months ?? 1,
              hppRate: m.hppRate ?? 0,
              specialRate: m.specialRate ?? 0,
              publishRate: m.publishRate ?? 0,
            })))
            // Infer project type from first manpower row's group
            const first = data.manpower_data[0]
            if (first?.group) {
              const found = rateCards.find((rc) => rc.group === first.group)
              if (found) setType(found.type)
            }
          }
          // Deductions & TOPP
          if (data.deductions_data && typeof data.deductions_data === "object") {
            setDeductions({
              pajak: data.deductions_data.pajak ?? 11,
              founderFee: data.deductions_data.founderFee ?? 3,
              managementFee: data.deductions_data.managementFee ?? 2,
              seFee: data.deductions_data.seFee ?? 0,
            })
          }
          if (data.topp_data && typeof data.topp_data === "object") {
            setTopp({
              cogsPct: data.topp_data.cogsPct ?? 25,
              opexPct: data.topp_data.opexPct ?? 75,
            })
          }
          // Pricing
          if (data.quotation_publish) setQuotationRaw(fmtIDR(data.quotation_publish))
          if (data.actual_deal) setActualDealRaw(fmtIDR(data.actual_deal))
          // Notes
          if (data.notes) setNotes(data.notes)
        }
      } catch { /* ignore */ }
      setEditLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const quotation = parseIDR(quotationRaw)
  const actualDeal = parseIDR(actualDealRaw)

  // Local helpers that use fetched rateCards
  const getGroupsFromCards = useCallback((type: string): string[] => {
    const groups = new Set<string>()
    for (const rc of rateCards) {
      if (rc.type === type) groups.add(rc.group)
    }
    return Array.from(groups)
  }, [rateCards])

  const getRolesFromCards = useCallback((type: string, group: string): RateCardEntry[] => {
    return rateCards.filter((rc) => rc.type === type && rc.group === group)
  }, [rateCards])

  const getRoleEntryFromCards = useCallback((type: string, group: string, role: string): RateCardEntry | undefined => {
    return rateCards.find((rc) => rc.type === type && rc.group === group && rc.role === role)
  }, [rateCards])

  const isManpower = scheme === "manpower" || scheme === "product"
  const isProcurement = scheme === "procurement" || scheme === "product"

  // Calculate manpower summary
  const mpSummary = useMemo<SummaryResult>(
    () => calculateSummary(mpRows, deductions, topp, isNaN(quotation) ? 0 : quotation, isNaN(actualDeal) ? 0 : actualDeal),
    [mpRows, deductions, topp, quotation, actualDeal],
  )

  // Calculate procurement summary
  const procSummary = useMemo<ProcurementSummary>(
    () => calculateProcurement(procItems, instalasiCost, commissioningCost, shippingCost),
    [procItems, instalasiCost, commissioningCost, shippingCost],
  )

  // Unified display values for right panel (works across all schemes)
  const dHpp = isManpower ? mpSummary.totalHpp : procSummary.subtotal
  const dPublish = isManpower ? mpSummary.totalPublish : procSummary.totalPublish
  const dSpecial = isManpower ? mpSummary.totalSpecial : 0
  const dSales = isManpower ? mpSummary.salesProject : 0
  const dProfitPub = isManpower ? mpSummary.profitPublish : (procSummary.totalPublish - procSummary.subtotal)
  const dMarginPubPct = dPublish > 0 ? (dProfitPub / dPublish) * 100 : 0
  const dProfitActual = isManpower ? mpSummary.profitActual : (actualDeal - procSummary.subtotal)
  const dMarginActualPct = actualDeal > 0 ? (dProfitActual / actualDeal) * 100 : 0
  const dVariance = isManpower ? mpSummary.variance : (quotation - actualDeal)
  const dVariancePct = isManpower ? mpSummary.variancePct : (quotation > 0 ? (dVariance / quotation) * 100 : 0)
  const dOpexHpp = isManpower ? mpSummary.opexAmount : 0
  const dOpexActual = isManpower ? (actualDeal * (topp.opexPct / 100)) : 0
  const showCards = quotation > 0 && actualDeal > 0
  const discFromPublish = dPublish > 0 ? ((actualDeal - dPublish) / dPublish) * 100 : 0
  const discFromSpecial = dSpecial > 0 ? ((actualDeal - dSpecial) / dSpecial) * 100 : 0

  const handleTypeChange = useCallback((newType: string) => {
    setType(newType)
    resetIdCounter()
    setMpRows([emptyRow(), emptyRow()])
  }, [])

  const addMpRow = useCallback(() => {
    setMpRows((prev) => [...prev, emptyRow()])
  }, [])

  const removeMpRow = useCallback((id: string) => {
    setMpRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }, [])

  const updateMpRow = useCallback((id: string, field: keyof CalculatorRow, value: unknown) => {
    setMpRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }
        if (field === "group") {
          updated.role = ""
          updated.hppRate = 0
          updated.specialRate = 0
          updated.publishRate = 0
          updated.selectedRoleIndex = undefined
        }
        if (field === "role" && typeof value === "string" && value) {
          const entry = getRoleEntryFromCards(type, r.group, value)
          if (entry) {
            updated.hppRate = entry.hpp
            updated.specialRate = entry.specialRate
            updated.publishRate = entry.publishRate
          }
        }
        return updated
      }),
    )
  }, [type, getRoleEntryFromCards])

  const addProcItem = useCallback(() => {
    setProcItems((prev) => [...prev, emptyProcItem()])
  }, [])

  const removeProcItem = useCallback((id: string) => {
    setProcItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev))
  }, [])

  const updateProcItem = useCallback((id: string, field: keyof ProcurementItem, value: string | number) => {
    setProcItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "qty" || field === "unitPrice") {
          const q = field === "qty" ? Number(value) : item.qty
          const p = field === "unitPrice" ? Number(value) : item.unitPrice
          updated.total = calcProcurementRow(q, p)
        }
        if (field === "qty" || field === "unitPrice" || field === "marginPct") {
          const margin = field === "marginPct" ? Number(value) : item.marginPct
          updated.publishRate = margin > 0 ? updated.total * (1 + margin / 100) : updated.total
        }
        return updated
      }),
    )
  }, [])

  const handleSave = async () => {
    if (!insForge) return
    setSaving(true)
    try {
      const payload: any = {
        lead_id: leadId,
        scheme_type: "manpower",
        notes: notes || null,
        quotation_publish: isNaN(quotation) ? 0 : quotation,
        actual_deal: isNaN(actualDeal) ? 0 : actualDeal,
        created_by: user?.id || null,
      }

      payload.manpower_data = mpRows.map((r) => ({
        group: r.group,
        role: r.role,
        nama: r.nama,
        qty: r.qty,
        months: r.months,
        hppRate: r.hppRate,
        specialRate: r.specialRate,
        publishRate: r.publishRate,
      }))
      payload.manpower_total_hpp = mpSummary.totalHpp
      payload.manpower_total_publish = mpSummary.totalPublish
      payload.deductions_data = deductions
      payload.topp_data = topp

      // Grand total
      const mpTotal = mpSummary.totalPublish
      payload.grand_total = mpTotal

      // Margin %
      if (payload.grand_total > 0) {
        const totalHpp = mpSummary.totalHpp
        payload.margin_pct = ((payload.grand_total - totalHpp) / payload.grand_total) * 100
      } else {
        payload.margin_pct = 0
      }

      if (editId) {
        const { error } = await insForge.from("lead_cost_analyses").update(payload).eq("id", editId)
        if (error) throw error
      } else {
        const { error } = await insForge.from("lead_cost_analyses").insert(payload)
        if (error) throw error
      }
      router.push(`/commercial/leads/${leadId}`)
    } catch (err) {
      console.error("Failed to save cost analysis:", err)
      setSaving(false)
    }
  }

  const SCHEME_LABELS: Record<string, string> = {
    manpower: "Man Power Based",
    procurement: "Procurement",
    product: "Product Based",
  }

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{editId ? "Edit Cost Analysis" : "Cost Analysis"}</h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">{SCHEME_LABELS[scheme]}</Badge>
          </div>
          {leadInfo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {leadInfo.title || leadInfo.contact_name || "Lead"}{leadInfo.lead_number ? ` (${leadInfo.lead_number})` : ""}
            </p>
          )}
        </div>
      </div>

      {/* ─── 70/30 LAYOUT ─── */}
      {editLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ═══════════════════════════════════════════════════
            LEFT PANEL (70%)
            ═══════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[70%] space-y-4">

          {/* ── MANPOWER SECTION ── */}
          {isManpower && (
            <>
              {/* Project Type Tabs */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Project type</Label>
                  <div className="flex gap-1 flex-wrap">
                    {PROJECT_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => handleTypeChange(t)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          type === t
                            ? "bg-[#00A896]/10 border-[#00A896] text-[#00A896] font-medium"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Manpower Table */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">MANPOWER CALCULATOR</h3>
                    <Button size="sm" variant="outline" onClick={addMpRow} className="border-[#00A896] text-[#00A896] hover:bg-[#00A896]/5 h-7 text-xs gap-1">
                      <Plus className="w-3 h-3" /> Add Manpower
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-1 font-semibold text-muted-foreground">NO</th>
                          <th className="text-left py-2 px-1 font-semibold text-muted-foreground">GROUP</th>
                          <th className="text-left py-2 px-1 font-semibold text-muted-foreground">ROLE</th>
                          <th className="text-left py-2 px-1 font-semibold text-muted-foreground">NAME</th>
                          <th className="text-center py-2 px-1 font-semibold text-muted-foreground">QTY</th>
                          <th className="text-center py-2 px-1 font-semibold text-muted-foreground">MONTHS</th>
                          <th className="text-right py-2 px-1 font-semibold text-muted-foreground">RATE</th>
                          <th className="w-8 py-2 pl-1" />
                        </tr>
                      </thead>
                      <tbody>
                        {mpRows.map((row, idx) => {
                          const groups = getGroupsFromCards(type)
                          const roles = getRolesFromCards(type, row.group)
                          return (
                            <tr key={row.id} className="border-b border-border/50">
                              <td className="py-2 pr-1 text-muted-foreground">{idx + 1}</td>
                              <td className="py-2 px-1">
                                <select
                                  value={row.group}
                                  onChange={(e) => updateMpRow(row.id, "group", e.target.value)}
                                  className="w-28 px-2 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Select Group</option>
                                  {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-1">
                                <select
                                  value={row.role}
                                  onChange={(e) => updateMpRow(row.id, "role", e.target.value)}
                                  className="w-36 px-2 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  disabled={!row.group}
                                >
                                  <option value="">Select Role</option>
                                  {roles.map((r) => <option key={r.role} value={r.role}>{r.role}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-1">
                                <Input
                                  value={row.nama}
                                  onChange={(e) => updateMpRow(row.id, "nama", e.target.value)}
                                  placeholder="Name"
                                  className="bg-background border-input text-xs h-8 w-24"
                                />
                              </td>
                              <td className="py-2 px-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={row.qty}
                                  onChange={(e) => updateMpRow(row.id, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-14 px-2 py-1.5 rounded-lg border border-input bg-background text-xs text-center text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={row.months}
                                  onChange={(e) => updateMpRow(row.id, "months", Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-14 px-2 py-1.5 rounded-lg border border-input bg-background text-xs text-center text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-1 text-right font-medium text-foreground">
                                {row.publishRate > 0 ? fmtIDR(row.publishRate) : "IDR 0"}
                              </td>
                              <td className="py-2 pl-1">
                                <button
                                  onClick={() => removeMpRow(row.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* MP Totals */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>Total HPP: <span className="font-semibold text-foreground">{fmtIDR(mpSummary.totalHpp)}</span></span>
                    <span className="text-muted-foreground">|</span>
                    <span>Total Publish: <span className="font-semibold text-foreground">{fmtIDR(mpSummary.totalPublish)}</span></span>
                    <span className="text-muted-foreground">|</span>
                    <span>Timeline: <span className="font-semibold text-foreground">{mpSummary.maxMonths} Month(s)</span></span>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Deductions */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground">COST DEDUCTIONS (% FROM PUBLISH RATE)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {([
                      { key: "pajak", label: "Tax (%)" },
                      { key: "founderFee", label: "Founder Fee (%)" },
                      { key: "managementFee", label: "Management Fee (%)" },
                      { key: "seFee", label: "SE/Marketing Fee (%)" },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[0.55rem] text-muted-foreground">{label}</Label>
                        <Input
                          type="number"
                          value={deductions[key]}
                          onChange={(e) => setDeductions((d) => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))}
                          className="bg-white dark:bg-background border-input text-xs h-8 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* TOPP Allocation */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground">TOPP ALLOCATION (% FROM SALES PROJECT)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[0.55rem] text-muted-foreground">COGS TOPP (%)</Label>
                      <Input
                        type="number"
                        value={topp.cogsPct}
                        onChange={(e) => setTopp((t) => ({ cogsPct: parseFloat(e.target.value) || 0, opexPct: Math.max(0, 100 - (parseFloat(e.target.value) || 0)) }))}
                        className="bg-white dark:bg-background border-input text-xs h-8 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[0.55rem] text-muted-foreground">OPEX Allocation (%)</Label>
                      <Input
                        type="number"
                        value={topp.opexPct}
                        onChange={(e) => setTopp((t) => ({ opexPct: parseFloat(e.target.value) || 0, cogsPct: Math.max(0, 100 - (parseFloat(e.target.value) || 0)) }))}
                        className="bg-white dark:bg-background border-input text-xs h-8 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[0.5rem] text-amber-500">COGS TOPP + OPEX Allocation must = 100%</p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── PROCUREMENT SECTION ── */}
          {isProcurement && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">PROCUREMENT ITEMS</h3>
                  <Button size="sm" variant="outline" onClick={addProcItem} className="border-border h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Tambah Item
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-1 font-semibold text-muted-foreground">#</th>
                        <th className="text-left py-2 px-1 font-semibold text-muted-foreground">Nama Barang</th>
                        <th className="text-left py-2 px-1 font-semibold text-muted-foreground hidden sm:table-cell">Spesifikasi</th>
                        <th className="text-left py-2 px-1 font-semibold text-muted-foreground hidden sm:table-cell">Vendor</th>
                        <th className="text-left py-2 px-1 font-semibold text-muted-foreground hidden lg:table-cell">Link</th>
                        <th className="text-center py-2 px-1 font-semibold text-muted-foreground">Qty</th>
                        <th className="text-right py-2 px-1 font-semibold text-muted-foreground">Harga</th>
                        <th className="text-right py-2 px-1 font-semibold text-muted-foreground hidden md:table-cell">Total</th>
                        <th className="text-center py-2 px-1 font-semibold text-muted-foreground hidden lg:table-cell">Margin %</th>
                        <th className="text-right py-2 px-1 font-semibold text-muted-foreground hidden lg:table-cell">Publish</th>
                        <th className="w-8 py-2 pl-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {procItems.length === 0 ? (
                        <tr><td colSpan={11} className="py-6 text-center text-muted-foreground">Belum ada item procurement.</td></tr>
                      ) : (
                        procItems.map((item, idx) => (
                          <tr key={item.id} className="border-b border-border/50">
                            <td className="py-2 pr-1 text-muted-foreground">{idx + 1}</td>
                            <td className="py-2 px-1">
                              <Input value={item.itemName} onChange={(e) => updateProcItem(item.id, "itemName", e.target.value)} placeholder="Nama barang" className="bg-background border-border text-xs h-8 min-w-[110px]" />
                            </td>
                            <td className="py-2 px-1 hidden sm:table-cell">
                              <Input value={item.spesifikasi} onChange={(e) => updateProcItem(item.id, "spesifikasi", e.target.value)} placeholder="Spesifikasi" className="bg-background border-border text-xs h-8 min-w-[90px]" />
                            </td>
                            <td className="py-2 px-1 hidden sm:table-cell">
                              <Input value={item.vendor} onChange={(e) => updateProcItem(item.id, "vendor", e.target.value)} placeholder="Vendor" className="bg-background border-border text-xs h-8 min-w-[80px]" />
                            </td>
                            <td className="py-2 px-1 hidden lg:table-cell">
                              <Input value={item.link} onChange={(e) => updateProcItem(item.id, "link", e.target.value)} placeholder="https://" className="bg-background border-border text-xs h-8 min-w-[90px]" />
                            </td>
                            <td className="py-2 px-1">
                              <Input type="number" min={1} value={item.qty} onChange={(e) => updateProcItem(item.id, "qty", Math.max(1, parseInt(e.target.value) || 1))} className="bg-background border-border text-xs h-8 w-14 text-center" />
                            </td>
                            <td className="py-2 px-1">
                              <Input type="number" min={0} value={item.unitPrice} onChange={(e) => updateProcItem(item.id, "unitPrice", Math.max(0, parseInt(e.target.value) || 0))} className="bg-background border-border text-xs h-8 w-24 text-right" />
                            </td>
                            <td className="py-2 px-1 text-right font-medium text-foreground hidden md:table-cell">{item.total > 0 ? fmtIDR(item.total) : "-"}</td>
                            <td className="py-2 px-1 hidden lg:table-cell">
                              <Input type="number" min={0} step={0.1} value={item.marginPct} onChange={(e) => updateProcItem(item.id, "marginPct", Math.max(0, parseFloat(e.target.value) || 0))} className="bg-background border-border text-xs h-8 w-16 text-center" />
                            </td>
                            <td className="py-2 px-1 text-right font-medium text-foreground hidden lg:table-cell">{item.publishRate > 0 ? fmtIDR(item.publishRate) : "-"}</td>
                            <td className="py-2 pl-1">
                              <button onClick={() => removeProcItem(item.id)} className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Instalasi, Commissioning, Shipping */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Biaya Instalasi (opsional)</Label>
                    <Input type="number" min={0} value={instalasiCost} onChange={(e) => setInstalasiCost(Math.max(0, parseInt(e.target.value) || 0))} placeholder="0" className="bg-background border-border text-sm h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Biaya Commissioning (opsional)</Label>
                    <Input type="number" min={0} value={commissioningCost} onChange={(e) => setCommissioningCost(Math.max(0, parseInt(e.target.value) || 0))} placeholder="0" className="bg-background border-border text-sm h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Biaya Shipping (opsional)</Label>
                    <Input type="number" min={0} value={shippingCost} onChange={(e) => setShippingCost(Math.max(0, parseInt(e.target.value) || 0))} placeholder="0" className="bg-background border-border text-sm h-9" />
                  </div>
                </div>

                {/* Procurement Summary */}
                <Card className="border-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div><p className="text-[0.55rem] text-muted-foreground">Total Barang</p><p className="text-sm font-semibold text-foreground">{fmtIDR(procSummary.subtotal)}</p></div>
                      <div><p className="text-[0.55rem] text-muted-foreground">Instalasi</p><p className="text-sm font-semibold text-foreground">{fmtIDR(procSummary.instalasiCost)}</p></div>
                      <div><p className="text-[0.55rem] text-muted-foreground">Commissioning</p><p className="text-sm font-semibold text-foreground">{fmtIDR(procSummary.commissioningCost)}</p></div>
                      <div><p className="text-[0.55rem] text-muted-foreground">Shipping</p><p className="text-sm font-semibold text-foreground">{fmtIDR(procSummary.shippingCost)}</p></div>
                      <div><p className="text-[0.55rem] text-muted-foreground">Total Publish</p><p className="text-sm font-semibold text-foreground">{procSummary.totalPublish > 0 ? fmtIDR(procSummary.totalPublish) : "—"}</p></div>
                      <div><p className="text-[0.55rem] text-muted-foreground">Grand Total</p><p className="text-sm font-semibold text-blue-400">{fmtIDR(procSummary.grandTotal)}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            RIGHT PANEL (30%)
            ═══════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[30%] space-y-4">

          {/* Quotation Publish */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">QUOTATION PUBLISH (INITIAL PLAN)</Label>
                <span className="text-[0.55rem] text-muted-foreground">
                  vs Publish Rate: {dPublish > 0 ? ((isNaN(quotation) ? 0 : quotation) / dPublish * 100).toFixed(1) : "0"}%
                </span>
              </div>
              <Input
                value={quotationRaw}
                onChange={(e) => setQuotationRaw(e.target.value)}
                placeholder="IDR 20.000.000"
                className="bg-white dark:bg-background border-input text-sm h-9 font-mono focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* Actual Deal */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-xs text-muted-foreground">ACTUAL DEAL</Label>
              <Input
                value={actualDealRaw}
                onChange={(e) => setActualDealRaw(e.target.value)}
                placeholder="IDR 20.000.000"
                className="bg-white dark:bg-background border-input text-sm h-9 font-mono focus:border-blue-500"
              />
              <div className="flex justify-between text-[0.55rem] text-muted-foreground">
                <span>Discount dari Publish: <span className={discFromPublish < 0 ? "text-red-400" : "text-green-400"}>{discFromPublish.toFixed(1)}%</span></span>
                <span>Discount dari Special Rate: <span className={discFromSpecial < 0 ? "text-red-400" : "text-green-400"}>{discFromSpecial.toFixed(1)}%</span></span>
              </div>
            </CardContent>
          </Card>

          {/* Publish Project Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white gap-2 h-10 text-sm font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {editId ? "Update Cost Analysis" : "Publish Cost Analysis"}
          </Button>

          {/* Rate Summary Cards */}
          <Card className="border-l-4 border-l-[#00A896]">
            <CardContent className="p-4">
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">PUBLISH RATE (RECOMMENDED)</p>
              <p className="text-lg font-bold text-[#00A896] mt-1">{fmtIDR(dPublish)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-4">
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">HPP TOTAL (FLOOR)</p>
              <p className="text-lg font-bold text-foreground mt-1">{fmtIDR(dHpp)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-400">
            <CardContent className="p-4">
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">SPECIAL RATE TOTAL (CEILING)</p>
              <p className="text-lg font-bold text-purple-400 mt-1">{dSpecial > 0 ? fmtIDR(dSpecial) : "—"}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-400">
            <CardContent className="p-4">
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">SALES PROJECT (AFTER DEDUCTION)</p>
              <p className="text-lg font-bold text-green-400 mt-1">{dSales > 0 ? fmtIDR(dSales) : "—"}</p>
            </CardContent>
          </Card>

          {/* ── CONDITIONAL SUMMARY CARDS ── */}
          {showCards && (
            <>
              <Card className="border-teal-200 dark:border-teal-800/40">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <h4 className="text-xs font-semibold text-foreground">STATUS MARGIN KOTOR (OPEX)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                      <p className="text-[0.5rem] text-muted-foreground">OPEX (HPP)</p>
                      <p className="text-xs font-semibold text-foreground">{fmtIDR(dOpexHpp)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                      <p className="text-[0.5rem] text-muted-foreground">OPEX (Actual)</p>
                      <p className="text-xs font-semibold text-foreground">{fmtIDR(dOpexActual)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">GROSS PROFIT (PUBLISH RATE)</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{fmtIDR(dProfitPub)}</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{dMarginPubPct.toFixed(1)}%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">GROSS PROFIT (ACTUAL DEAL)</p>
                      <p className="text-2xl font-bold text-orange-400 mt-1">{actualDeal > 0 ? fmtIDR(dProfitActual) : "—"}</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{dMarginActualPct.toFixed(1)}%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">VARIANCE (QUOTATION VS ACTUAL)</p>
                      <p className="text-2xl font-bold text-purple-400 mt-1">{fmtIDR(dVariance)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">({dVariancePct.toFixed(1)}%)</Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Notes */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Catatan</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan cost analysis..."
                rows={2}
                className="bg-background border-border text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}
