'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/workforce/kpi-card'
import { AllocationBar } from '@/components/workforce/allocation-bar'
import { mockAllocations, mockWorkforceDashboard } from '@/hooks/useWorkforceMockData'
import { cn } from '@/lib/utils'
import { AlertTriangle, Users, UserCheck, BarChart3 } from 'lucide-react'

type SortKey = 'name' | 'allocation'
type FilterStatus = 'all' | 'critical' | 'overloaded' | 'optimal' | 'underloaded'

export default function ResourceAllocationPage() {
  const [sortBy, setSortBy] = useState<SortKey>('allocation')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const sorted = [...mockAllocations]
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .sort((a, b) =>
      sortBy === 'name'
        ? a.employeeName.localeCompare(b.employeeName)
        : b.totalAllocation - a.totalAllocation
    )

  const stats = {
    critical: mockAllocations.filter((a) => a.status === 'critical').length,
    overloaded: mockAllocations.filter((a) => a.status === 'overloaded').length,
    optimal: mockAllocations.filter((a) => a.status === 'optimal').length,
    underloaded: mockAllocations.filter((a) => a.status === 'underloaded').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Resource Allocation</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Monitor employee allocation across projects and tasks</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Resources"
          value={mockAllocations.length}
          subtitle="Tracked employees"
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          title="Critical"
          value={stats.critical}
          subtitle="Above 100% allocation"
          variant="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          title="Overloaded"
          value={stats.overloaded}
          subtitle="90-100% allocation"
          variant="warning"
        />
        <KpiCard
          title="Underloaded"
          value={stats.underloaded}
          subtitle="Below 70% allocation"
          variant="default"
        />
      </div>

      {/* Alert Banner */}
      {stats.critical > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {stats.critical} employee{stats.critical > 1 ? 's' : ''} critically overallocated
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Total allocation exceeds 100%. Consider redistributing tasks or adjusting deadlines.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['all', 'critical', 'optimal', 'underloaded'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors',
                filterStatus === status
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Sort by:</span>
          {(['allocation', 'name'] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors',
                sortBy === key
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Allocation List */}
      <div className="space-y-2">
        {sorted.map((alloc) => {
          const barSegments = alloc.allocations.map((a) => ({
            label: a.projectName,
            percentage: a.percentage,
            color: '',
          }))

          return (
            <div
              key={alloc.id}
              className={cn(
                'bg-white dark:bg-zinc-900 rounded-2xl border p-5 transition-all hover:shadow-sm',
                alloc.status === 'critical'
                  ? 'border-red-200 dark:border-red-800'
                  : alloc.status === 'underloaded'
                  ? 'border-amber-200 dark:border-amber-800'
                  : 'border-zinc-200 dark:border-zinc-800'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {alloc.employeeName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{alloc.employeeName}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{alloc.position} &middot; {alloc.department}</p>
                  </div>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-lg',
                  alloc.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  alloc.status === 'overloaded' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  alloc.status === 'underloaded' ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                )}>
                  {alloc.totalAllocation}%
                </span>
              </div>
              <AllocationBar segments={barSegments} total={alloc.totalAllocation} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
