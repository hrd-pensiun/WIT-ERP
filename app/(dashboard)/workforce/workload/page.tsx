'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/workforce/kpi-card'
import { StatusBadge } from '@/components/workforce/status-badge'
import { WorkItemTable } from '@/components/workforce/work-item-table'
import { mockWorkItems, mockWorkforceDashboard } from '@/hooks/useWorkforceMockData'
import type { WorkItem, WorkItemType } from '@/types/workforce'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react'

const workTypeFilters: { label: string; value: WorkItemType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Project', value: 'project_task' },
  { label: 'Operational', value: 'operational_task' },
  { label: 'Support', value: 'support_task' },
  { label: 'Improvement', value: 'improvement_task' },
  { label: 'Incident', value: 'incident_task' },
]

export default function WorkloadPage() {
  const [typeFilter, setTypeFilter] = useState<WorkItemType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const items = mockWorkItems.filter((wi) => {
    if (typeFilter !== 'all' && wi.type !== typeFilter) return false
    if (statusFilter !== 'all' && wi.status !== statusFilter) return false
    return true
  })

  const overdueItems = mockWorkItems.filter(
    (wi) => new Date(wi.dueDate) < new Date() && wi.status !== 'done'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Workload Monitoring</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track workload distribution and identify bottlenecks</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Tasks"
          value={mockWorkItems.length}
          subtitle="All work items"
          variant="default"
        />
        <KpiCard
          title="In Progress"
          value={mockWorkItems.filter((wi) => wi.status === 'in_progress').length}
          subtitle="Currently active"
          variant="success"
        />
        <KpiCard
          title="Overdue"
          value={overdueItems.length}
          subtitle="Past due date"
          variant="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          title="Completion Rate"
          value={`${mockWorkforceDashboard.workItemSummary.averageCompletionRate}%`}
          subtitle="All work items"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 mr-1" />
          {workTypeFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                typeFilter === f.value
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          {['all', 'pending', 'in_progress', 'review', 'done', 'blocked'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              )}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {overdueItems.length} task{overdueItems.length > 1 ? 's' : ''} overdue
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {overdueItems.map((wi) => wi.title).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Work Items Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Work Items</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{items.length} items</span>
        </div>
        <WorkItemTable items={items} />
      </div>
    </div>
  )
}
