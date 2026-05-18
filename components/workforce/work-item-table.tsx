'use client'

import type { WorkItem } from '@/types/workforce'
import { StatusBadge } from './status-badge'
import { cn } from '@/lib/utils'

interface WorkItemTableProps {
  items: WorkItem[]
  className?: string
  onItemClick?: (item: WorkItem) => void
}

export function WorkItemTable({ items, className, onItemClick }: WorkItemTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Task</th>
            <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Type</th>
            <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">Project</th>
            <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Assignee</th>
            <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Priority</th>
            <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
            <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Due</th>
            <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Progress</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'done'
            return (
              <tr
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className={cn(
                  'border-b border-zinc-100 dark:border-zinc-800/50 transition-colors',
                  onItemClick ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30' : ''
                )}
              >
                <td className="py-3 px-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <StatusBadge type="workType" value={item.type} />
                </td>
                <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 hidden lg:table-cell text-xs">
                  {item.project || '-'}
                </td>
                <td className="py-3 px-3 text-xs text-zinc-600 dark:text-zinc-400">{item.assignedTo}</td>
                <td className="py-3 px-3 hidden sm:table-cell">
                  <StatusBadge type="priority" value={item.priority} />
                </td>
                <td className="py-3 px-3">
                  <StatusBadge type="status" value={item.status} />
                </td>
                <td className={cn(
                  'py-3 px-3 text-xs text-right tabular-nums hidden sm:table-cell',
                  isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-600 dark:text-zinc-400'
                )}>
                  {isOverdue ? 'Overdue' : item.dueDate}
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          item.progressPercent === 100 ? 'bg-emerald-500' :
                          item.progressPercent > 0 ? 'bg-blue-500' : ''
                        )}
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 w-8 text-right">{item.progressPercent}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
