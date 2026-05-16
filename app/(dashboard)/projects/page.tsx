'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { KpiCard } from '@/components/workforce/kpi-card'
import { fetchProjects, fmtIDR } from '@/lib/commercial-data'
import type { MockProject } from '@/lib/commercial-data'
import { insForge } from '@/lib/insforge'
import { cn } from '@/lib/utils'
import {
  BarChart2,
  PieChart as PieChartIcon,
  Download,
  Search,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import * as XLSX from 'xlsx'

const STATUSES = ['All', 'Draft', 'Submitted', 'Negotiation', 'Won', 'Lost', 'On Hold']
const TYPES = ['All', 'Consultant', 'Networking', 'Project', 'Web', 'WMS']

const STATUS_COLORS: Record<string, string> = {
  Draft: '#a1a1aa',
  Submitted: '#3b82f6',
  Negotiation: '#f59e0b',
  Won: '#10b981',
  Lost: '#ef4444',
  'On Hold': '#8b5cf6',
}

const TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<MockProject[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const doFetch = useCallback(async () => {
    setProjects(await fetchProjects())
    setLoading(false)
  }, [])

  useEffect(() => { doFetch() }, [doFetch])

  const filtered = useMemo(() =>
    projects.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false
      if (typeFilter !== 'All' && p.type !== typeFilter) return false
      if (search && !p.projectName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }),
    [projects, statusFilter, typeFilter, search]
  )

  // Stats
  const wonProjects = projects.filter((p) => p.status === 'Won')
  const totalValue = projects.reduce((s, p) => s + (p.actualDeal || p.quotationPublish), 0)
  const wonValue = wonProjects.reduce((s, p) => s + (p.actualDeal || p.quotationPublish), 0)

  // Chart Data
  const statusChartData = useMemo(() =>
    STATUSES.filter((s) => s !== 'All').map((s) => ({
      name: s,
      count: projects.filter((p) => p.status === s).length,
    })),
    [projects]
  )

  const typeChartData = useMemo(() =>
    TYPES.filter((t) => t !== 'All').map((t) => ({
      name: t,
      count: projects.filter((p) => p.type === t).length,
    })),
    [projects]
  )

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {}
    projects.forEach((p) => {
      const m = p.createdAt.slice(0, 7)
      months[m] = (months[m] || 0) + 1
    })
    return Object.entries(months).sort().map(([month, count]) => ({ month, count }))
  }, [projects])

  const handleDelete = async (id: string) => {
    if (insForge) {
      try {
        await insForge.from("commercial_projects").update({ deleted_at: new Date().toISOString() }).eq("id", id)
        await insForge.from("commercial_project_manpower").update({ deleted_at: new Date().toISOString() }).eq("project_id", id)
      } catch { /* ignore */ }
    }
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirm(null)
  }

  const handleExport = () => {
    const headers = ['Code', 'Name', 'PIC', 'Type', 'Status', 'Quotation', 'Actual Deal', 'Created']
    const data = filtered.map((p) => [
      p.projectCode, p.projectName, p.pic, p.type, p.status,
      p.quotationPublish, p.actualDeal, p.createdAt,
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Projects')
    ws['!cols'] = headers.map(() => ({ wch: 20 }))
    XLSX.writeFile(wb, `projects-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Monitor and manage all projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/commercial"
            className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium"
          >
            + New Project
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Projects" value={projects.length} />
        <KpiCard title="Won" value={wonProjects.length} icon={<TrendingUp className="w-4 h-4" />} variant="success" />
        <KpiCard title="Total Value" value={fmtIDR(totalValue)} icon={<TrendingDown className="w-4 h-4" />} />
        <KpiCard title="Won Value" value={fmtIDR(wonValue)} variant="success" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
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
              {s}
            </button>
          ))}
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> By Status
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusChartData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#a1a1aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <PieChartIcon className="w-3.5 h-3.5" /> By Type
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {typeChartData.map((_, idx) => (
                  <Cell key={idx} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Monthly Trend
          </h3>
          <div className="h-[180px] flex items-end gap-2">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full bg-emerald-500 rounded-t-sm transition-all"
                  style={{ height: `${Math.min((m.count / Math.max(...monthlyTrend.map((x) => x.count), 1)) * 100, 100)}%` }}
                />
                <span className="text-[0.55rem] text-zinc-500 dark:text-zinc-400 rotate-[-45deg] origin-left whitespace-nowrap">
                  {m.month.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-500">
            No projects match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 hidden sm:table-cell">PIC</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Publish</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Actual</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">{p.projectCode}</td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">{p.projectName}</td>
                    <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">{p.pic || '-'}</td>
                    <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-400 hidden md:table-cell">{p.type}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium',
                        p.status === 'Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        p.status === 'Lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        p.status === 'Negotiation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        p.status === 'Submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        p.status === 'On Hold' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                      {fmtIDR(p.quotationPublish)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden lg:table-cell">
                      {p.actualDeal > 0 ? fmtIDR(p.actualDeal) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/projects/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        {deleteConfirm === p.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-[0.6rem] font-semibold">
                              Yes
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-[0.6rem] font-semibold">
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete"
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
