'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchRateCards,
  calculateSummary,
  fmtIDR,
  parseIDR,
  generateRowId,
  resetIdCounter,
} from '@/lib/commercial-data'
import type { RateCardEntry, CalculatorRow, Deductions, ToppAllocation, ProjectInfo, SummaryResult } from '@/lib/commercial-data'
import { insForge } from '@/lib/insforge'
import { KpiCard } from '@/components/workforce/kpi-card'
import { cn } from '@/lib/utils'
import {
  Calculator,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Receipt,
  X,
} from 'lucide-react'

const STATUSES = ['Draft', 'Submitted', 'Negotiation', 'Won', 'Lost', 'On Hold']
const PROJECT_TYPES = ['Consultant', 'Networking', 'Project', 'Web', 'WMS']

const emptyRow = (type: string): CalculatorRow => ({
  id: generateRowId(),
  group: '',
  role: '',
  nama: '',
  qty: 1,
  months: 1,
  hppRate: 0,
  specialRate: 0,
  publishRate: 0,
})

export default function CommercialCalculatorPage() {
  const router = useRouter()
  const [rateCards, setRateCards] = useState<RateCardEntry[]>([])
  const [rateCardsLoading, setRateCardsLoading] = useState(true)
  const [project, setProject] = useState<ProjectInfo>({ projectName: '', pic: '', status: 'Draft', type: 'Consultant' })
  const [rows, setRows] = useState<CalculatorRow[]>([emptyRow('Consultant'), emptyRow('Consultant')])
  const [deductions, setDeductions] = useState<Deductions>({ pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 })
  const [topp, setTopp] = useState<ToppAllocation>({ cogsPct: 25, opexPct: 75 })
  const [quotationRaw, setQuotationRaw] = useState('')
  const [actualDealRaw, setActualDealRaw] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    fetchRateCards().then((cards) => {
      setRateCards(cards)
      setRateCardsLoading(false)
    })
  }, [])

  const getGroups = useCallback((type: string): string[] => {
    const groups = new Set<string>()
    for (const rc of rateCards) {
      if (rc.type === type) groups.add(rc.group)
    }
    return Array.from(groups)
  }, [rateCards])

  const getRoles = useCallback((type: string, group: string): RateCardEntry[] => {
    return rateCards.filter((rc) => rc.type === type && rc.group === group)
  }, [rateCards])

  const getRoleEntry = useCallback((type: string, group: string, role: string): RateCardEntry | undefined => {
    return rateCards.find((rc) => rc.type === type && rc.group === group && rc.role === role)
  }, [rateCards])

  const quotation = parseIDR(quotationRaw)
  const actualDeal = parseIDR(actualDealRaw)

  const summary = useMemo<SummaryResult>(
    () => calculateSummary(rows, deductions, topp, isNaN(quotation) ? 0 : quotation, isNaN(actualDeal) ? 0 : actualDeal),
    [rows, deductions, topp, quotation, actualDeal]
  )

  const selectType = useCallback((type: string) => {
    setProject((p) => ({ ...p, type }))
    resetIdCounter()
    setRows([emptyRow(type), emptyRow(type)])
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow(project.type)])
  }, [project.type])

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }, [])

  const updateRow = useCallback((id: string, field: keyof CalculatorRow, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }

        // When group changes, reset role and rates
        if (field === 'group') {
          updated.role = ''
          updated.hppRate = 0
          updated.specialRate = 0
          updated.publishRate = 0
          updated.selectedRoleIndex = undefined
        }

        // When role changes (via role name string), auto-fill rates
        if (field === 'role' && typeof value === 'string' && value) {
          const entry = getRoleEntry(project.type, r.group, value)
          if (entry) {
            updated.hppRate = entry.hpp
            updated.specialRate = entry.specialRate
            updated.publishRate = entry.publishRate
          }
        }

        return updated
      })
    )
  }, [project.type])

  const handleSave = async () => {
    if (!project.projectName.trim()) {
      setNotification({ type: 'error', message: 'Project name is required' })
      return
    }
    if (rows.some((r) => !r.group || !r.role)) {
      setNotification({ type: 'error', message: 'Complete all manpower rows (group & role)' })
      return
    }
    if (!insForge) {
      setNotification({ type: 'success', message: `Project "${project.projectName}" saved locally!` })
      return
    }

    try {
      const { data: proj, error } = await insForge.from("commercial_projects").insert({
        project_name: project.projectName.trim(),
        project_type: project.type,
        client_name: project.pic || null,
        status: project.status.toLowerCase(),
        deductions_data: deductions,
        topp_data: topp,
        total_hpp: summary.totalHpp,
        total_publish: summary.totalPublish,
        grand_total: summary.totalPublish,
        margin_pct: summary.marginPublishPct,
        quotation_publish: isNaN(quotation) ? 0 : quotation,
        actual_deal: isNaN(actualDeal) ? 0 : actualDeal,
      }).select().single()
      if (error) throw error

      // Insert manpower rows
      if (proj?.id && rows.length > 0) {
        await insForge.from("commercial_project_manpower").insert(
          rows.map((r, idx) => ({
            project_id: proj.id,
            role_name: r.role,
            qty: r.qty,
            months: r.months,
            hpp_rate: r.hppRate,
            publish_rate: r.publishRate,
            special_rate: r.specialRate,
            sort_order: idx,
          }))
        )
      }

      setNotification({ type: 'success', message: `Project "${project.projectName}" saved successfully!` })
    } catch (err) {
      console.error("Failed to save project:", err)
      setNotification({ type: 'error', message: 'Failed to save project to database.' })
    }
  }

  const handleReset = () => {
    selectType('Consultant')
    setProject({ projectName: '', pic: '', status: 'Draft', type: 'Consultant' })
    setDeductions({ pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 })
    setTopp({ cogsPct: 25, opexPct: 75 })
    setQuotationRaw('')
    setActualDealRaw('')
    setNotification(null)
  }

  const renderedRoles = (type: string, group: string) => {
    if (!group) return []
    return getRoles(type, group)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Commercial Calculator</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Hitung HPP, Publish Rate, dan margin keuntungan per project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={handleSave} className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 font-medium">
            <Save className="w-3.5 h-3.5" /> Save Project
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={cn(
          'rounded-2xl border p-4 text-sm flex items-center justify-between',
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        )}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Main layout: Form (8/12) + Summary sidebar (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========== LEFT COLUMN — Form (70%) ========== */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Section 1: Project Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Project Info</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Project Name</label>
                <input
                  type="text"
                  value={project.projectName}
                  onChange={(e) => setProject((p) => ({ ...p, projectName: e.target.value }))}
                  placeholder="e.g. ERP Implementation"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">PIC</label>
                <input
                  type="text"
                  value={project.pic}
                  onChange={(e) => setProject((p) => ({ ...p, pic: e.target.value }))}
                  placeholder="e.g. Fitri H"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Type</label>
                <select
                  value={project.type}
                  onChange={(e) => selectType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Status</label>
                <select
                  value={project.status}
                  onChange={(e) => setProject((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Manpower Rows */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Manpower</h2>
              <button onClick={addRow} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 pr-2 text-xs font-semibold text-zinc-500 w-8">#</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Group</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Role</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500 hidden md:table-cell">Nama</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-zinc-500">Qty</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-zinc-500">Months</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-zinc-500 hidden lg:table-cell">HPP</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Special</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Publish</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-zinc-500 hidden md:table-cell">Subtotal</th>
                    <th className="w-10 py-2 pl-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const roles = renderedRoles(project.type, row.group)
                    const subtotal = row.publishRate * row.qty * row.months
                    return (
                      <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-2 pr-2 text-xs text-zinc-400">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <select
                            value={row.group}
                            onChange={(e) => updateRow(row.id, 'group', e.target.value)}
                            className="w-full min-w-[100px] px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          >
                            <option value="">Select</option>
                            {[...new Set(rateCards.filter((r) => r.type === project.type).map((r) => r.group))].map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.role}
                            onChange={(e) => updateRow(row.id, 'role', e.target.value)}
                            disabled={!row.group}
                            className="w-full min-w-[120px] px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
                          >
                            <option value="">Select</option>
                            {roles.map((r) => (
                              <option key={r.role} value={r.role}>{r.role}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 hidden md:table-cell">
                          <input
                            type="text"
                            value={row.nama || ''}
                            onChange={(e) => updateRow(row.id, 'nama', e.target.value)}
                            placeholder="Optional"
                            className="w-full min-w-[80px] px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={1}
                            value={row.qty}
                            onChange={(e) => updateRow(row.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 text-center px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={1}
                            value={row.months}
                            onChange={(e) => updateRow(row.id, 'months', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 text-center px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </td>
                        <td className="py-2 px-2 text-right text-xs text-zinc-500 dark:text-zinc-400 tabular-nums hidden lg:table-cell">
                          {fmtIDR(row.hppRate)}
                        </td>
                        <td className="py-2 px-2 text-right text-xs text-zinc-500 dark:text-zinc-400 tabular-nums hidden lg:table-cell">
                          {fmtIDR(row.specialRate)}
                        </td>
                        <td className="py-2 px-2 text-right text-xs text-zinc-500 dark:text-zinc-400 tabular-nums hidden lg:table-cell">
                          {fmtIDR(row.publishRate)}
                        </td>
                        <td className="py-2 px-2 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 tabular-nums hidden md:table-cell">
                          {fmtIDR(subtotal)}
                        </td>
                        <td className="py-2 pl-2">
                          <button onClick={() => removeRow(row.id)} disabled={rows.length <= 1} className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-zinc-400">
              Total manpower cost (publish): <span className="font-semibold text-zinc-600 dark:text-zinc-300">{fmtIDR(summary.totalPublish)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Section 3: Deductions */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Deductions</h2>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'pajak', label: 'Pajak (%)', value: deductions.pajak, icon: Receipt },
                  { key: 'founderFee', label: 'Founder Fee (%)', value: deductions.founderFee, icon: TrendingUp },
                  { key: 'managementFee', label: 'Management Fee (%)', value: deductions.managementFee, icon: TrendingUp },
                  { key: 'seFee', label: 'SE Fee (%)', value: deductions.seFee, icon: TrendingUp },
                ] as const).map(({ key, label, value, icon: Icon }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                      <Icon className="w-3 h-3" /> {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={value}
                      onChange={(e) => setDeductions((d) => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: TOPP Allocation (compact) */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">TOPP Allocation</h2>
              <div className="space-y-3">
                {([
                  { key: 'cogsPct', label: 'COGS (%)', value: topp.cogsPct, desc: 'Cost of Goods Sold' },
                  { key: 'opexPct', label: 'OPEX (%)', value: topp.opexPct, desc: 'Operational Expenditure' },
                ] as const).map(({ key, label, value, desc }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">{label}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => setTopp((t) => ({ ...t, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                    <p className="text-[0.6rem] text-zinc-400 mt-0.5">{desc}</p>
                  </div>
                ))}
                <div className="text-xs text-zinc-500 pt-1">
                  Total: {topp.cogsPct + topp.opexPct}% {topp.cogsPct + topp.opexPct !== 100 && <span className="text-amber-500 font-medium">(should be 100%)</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions (within left column) */}
          <div className="flex items-center gap-3 justify-end">
            <button onClick={handleReset} className="text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Reset All
            </button>
            <button onClick={handleSave} className="text-xs px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Project
            </button>
          </div>
        </div>

        {/* ========== RIGHT COLUMN — Summary sidebar (30%) ========== */}
        <div className="lg:col-span-4 min-w-0">
          <div className="sticky top-6 space-y-6">
            {/* Section 5: Quotation & Deal */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quotation & Actual Deal</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Quotation Publish (IDR)</label>
                  <input
                    type="text"
                    value={quotationRaw}
                    onChange={(e) => setQuotationRaw(e.target.value)}
                    placeholder="e.g. IDR 1.500.000.000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Actual Deal (IDR)</label>
                  <input
                    type="text"
                    value={actualDealRaw}
                    onChange={(e) => setActualDealRaw(e.target.value)}
                    placeholder="e.g. IDR 1.350.000.000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Summary */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Summary</h2>
                <button
                  onClick={() => setShowDetail(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
                >
                  Detail
                </button>
              </div>
              <div className="space-y-4 mb-2">
                <KpiCard title="Total HPP" value={fmtIDR(summary.totalHpp)} icon={<TrendingDown className="w-4 h-4" />} />
                <KpiCard title="Total Publish" value={fmtIDR(summary.totalPublish)} icon={<TrendingUp className="w-4 h-4" />} />
                <div className="grid grid-cols-2 gap-4">
                  <KpiCard
                    title="Margin (Publish)"
                    value={summary.marginPublishPct.toFixed(1) + '%'}
                    icon={<PieChart className="w-4 h-4" />}
                    variant={summary.marginPublishPct >= 40 ? 'success' : summary.marginPublishPct >= 20 ? 'warning' : 'danger'}
                  />
                  <KpiCard title="Sales Project" value={fmtIDR(summary.salesProject)} icon={<DollarSign className="w-4 h-4" />} />
                </div>
              </div>

              {summary.totalPublish === 0 && (
                <div className="text-center py-4 text-xs text-zinc-500">
                  Add manpower rows with rates to see the summary
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Popup */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetail(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Summary Details</h3>
              <button onClick={() => setShowDetail(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 text-xs font-semibold text-zinc-500">Metric</th>
                    <th className="text-right py-2 text-xs font-semibold text-zinc-500">Amount</th>
                    <th className="text-right py-2 text-xs font-semibold text-zinc-500">%</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Total Publish', amount: summary.totalPublish, pct: 100 },
                    { label: 'Deduction: Pajak', amount: summary.deductionPajak, pct: deductions.pajak, isDeduction: true },
                    { label: 'Deduction: Founder Fee', amount: summary.deductionFounderFee, pct: deductions.founderFee, isDeduction: true },
                    { label: 'Deduction: Management Fee', amount: summary.deductionManagementFee, pct: deductions.managementFee, isDeduction: true },
                    { label: 'Deduction: SE Fee', amount: summary.deductionSeFee, pct: deductions.seFee, isDeduction: true },
                    { label: 'Total Deductions', amount: summary.totalDeductions, pct: 0, isTotal: true, isDeduction: true },
                    { label: 'Sales Project', amount: summary.salesProject, pct: 0, isTotal: true },
                    { label: 'Total HPP', amount: summary.totalHpp, pct: summary.totalPublish > 0 ? (summary.totalHpp / summary.totalPublish) * 100 : 0, isDeduction: true },
                    { label: 'Profit (Publish vs HPP)', amount: summary.profitPublish, pct: summary.marginPublishPct, isProfit: true },
                    { label: 'COGS', amount: summary.cogsAmount, pct: topp.cogsPct },
                    { label: 'OPEX', amount: summary.opexAmount, pct: topp.opexPct },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-zinc-100 dark:border-zinc-800/50">
                      <td className={cn(
                        'py-2 text-xs',
                        row.isTotal ? 'font-semibold text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'
                      )}>
                        {row.label}
                      </td>
                      <td className={cn(
                        'py-2 text-right text-xs tabular-nums',
                        row.isProfit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                        row.isDeduction ? 'text-red-600 dark:text-red-400' :
                        'text-zinc-700 dark:text-zinc-300'
                      )}>
                        {fmtIDR(row.amount)}
                      </td>
                      <td className="py-2 text-right text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {row.isTotal && row.label === 'Total Deductions' && deductions.pajak + deductions.founderFee + deductions.managementFee + deductions.seFee > 0
                          ? `${(deductions.pajak + deductions.founderFee + deductions.managementFee + deductions.seFee).toFixed(1)}%`
                          : row.isTotal && row.label === 'Sales Project'
                          ? `${(100 - deductions.pajak - deductions.founderFee - deductions.managementFee - deductions.seFee).toFixed(1)}%`
                          : row.isProfit
                          ? `${row.pct.toFixed(1)}%`
                          : row.pct > 0
                          ? `${row.pct.toFixed(1)}%`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}