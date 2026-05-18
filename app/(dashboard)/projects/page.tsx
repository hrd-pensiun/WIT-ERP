'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { KpiCard } from '@/components/workforce/kpi-card'
import { fmtIDR } from '@/lib/commercial-data'
import { insForge } from '@/lib/insforge'
import { cn } from '@/lib/utils'
import {
  Download,
  Search,
  Trash2,
  Edit3,
  Eye,
  TrendingUp,
  TrendingDown,
  Plus,
  FolderOpen,
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ── Types ──────────────────────────────────────────────────────────────────
interface CommercialProject {
  id: string
  project_code: string | null
  project_name: string
  client_name: string | null
  company_name: string | null
  status: string
  health: string | null
  project_type: string | null
  total_hpp: number | null
  total_publish: number | null
  grand_total: number | null
  margin_pct: number | null
  quotation_publish: number | null
  actual_deal: number | null
  po_value: number | null
  start_date: string | null
  end_date: string | null
  term_of_payment: string | null
  notes: string | null
  created_at: string
  pic_commercial_id: string | null
  pic_adm_id: string | null
  pm_id: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────
const STATUSES = ['All', 'draft', 'administration', 'kick-off', 'on-going', 'completed', 'overdue', 'hold']
const STATUS_LABELS: Record<string, string> = {
  draft:          'Draft',
  administration: 'Administration',
  'kick-off':     'Kick-off',
  'on-going':     'On-Going',
  completed:      'Completed',
  overdue:        'Overdue',
  hold:           'Hold',
  // legacy
  won: 'On-Going', delivery: 'On-Going', quotation: 'Administration', lost: 'Draft',
}

const STATUS_BADGE: Record<string, string> = {
  draft:          'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  administration: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'kick-off':     'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'on-going':     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed:      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  overdue:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  hold:           'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  // legacy
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  delivery: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  quotation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const STATUS_FUNNEL_BAR: Record<string, string> = {
  draft:          'bg-zinc-400',
  administration: 'bg-blue-500',
  'kick-off':     'bg-violet-500',
  'on-going':     'bg-emerald-500',
  completed:      'bg-cyan-500',
  overdue:        'bg-red-400',
  hold:           'bg-amber-400',
  won: 'bg-emerald-500', delivery: 'bg-emerald-500',
}

const HEALTH_DOT: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return fmtIDR(n)
}

// ── Panel 1: Project Health ────────────────────────────────────────────────
function ProjectHealthPanel({ projects }: { projects: CommercialProject[] }) {
  const total = projects.length || 1

  const healthRows = useMemo(() => [
    {
      key: 'green',
      dot: 'bg-emerald-500',
      label: 'Sehat',
      sub: 'on track',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      count: projects.filter((p) => p.health === 'green').length,
    },
    {
      key: 'yellow',
      dot: 'bg-amber-400',
      label: 'Perlu Perhatian',
      sub: 'monitoring diperlukan',
      textColor: 'text-amber-700 dark:text-amber-400',
      barColor: 'bg-amber-400',
      badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      count: projects.filter((p) => p.health === 'yellow').length,
    },
    {
      key: 'red',
      dot: 'bg-red-500',
      label: 'Critical',
      sub: 'bermasalah',
      textColor: 'text-red-600 dark:text-red-400',
      barColor: 'bg-red-500',
      badgeBg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      count: projects.filter((p) => p.health === 'red').length,
    },
  ], [projects])

  const noHealth = projects.filter((p) => !p.health).length

  // Status funnel
  const statusFunnel = useMemo(() =>
    ['draft', 'administration', 'kick-off', 'on-going', 'completed', 'overdue', 'hold'].map((s) => ({
      status: s,
      count: projects.filter((p) => p.status === s).length,
    })),
    [projects]
  )
  const maxStatus = Math.max(...statusFunnel.map((d) => d.count), 1)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
      <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Project Health
      </p>

      {/* Health pills */}
      <div className="space-y-2.5">
        {healthRows.map((row) => {
          const pct = Math.round((row.count / total) * 100)
          return (
            <div key={row.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', row.dot)} />
                  <span className={cn('text-xs font-medium', row.textColor)}>{row.label}</span>
                  <span className="text-[0.6rem] text-zinc-400">{row.sub}</span>
                </div>
                <span className={cn('text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full', row.badgeBg)}>
                  {row.count}
                </span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', row.barColor)}
                  style={{ width: `${Math.max(pct, row.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          )
        })}
        {noHealth > 0 && (
          <p className="text-[0.6rem] text-zinc-400">{noHealth} proyek belum diset health-nya</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100 dark:border-zinc-800" />

      {/* Status funnel */}
      <div>
        <p className="text-[0.6rem] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Status Funnel</p>
        <div className="space-y-1.5">
          {statusFunnel.map((d) => (
            <div key={d.status} className="flex items-center gap-2">
              <span className="text-[0.6rem] text-zinc-500 dark:text-zinc-400 w-16 capitalize shrink-0">
                {STATUS_LABELS[d.status] ?? d.status}
              </span>
              <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', STATUS_FUNNEL_BAR[d.status] ?? 'bg-zinc-400')}
                  style={{ width: `${Math.max(Math.round((d.count / maxStatus) * 100), d.count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[0.6rem] font-semibold text-zinc-600 dark:text-zinc-400 w-4 text-right tabular-nums">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Panel 2: Financial Health ──────────────────────────────────────────────
function FinancialHealthPanel({ projects }: { projects: CommercialProject[] }) {
  const totalGrandTotal = projects.reduce((s, p) => s + (p.grand_total ?? 0), 0)
  const totalHpp = projects.reduce((s, p) => s + (p.total_hpp ?? 0), 0)

  const marginsValid = projects.filter((p) => p.margin_pct != null)
  const avgMargin = marginsValid.length > 0
    ? marginsValid.reduce((s, p) => s + (p.margin_pct ?? 0), 0) / marginsValid.length
    : null

  const marginColor = avgMargin == null
    ? 'text-zinc-400'
    : avgMargin >= 20 ? 'text-emerald-600 dark:text-emerald-400'
    : avgMargin >= 10 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-500'

  const marginTiers = useMemo(() => [
    { label: 'Bagus (≥20%)',  count: projects.filter((p) => (p.margin_pct ?? 0) >= 20).length,                              color: 'bg-emerald-500' },
    { label: 'Sedang (10-20%)', count: projects.filter((p) => (p.margin_pct ?? 0) >= 10 && (p.margin_pct ?? 0) < 20).length, color: 'bg-amber-400' },
    { label: 'Rendah (<10%)', count: projects.filter((p) => p.margin_pct != null && (p.margin_pct ?? 0) < 10).length,        color: 'bg-red-400' },
    { label: 'N/A',           count: projects.filter((p) => p.margin_pct == null).length,                                    color: 'bg-zinc-300 dark:bg-zinc-600' },
  ], [projects])

  const maxTier = Math.max(...marginTiers.map((t) => t.count), 1)
  const totalProjects = projects.length || 1

  const withActualDeal = projects.filter((p) => (p.actual_deal ?? 0) > 0).length

  // HPP vs Grand Total proportion
  const hppPct = totalGrandTotal > 0 ? Math.min(Math.round((totalHpp / totalGrandTotal) * 100), 100) : 0
  const marginPct2 = 100 - hppPct

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
      <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Financial Health
      </p>

      {/* Total Grand Total */}
      <div>
        <p className="text-[0.6rem] text-zinc-400 mb-0.5">Total Grand Total</p>
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {totalGrandTotal > 0 ? fmtIDR(totalGrandTotal) : '—'}
        </p>
      </div>

      {/* HPP vs Grand Total stacked bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[0.6rem] font-semibold text-zinc-400 uppercase tracking-wider">HPP vs Revenue</p>
          <span className="text-[0.6rem] text-zinc-400 tabular-nums">
            {totalGrandTotal > 0 ? `HPP ${hppPct}% · Margin ${marginPct2}%` : '—'}
          </span>
        </div>
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-red-400 transition-all"
            style={{ width: `${hppPct}%` }}
            title={`HPP: ${fmtShort(totalHpp)}`}
          />
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${marginPct2}%` }}
            title={`Margin: ${fmtShort(totalGrandTotal - totalHpp)}`}
          />
        </div>
        <div className="flex items-center gap-4 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-[0.6rem] text-zinc-500">HPP: {fmtShort(totalHpp)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[0.6rem] text-zinc-500">Margin: {fmtShort(Math.max(totalGrandTotal - totalHpp, 0))}</span>
          </div>
        </div>
      </div>

      {/* Average margin */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.6rem] text-zinc-400 mb-0.5">Avg Margin</p>
          <p className={cn('text-2xl font-bold tabular-nums', marginColor)}>
            {avgMargin != null ? `${avgMargin.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[0.6rem] text-zinc-400 mb-0.5">Dengan Actual Deal</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{withActualDeal}</p>
          <p className="text-[0.55rem] text-zinc-400">dari {projects.length} proyek</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100 dark:border-zinc-800" />

      {/* Margin distribution */}
      <div>
        <p className="text-[0.6rem] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Distribusi Margin</p>
        <div className="space-y-1.5">
          {marginTiers.map((tier) => {
            const pct = Math.round((tier.count / maxTier) * 100)
            return (
              <div key={tier.label} className="flex items-center gap-2">
                <span className="text-[0.6rem] text-zinc-500 dark:text-zinc-400 w-24 shrink-0">{tier.label}</span>
                <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', tier.color)}
                    style={{ width: `${Math.max(pct, tier.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[0.6rem] font-semibold text-zinc-600 dark:text-zinc-400 w-4 text-right tabular-nums">
                  {tier.count}
                </span>
                <span className="text-[0.55rem] text-zinc-400 w-7 text-right tabular-nums">
                  {Math.round((tier.count / totalProjects) * 100)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Panel 3: Pipeline Flow ─────────────────────────────────────────────────
function PipelineFlowPanel({ projects }: { projects: CommercialProject[] }) {
  const statusFlow = useMemo(() =>
    ['draft', 'administration', 'kick-off', 'on-going', 'completed', 'overdue', 'hold'].map((s) => {
      const group = projects.filter((p) => p.status === s)
      return {
        status: s,
        count: group.length,
        value: group.reduce((acc, p) => acc + (p.grand_total ?? p.quotation_publish ?? 0), 0),
      }
    }),
    [projects]
  )

  const maxFlowCount = Math.max(...statusFlow.map((d) => d.count), 1)
  const maxFlowValue = Math.max(...statusFlow.map((d) => d.value), 1)

  // Quotation publish total vs actual deal total
  const totalQuotation = projects.reduce((s, p) => s + (p.quotation_publish ?? 0), 0)
  const totalActualDeal = projects.reduce((s, p) => s + (p.actual_deal ?? 0), 0)
  const maxComparison = Math.max(totalQuotation, totalActualDeal, 1)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
      <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Pipeline Flow
      </p>

      {/* Status funnel with value */}
      <div className="space-y-2">
        {statusFlow.map((d) => {
          const countPct = Math.round((d.count / maxFlowCount) * 100)
          const valuePct = maxFlowValue > 0 ? Math.round((d.value / maxFlowValue) * 100) : 0
          return (
            <div key={d.status} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] text-zinc-600 dark:text-zinc-400 capitalize font-medium">
                  {STATUS_LABELS[d.status] ?? d.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] text-zinc-400 tabular-nums">{d.count} proyek</span>
                  {d.value > 0 && (
                    <span className="text-[0.6rem] font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
                      {fmtShort(d.value)}
                    </span>
                  )}
                </div>
              </div>
              {/* Double bar: count + value */}
              <div className="space-y-0.5">
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', STATUS_FUNNEL_BAR[d.status] ?? 'bg-zinc-400')}
                    style={{ width: `${Math.max(countPct, d.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all opacity-40', STATUS_FUNNEL_BAR[d.status] ?? 'bg-zinc-400')}
                    style={{ width: `${Math.max(valuePct, d.value > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100 dark:border-zinc-800" />

      {/* Quotation vs Actual Deal comparison */}
      <div>
        <p className="text-[0.6rem] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Quotation vs Actual Deal
        </p>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.65rem] text-zinc-500">Quotation Publish</span>
              <span className="text-[0.65rem] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {totalQuotation > 0 ? fmtShort(totalQuotation) : '—'}
              </span>
            </div>
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.round((totalQuotation / maxComparison) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.65rem] text-zinc-500">Actual Deal</span>
              <span className="text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalActualDeal > 0 ? fmtShort(totalActualDeal) : '—'}
              </span>
            </div>
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.round((totalActualDeal / maxComparison) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        {totalQuotation > 0 && totalActualDeal > 0 && (
          <p className="text-[0.6rem] text-zinc-400 mt-2">
            Konversi: {Math.round((totalActualDeal / totalQuotation) * 100)}% dari total quotation terealisasi sebagai actual deal
          </p>
        )}
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<CommercialProject[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const doFetch = useCallback(async () => {
    if (!insForge) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await insForge
        .from('commercial_projects')
        .select('id,project_code,project_name,client_name,company_name,status,health,project_type,total_hpp,total_publish,grand_total,margin_pct,quotation_publish,actual_deal,po_value,start_date,end_date,term_of_payment,notes,created_at,pic_commercial_id,pic_adm_id,pm_id')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      setProjects((data as CommercialProject[]) ?? [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { doFetch() }, [doFetch])

  // ── Derived types list from real data ──────────────────────────────────
  const typeList = useMemo(() => {
    const types = Array.from(new Set(projects.map((p) => p.project_type).filter(Boolean))) as string[]
    return ['All', ...types.sort()]
  }, [projects])

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    projects.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false
      if (typeFilter !== 'All' && p.project_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.project_name.toLowerCase().includes(q) &&
          !(p.project_code ?? '').toLowerCase().includes(q) &&
          !(p.client_name ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    }),
    [projects, statusFilter, typeFilter, search]
  )

  // ── KPI stats ──────────────────────────────────────────────────────────
  const wonProjects = projects.filter((p) => p.status === 'won')
  const totalValue = projects.reduce((s, p) => s + (p.actual_deal || p.quotation_publish || 0), 0)
  const wonValue = wonProjects.reduce((s, p) => s + (p.actual_deal || p.quotation_publish || 0), 0)

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!insForge) return
    try {
      await insForge.from('commercial_projects').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    } catch { /* ignore */ }
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirm(null)
  }

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Code', 'Name', 'Client', 'Type', 'Status', 'Health', 'Quotation', 'Actual Deal', 'Grand Total', 'Margin %', 'Start', 'End', 'Created']
    const rows = filtered.map((p) => [
      p.project_code ?? '',
      p.project_name,
      p.client_name ?? '',
      p.project_type ?? '',
      p.status,
      p.health ?? '',
      p.quotation_publish ?? 0,
      p.actual_deal ?? 0,
      p.grand_total ?? 0,
      p.margin_pct ?? 0,
      p.start_date ?? '',
      p.end_date ?? '',
      p.created_at.slice(0, 10),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Projects')
    ws['!cols'] = headers.map(() => ({ wch: 20 }))
    XLSX.writeFile(wb, `projects-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Monitor dan kelola seluruh proyek ({projects.length} proyek)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/projects/new"
            className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Project
          </Link>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Proyek" value={projects.length} />
        <KpiCard title="Won" value={wonProjects.length} icon={<TrendingUp className="w-4 h-4" />} variant="success" />
        <KpiCard title="Total Pipeline" value={fmtIDR(totalValue)} icon={<TrendingDown className="w-4 h-4" />} />
        <KpiCard title="Won Value" value={fmtIDR(wonValue)} variant="success" />
      </div>

      {/* ── Infographic Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProjectHealthPanel projects={projects} />
        <FinancialHealthPanel projects={projects} />
        <PipelineFlowPanel projects={projects} />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kode, klien..."
              className="flex-1 px-2 py-1.5 text-xs bg-transparent border-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors',
                statusFilter === s
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {s === 'All' ? 'Semua' : (STATUS_LABELS[s] ?? s)}
            </button>
          ))}
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            {typeList.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'Semua Tipe' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-500" />
            {filtered.length} proyek
            {(statusFilter !== 'All' || typeFilter !== 'All' || search) && (
              <span className="text-xs text-zinc-400 font-normal">
                (dari {projects.length} total)
              </span>
            )}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-zinc-500">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            {projects.length === 0
              ? 'Belum ada proyek. Buat proyek baru dari Raw Calculator.'
              : 'Tidak ada proyek yang sesuai filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Kode</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Nama Proyek</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 hidden sm:table-cell">Klien</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Tipe</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Health</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Quotation</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Grand Total</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Margin</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {p.project_code || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/projects/${p.id}`} className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm">
                        {p.project_name}
                      </Link>
                      {p.company_name && (
                        <p className="text-[0.65rem] text-zinc-400 mt-0.5">{p.company_name}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                      {p.client_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                      {p.project_type || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium',
                        STATUS_BADGE[p.status] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      )}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {p.health ? (
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-2 h-2 rounded-full', HEALTH_DOT[p.health] ?? 'bg-zinc-400')} />
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">{p.health}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                      {p.quotation_publish ? fmtIDR(p.quotation_publish) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden lg:table-cell">
                      {p.grand_total ? fmtIDR(p.grand_total) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums hidden lg:table-cell">
                      {p.margin_pct != null && p.margin_pct > 0 ? (
                        <span className={cn('font-medium', p.margin_pct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : p.margin_pct >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                          {p.margin_pct.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/projects/${p.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/projects/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        {deleteConfirm === p.id ? (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="px-1.5 py-1 rounded text-[0.6rem] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-1.5 py-1 rounded text-[0.6rem] font-semibold text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              Tidak
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
