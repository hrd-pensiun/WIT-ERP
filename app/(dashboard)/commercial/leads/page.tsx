"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  Target, Plus, Eye, Edit3, Trash2,
  Search, TrendingUp, DollarSign, CheckCircle2, LayoutGrid, Table2,
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────
interface Lead {
  id: string
  lead_number: string | null
  title: string | null
  contact_name: string
  company_name: string | null
  lead_source: string | null
  estimated_value: number | null
  status: string | null
  priority: string | null
  probability: number | null
  bant_score: number | null
  created_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const ALL_STATUSES = [
  "new", "contacted", "qualified", "proposal",
  "negotiation", "closed_won", "closed_lost",
]

const ACTIVE_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation"]

const STATUS_LABEL: Record<string, string> = {
  new:          "New",
  contacted:    "Contacted",
  qualified:    "Qualified",
  proposal:     "Proposal",
  negotiation:  "Negotiation",
  closed_won:   "Closed Won",
  closed_lost:  "Closed Lost",
}

const STATUS_STYLE: Record<string, string> = {
  new:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted:    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  qualified:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  proposal:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  negotiation:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  closed_won:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed_lost:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-500",
  medium: "bg-amber-400",
  low:    "bg-zinc-400",
}

const KANBAN_COLS = ["new", "contacted", "qualified", "proposal", "negotiation"]

// Funnel stage colors as CSS classes (bg + text)
const FUNNEL_COLORS: Record<string, { bar: string; text: string; value: string }> = {
  new:         { bar: "bg-blue-500",   text: "text-blue-700 dark:text-blue-400",   value: "text-blue-600 dark:text-blue-300" },
  contacted:   { bar: "bg-amber-500",  text: "text-amber-700 dark:text-amber-400", value: "text-amber-600 dark:text-amber-300" },
  qualified:   { bar: "bg-purple-500", text: "text-purple-700 dark:text-purple-400", value: "text-purple-600 dark:text-purple-300" },
  proposal:    { bar: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-400", value: "text-indigo-600 dark:text-indigo-300" },
  negotiation: { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-400", value: "text-orange-600 dark:text-orange-300" },
}

const SOURCE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f97316", "#71717a"]

const PRIORITY_COLORS: Record<string, { bar: string; label: string }> = {
  urgent: { bar: "bg-red-500",    label: "Urgent" },
  high:   { bar: "bg-orange-500", label: "High" },
  medium: { bar: "bg-amber-400",  label: "Medium" },
  low:    { bar: "bg-zinc-400",   label: "Low" },
}

function fmtIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function fmtIDRShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return fmtIDR(n)
}

// ── Infographics Section ───────────────────────────────────────────────────
function LeadInfographics({ leads }: { leads: Lead[] }) {
  const activeLeads = useMemo(() => leads.filter((l) => ACTIVE_STATUSES.includes(l.status ?? "new")), [leads])
  const totalActive = activeLeads.length

  // 1. Funnel data
  const funnelData = useMemo(() =>
    ACTIVE_STATUSES.map((s) => {
      const group = leads.filter((l) => (l.status ?? "new") === s)
      return {
        status: s,
        count: group.length,
        value: group.reduce((acc, l) => acc + (l.estimated_value ?? 0), 0),
      }
    }),
    [leads]
  )
  const maxFunnelCount = Math.max(...funnelData.map((d) => d.count), 1)

  // 2. Source breakdown
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {}
    leads.forEach((l) => {
      const src = l.lead_source || "unknown"
      map[src] = (map[src] || 0) + 1
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    const top5 = sorted.slice(0, 5)
    const rest = sorted.slice(5).reduce((acc, [, v]) => acc + v, 0)
    const result = top5.map(([name, count]) => ({ name, count }))
    if (rest > 0) result.push({ name: "Lainnya", count: rest })
    return result
  }, [leads])

  const totalSourceCount = sourceData.reduce((s, d) => s + d.count, 0) || 1

  // 3. Priority distribution
  const priorityData = useMemo(() =>
    ["urgent", "high", "medium", "low"].map((p) => ({
      key: p,
      count: leads.filter((l) => (l.priority ?? "medium") === p).length,
    })),
    [leads]
  )
  const maxPriority = Math.max(...priorityData.map((d) => d.count), 1)

  // 4. BANT average
  const bantLeads = activeLeads.filter((l) => l.bant_score != null)
  const bantAvg = bantLeads.length > 0
    ? Math.round(bantLeads.reduce((s, l) => s + (l.bant_score ?? 0), 0) / bantLeads.length)
    : null

  const bantColor = bantAvg == null
    ? "text-zinc-400"
    : bantAvg >= 70 ? "text-emerald-600 dark:text-emerald-400"
    : bantAvg >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-red-500"

  if (leads.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Row 1: Full-width funnel */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Lead Funnel — Pipeline Aktif
        </p>
        <div className="space-y-2">
          {funnelData.map((d) => {
            const pct = totalActive > 0 ? Math.round((d.count / maxFunnelCount) * 100) : 0
            const colors = FUNNEL_COLORS[d.status]
            return (
              <div key={d.status} className="flex items-center gap-3">
                <span className={cn("text-[0.65rem] font-medium w-20 shrink-0", colors.text)}>
                  {STATUS_LABEL[d.status]}
                </span>
                <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", colors.bar)}
                    style={{ width: `${Math.max(pct, d.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-5 text-right tabular-nums">
                  {d.count}
                </span>
                <span className={cn("text-[0.65rem] w-24 text-right tabular-nums shrink-0", colors.value)}>
                  {d.value > 0 ? fmtIDRShort(d.value) : "—"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Row 2: Source + Priority + BANT — 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Source Donut */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Lead Source
          </p>
          {sourceData.length > 0 ? (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    innerRadius={24}
                    outerRadius={38}
                    strokeWidth={1}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1 min-w-0">
                {sourceData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                      />
                      <span className="text-[0.6rem] text-zinc-600 dark:text-zinc-400 capitalize truncate">
                        {d.name}
                      </span>
                    </div>
                    <span className="text-[0.6rem] font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      {Math.round((d.count / totalSourceCount) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-zinc-400">Belum ada data</div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Priority Distribution
          </p>
          <div className="space-y-2.5">
            {priorityData.map((d) => {
              const pct = Math.round((d.count / maxPriority) * 100)
              const cfg = PRIORITY_COLORS[d.key]
              return (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="text-[0.65rem] font-medium text-zinc-500 dark:text-zinc-400 w-14 shrink-0 capitalize">
                    {cfg.label}
                  </span>
                  <div className="flex-1 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", cfg.bar)}
                      style={{ width: `${Math.max(pct, d.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] font-semibold text-zinc-700 dark:text-zinc-300 w-4 text-right tabular-nums">
                    {d.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* BANT Score */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between">
          <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Rata-rata BANT Score
          </p>
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            {bantAvg != null ? (
              <>
                <span className={cn("text-4xl font-bold tabular-nums", bantColor)}>
                  {bantAvg}
                </span>
                <span className="text-[0.6rem] text-zinc-400 mt-1">dari 100 poin</span>
                {/* Visual gauge bar */}
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      bantAvg >= 70 ? "bg-emerald-500" : bantAvg >= 40 ? "bg-amber-400" : "bg-red-500"
                    )}
                    style={{ width: `${bantAvg}%` }}
                  />
                </div>
                <p className="text-[0.6rem] text-zinc-400 mt-2 text-center leading-tight">
                  {bantLeads.length} dari {activeLeads.length} lead aktif memiliki skor BANT
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-400 text-center">
                Belum ada skor BANT tercatat
              </p>
            )}
          </div>
          <p className="text-[0.55rem] text-zinc-400 mt-2 leading-tight text-center">
            rata-rata skor BANT dari semua lead aktif
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CRMPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")

  const fetchLeads = useCallback(async () => {
    if (!insForge) { setLoading(false); return }
    setLoading(true)
    try {
      const tenantId = getTenantId()
      const { data } = await insForge
        .from("crm_leads")
        .select("id,lead_number,title,contact_name,company_name,lead_source,estimated_value,status,priority,probability,bant_score,created_at")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      setLeads((data as Lead[]) ?? [])
    } catch (err) {
      console.error("Failed to fetch leads:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus lead ini?")) return
    if (!insForge) return
    await insForge.from("crm_leads").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  // ── Filtered ─────────────────────────────────────────────────────────
  const displayed = leads.filter((l) => {
    if (statusFilter === "active" && !ACTIVE_STATUSES.includes(l.status ?? "new")) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(l.title ?? "").toLowerCase().includes(q) &&
        !(l.lead_number ?? "").toLowerCase().includes(q) &&
        !l.contact_name.toLowerCase().includes(q) &&
        !(l.company_name ?? "").toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // ── KPI ──────────────────────────────────────────────────────────────
  const activeLeads = leads.filter((l) => ACTIVE_STATUSES.includes(l.status ?? "new"))
  const wonLeads    = leads.filter((l) => l.status === "closed_won")
  const totalValue  = activeLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0)
  const wonValue    = wonLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0)
  const winRate     = leads.filter((l) => ["closed_won","closed_lost"].includes(l.status ?? "")).length > 0
    ? Math.round(wonLeads.length / leads.filter((l) => ["closed_won","closed_lost"].includes(l.status ?? "")).length * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" /> Leads
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {activeLeads.length} lead aktif · {wonLeads.length} closed won
          </p>
        </div>
        <Link href="/commercial/leads/new">
          <button className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" /> Tambah Lead
          </button>
        </Link>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Lead Aktif",   value: activeLeads.length,  sub: "dalam pipeline",   icon: Target,       color: "text-blue-600 dark:text-blue-400" },
          { label: "Closed Won",   value: wonLeads.length,     sub: `win rate ${winRate}%`, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Pipeline Value", value: fmtIDR(totalValue), sub: "estimasi aktif",  icon: DollarSign,   color: "text-zinc-900 dark:text-zinc-100" },
          { label: "Won Value",    value: fmtIDR(wonValue),    sub: "sudah closed",     icon: TrendingUp,   color: "text-emerald-600 dark:text-emerald-400" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-[0.6rem] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
            </div>
            <p className={cn("text-base font-bold", color)}>{value}</p>
            <p className="text-[0.6rem] text-zinc-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Infographics ── */}
      <LeadInfographics leads={leads} />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor, perusahaan..."
            className="flex-1 text-xs bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>

        {/* Status toggle */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => setStatusFilter("active")}
            className={cn("text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
              statusFilter === "active" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Aktif
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={cn("text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
              statusFilter === "all" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Semua
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button onClick={() => setViewMode("table")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "table" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600")}>
            <Table2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode("kanban")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "kanban" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600")}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ════════════ TABLE VIEW ════════════ */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {displayed.length} lead{statusFilter === "active" ? " aktif" : ""}
              {search && <span className="text-zinc-400 font-normal"> · hasil pencarian "{search}"</span>}
            </p>
          </div>

          {displayed.length === 0 ? (
            <div className="py-16 text-center">
              <Target className="w-10 h-10 mx-auto mb-3 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm text-zinc-400">
                {statusFilter === "active" ? "Tidak ada lead aktif." : "Tidak ada lead."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Title</th>
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Lead #</th>
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden sm:table-cell">Kontak</th>
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden md:table-cell">Perusahaan</th>
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden sm:table-cell">Source</th>
                    <th className="text-right py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Value</th>
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Status</th>
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden lg:table-cell">Priority</th>
                    <th className="text-right py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((lead) => (
                    <tr key={lead.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/commercial/leads/${lead.id}`} className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                          {lead.title || `${lead.contact_name}${lead.company_name ? ` - ${lead.company_name}` : ""}`}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {lead.lead_number ? (
                          <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                            {lead.lead_number}
                          </code>
                        ) : <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{lead.contact_name || "—"}</td>
                      <td className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{lead.company_name || "—"}</td>
                      <td className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 hidden sm:table-cell capitalize">{lead.lead_source || "—"}</td>
                      <td className="py-3 px-4 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {lead.estimated_value ? fmtIDR(lead.estimated_value) : <span className="text-zinc-400">Rp 0</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-medium", STATUS_STYLE[lead.status ?? "new"] ?? STATUS_STYLE.new)}>
                          {STATUS_LABEL[lead.status ?? "new"] ?? lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_DOT[lead.priority ?? "medium"] ?? PRIORITY_DOT.medium)} />
                          <span className="text-xs text-zinc-500 capitalize">{lead.priority ?? "medium"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link href={`/commercial/leads/${lead.id}`} className="p-1.5 rounded text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors" title="Detail">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/commercial/leads/${lead.id}`} className="p-1.5 rounded text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════ KANBAN VIEW ════════════ */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-start">
          {KANBAN_COLS.map((status) => {
            const colLeads = displayed.filter((l) => (l.status ?? "new") === status)
            return (
              <div key={status} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className={cn("text-[0.65rem] font-semibold px-2 py-0.5 rounded-full", STATUS_STYLE[status])}>
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="text-[0.6rem] text-zinc-400 font-medium">{colLeads.length}</span>
                </div>
                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[80px]">
                  {colLeads.length === 0 ? (
                    <p className="text-[0.6rem] text-zinc-400 text-center py-4">Kosong</p>
                  ) : colLeads.map((lead) => (
                    <Link key={lead.id} href={`/commercial/leads/${lead.id}`} className="block">
                      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                          {lead.title || lead.contact_name}
                        </p>
                        {lead.company_name && (
                          <p className="text-[0.6rem] text-zinc-400 mt-1">{lead.company_name}</p>
                        )}
                        {lead.estimated_value && lead.estimated_value > 0 && (
                          <p className="text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                            {fmtIDR(lead.estimated_value)}
                          </p>
                        )}
                        {lead.lead_number && (
                          <p className="text-[0.55rem] font-mono text-zinc-400 mt-1">{lead.lead_number}</p>
                        )}
                        {lead.priority && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOT[lead.priority] ?? PRIORITY_DOT.medium)} />
                            <span className="text-[0.55rem] text-zinc-400 capitalize">{lead.priority}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
