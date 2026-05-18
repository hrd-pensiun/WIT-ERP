'use client'

import { KpiCard } from '@/components/workforce/kpi-card'
import { StatusBadge } from '@/components/workforce/status-badge'
import { mockWorkItems, mockDeliverySprints } from '@/hooks/useWorkforceMockData'
import { cn } from '@/lib/utils'
import {
  ListTodo,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react'

export default function PMDashboard() {
  const activeSprints = mockDeliverySprints.filter((s) => s.status === 'active')
  const delayedTasks = mockWorkItems.filter((wi) => wi.status !== 'done' && wi.status !== 'blocked')
  const blockedTasks = mockWorkItems.filter((wi) => wi.status === 'blocked')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">PM Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sprint progress, team workload & delivery monitoring</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Sprints"
          value={activeSprints.length}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KpiCard
          title="Total Tasks"
          value={delayedTasks.length}
          subtitle="Active task items"
          icon={<ListTodo className="w-4 h-4" />}
        />
        <KpiCard
          title="Blocked"
          value={blockedTasks.length}
          variant="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          title="Team Members"
          value={12}
          subtitle="Delivery team"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Sprints */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Active Sprints</h2>
          <div className="space-y-3">
            {activeSprints.map((sprint) => (
              <div key={sprint.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{sprint.sprintName}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{sprint.projectName}</p>
                  </div>
                  <StatusBadge type="status" value={sprint.status === 'active' ? 'in_progress' : sprint.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  <span>Tasks: {sprint.completedTasks}/{sprint.totalTasks}</span>
                  <span>{sprint.blockedTasks > 0 ? `Blocked: ${sprint.blockedTasks}` : ''}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sprint.endDate}</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${sprint.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked / Delayed Tasks */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Delayed & Blocked Tasks</h2>
          <div className="space-y-2">
            {blockedTasks.length > 0 ? (
              blockedTasks.map((wi) => (
                <div key={wi.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20">
                  <div className="w-6 h-6 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-xs font-bold text-red-700 dark:text-red-300 shrink-0">
                    {wi.assignedTo.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{wi.title}</p>
                    <p className="text-xs text-zinc-500">{wi.assignedTo} &middot; Due {wi.dueDate}</p>
                  </div>
                  <StatusBadge type="status" value="blocked" />
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No blocked tasks</p>
            )}
            {delayedTasks.filter((t) => new Date(t.dueDate) < new Date()).length > 0 && (
              <>
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">Overdue Tasks</h3>
                </div>
                {delayedTasks.filter((t) => new Date(t.dueDate) < new Date()).slice(0, 3).map((wi) => (
                  <div key={wi.id} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{wi.title}</p>
                      <p className="text-xs text-zinc-500">{wi.assignedTo}</p>
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Overdue</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workload Overview */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Team Task Distribution</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">Assignee</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">Tasks</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">In Progress</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">Done</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-500">Est. Hours</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-500">Actual</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                mockWorkItems.reduce<Record<string, { total: number; inProgress: number; done: number; est: number; act: number }>>((acc, wi) => {
                  if (!acc[wi.assignedTo]) acc[wi.assignedTo] = { total: 0, inProgress: 0, done: 0, est: 0, act: 0 }
                  acc[wi.assignedTo].total++
                  if (wi.status === 'in_progress') acc[wi.assignedTo].inProgress++
                  if (wi.status === 'done') acc[wi.assignedTo].done++
                  acc[wi.assignedTo].est += wi.estimatedHours
                  acc[wi.assignedTo].act += wi.actualHours
                  return acc
                }, {})
              ).map(([name, stats]) => (
                <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="py-2.5 px-3 font-medium text-zinc-800 dark:text-zinc-200">{name}</td>
                  <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">{stats.total}</td>
                  <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400">{stats.inProgress}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400">{stats.done}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{stats.est}h</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{stats.act}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
