'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/workforce/kpi-card'
import { mockWorkItems } from '@/hooks/useWorkforceMockData'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function TimesheetPage() {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')

  const totalEstimated = mockWorkItems.reduce((sum, wi) => sum + wi.estimatedHours, 0)
  const totalActual = mockWorkItems.reduce((sum, wi) => sum + wi.actualHours, 0)
  const variance = ((totalActual - totalEstimated) / totalEstimated * 100).toFixed(1)

  const employeeHours = mockWorkItems.reduce<Record<string, { estimated: number; actual: number }>>((acc, wi) => {
    if (!acc[wi.assignedTo]) acc[wi.assignedTo] = { estimated: 0, actual: 0 }
    acc[wi.assignedTo].estimated += wi.estimatedHours
    acc[wi.assignedTo].actual += wi.actualHours
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Timesheet</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track work hours and time allocation</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Estimated Hours" value={totalEstimated} subtitle="Total planned hours" />
        <KpiCard title="Actual Hours" value={totalActual} subtitle="Total logged hours" />
        <KpiCard
          title="Variance"
          value={`${variance}%`}
          subtitle={Number(variance) > 0 ? 'Over estimate' : 'Under estimate'}
          variant={Number(variance) > 10 ? 'warning' : 'default'}
        />
        <KpiCard title="Active Tasks" value={mockWorkItems.filter((wi) => wi.status === 'in_progress').length} subtitle="Currently tracked" />
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1 w-fit">
        {(['weekly', 'monthly'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              'text-xs px-4 py-1.5 rounded-xl font-medium capitalize transition-colors',
              view === v
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Employee Hours Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Hours by Employee</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Employee</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Est. Hours</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Actual Hours</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Variance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(employeeHours).map(([name, hrs]) => {
                const varPct = hrs.estimated > 0 ? ((hrs.actual - hrs.estimated) / hrs.estimated * 100).toFixed(1) : '0'
                return (
                  <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">{name}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{hrs.estimated}h</td>
                    <td className="py-3 px-4 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{hrs.actual}h</td>
                    <td className={cn(
                      'py-3 px-4 text-right tabular-nums font-medium',
                      Number(varPct) > 10 ? 'text-amber-600 dark:text-amber-400' :
                      Number(varPct) < -10 ? 'text-emerald-600 dark:text-emerald-400' :
                      'text-zinc-600 dark:text-zinc-400'
                    )}>
                      {Number(varPct) > 0 ? '+' : ''}{varPct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Time Entries */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Recent Time Logs</h2>
        <div className="space-y-3">
          {mockWorkItems.slice(0, 6).map((wi) => (
            <div key={wi.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{wi.title}</p>
                  <p className="text-xs text-zinc-500">{wi.assignedTo}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{wi.actualHours}h / {wi.estimatedHours}h</p>
                <p className="text-xs text-zinc-400">{Math.round((wi.actualHours / wi.estimatedHours) * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
