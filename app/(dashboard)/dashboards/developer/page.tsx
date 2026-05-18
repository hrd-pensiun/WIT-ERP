'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/workforce/kpi-card'
import { StatusBadge } from '@/components/workforce/status-badge'
import { mockWorkItems } from '@/hooks/useWorkforceMockData'
import type { WorkItem, WorkItemStatus } from '@/types/workforce'
import { cn } from '@/lib/utils'
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react'

const statuses: { label: string; value: WorkItemStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Pending', value: 'pending' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' },
]

export default function DeveloperDashboard() {
  const [statusFilter, setStatusFilter] = useState<WorkItemStatus | 'all'>('all')

  // Assign mock developer (the first mock employee who is a developer)
  const myId = 'e1'
  const myItems = mockWorkItems.filter((wi) => wi.assignedToId === myId)
  const filteredItems = statusFilter === 'all' ? myItems : myItems.filter((wi) => wi.status === statusFilter)

  const myOverdue = myItems.filter((wi) => new Date(wi.dueDate) < new Date() && wi.status !== 'done')
  const myDone = myItems.filter((wi) => wi.status === 'done')
  const totalEst = myItems.reduce((s, wi) => s + wi.estimatedHours, 0)
  const totalAct = myItems.reduce((s, wi) => s + wi.actualHours, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">My Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your tasks, deadlines & worklog at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="My Tasks"
          value={myItems.length}
          icon={<ListTodo className="w-4 h-4" />}
        />
        <KpiCard
          title="Completed"
          value={myDone.length}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="success"
        />
        <KpiCard
          title="Overdue"
          value={myOverdue.length}
          variant={myOverdue.length > 0 ? 'danger' : 'default'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          title="Hours"
          value={`${totalAct}/${totalEst}`}
          subtitle="Actual vs Estimated"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatusFilter(s.value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize',
              statusFilter === s.value
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* My Tasks */}
      <div className="space-y-2">
        {filteredItems.map((item) => {
          const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'done'
          return (
            <div
              key={item.id}
              className={cn(
                'bg-white dark:bg-zinc-900 rounded-2xl border p-4 transition-all hover:shadow-sm',
                isOverdue ? 'border-red-200 dark:border-red-800' :
                item.status === 'blocked' ? 'border-red-200 dark:border-red-800' :
                item.status === 'done' ? 'border-emerald-200 dark:border-emerald-800' :
                'border-zinc-200 dark:border-zinc-800'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                    <StatusBadge type="status" value={item.status} />
                    <StatusBadge type="priority" value={item.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.project && <span className="font-medium text-zinc-600 dark:text-zinc-400">{item.project}</span>}
                    <span><StatusBadge type="workType" value={item.type} /></span>
                    <span className={cn(isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : '')}>
                      Due: {item.dueDate}
                    </span>
                    <span>{item.actualHours}h / {item.estimatedHours}h</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        item.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400 w-8">{item.progressPercent}%</span>
                </div>
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-sm text-zinc-500">
            No tasks found for this filter.
          </div>
        )}
      </div>
    </div>
  )
}
