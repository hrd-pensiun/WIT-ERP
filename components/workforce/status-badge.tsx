'use client'

import { cn } from '@/lib/utils'
import type { WorkItemStatus, WorkItemPriority, WorkItemType } from '@/types/workforce'

const statusConfig: Record<WorkItemStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  review: { label: 'Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  done: { label: 'Done', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const priorityConfig: Record<WorkItemPriority, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  low: { label: 'Low', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
}

const typeConfig: Record<WorkItemType, { label: string; className: string }> = {
  project_task: { label: 'Project', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  operational_task: { label: 'Operational', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  support_task: { label: 'Support', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  improvement_task: { label: 'Improvement', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  incident_task: { label: 'Incident', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
}

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'workType'
  value: string
  className?: string
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const config =
    type === 'status' ? statusConfig[value as WorkItemStatus] :
    type === 'priority' ? priorityConfig[value as WorkItemPriority] :
    typeConfig[value as WorkItemType]

  if (!config) {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium', className)}>
        {value}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium whitespace-nowrap', config.className, className)}>
      {config.label}
    </span>
  )
}
