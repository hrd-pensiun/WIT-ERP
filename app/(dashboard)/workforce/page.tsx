'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/workforce/kpi-card'
import { StatusBadge } from '@/components/workforce/status-badge'
import { WorkItemTable } from '@/components/workforce/work-item-table'
import { AllocationBar, UtilizationDot } from '@/components/workforce/allocation-bar'
import { mockWorkforceDashboard, mockWorkItems, mockAllocations, mockUtilizationHistory } from '@/hooks/useWorkforceMockData'
import type { WorkItem } from '@/types/workforce'
import {
  Users,
  Activity,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  BarChart3,
  Clock,
  ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function WorkforceDashboard() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string>('all')

  const filteredItems = selectedType === 'all'
    ? mockWorkItems
    : mockWorkItems.filter((wi) => wi.type === selectedType)

  const { workItemSummary: summary, departmentUtilization } = mockWorkforceDashboard

  const workTypeBreakdown = [
    { type: 'project_task', label: 'Project Task', count: summary.byType.project_task, color: 'bg-purple-500', value: 34 },
    { type: 'operational_task', label: 'Operational', count: summary.byType.operational_task, color: 'bg-teal-500', value: 22 },
    { type: 'support_task', label: 'Support', count: summary.byType.support_task, color: 'bg-cyan-500', value: 28 },
    { type: 'improvement_task', label: 'Improvement', count: summary.byType.improvement_task, color: 'bg-indigo-500', value: 10 },
    { type: 'incident_task', label: 'Incident', count: summary.byType.incident_task, color: 'bg-rose-500', value: 6 },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Workforce Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manpower visibility & workload monitoring across the company</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Employees"
          value={mockWorkforceDashboard.activeEmployees}
          subtitle={`${mockWorkforceDashboard.totalEmployees} total headcount`}
          icon={<Users className="w-4 h-4" />}
          trend="up"
          trendValue="+2 this month"
          onClick={() => router.push('/hr/employees')}
        />
        <KpiCard
          title="Avg Utilization"
          value={`${mockWorkforceDashboard.averageUtilization}%`}
          subtitle="Across all departments"
          icon={<Activity className="w-4 h-4" />}
          trend="up"
          trendValue={`+${mockWorkforceDashboard.utilizationTrend}%`}
        />
        <KpiCard
          title="Overloaded"
          value={mockWorkforceDashboard.overloadedCount}
          subtitle="Employees above 100%"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="danger"
          onClick={() => router.push('/workforce/allocation')}
        />
        <KpiCard
          title="Idle / Low"
          value={mockWorkforceDashboard.idleCount}
          subtitle="Employees below 50%"
          icon={<UserCheck className="w-4 h-4" />}
          variant="warning"
          onClick={() => router.push('/workforce/allocation')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Utilization by Department */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Utilization by Department</h2>
            <BarChart3 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="space-y-3">
            {departmentUtilization.map((dept) => (
              <div key={dept.department} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{dept.department}</p>
                  <p className="text-[0.65rem] text-zinc-400">{dept.headcount} employees</p>
                </div>
                <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      dept.rate >= 85 ? 'bg-emerald-500' : dept.rate >= 70 ? 'bg-blue-500' : dept.rate >= 55 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-400 w-10 text-right">{dept.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Work Item Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Work Items</h2>
            <ListTodo className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="space-y-3">
            {workTypeBreakdown.map((wt) => (
              <div key={wt.type} className="flex items-center gap-3">
                <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', wt.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{wt.label}</span>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{wt.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', wt.color)} style={{ width: `${(wt.count / summary.totalWorkItems) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Overdue Items</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{summary.overdueCount}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              <span>Avg Completion Rate</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{summary.averageCompletionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Status */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Employee Workload Status</h2>
          <div className="flex items-center gap-3">
            {(['all', 'critical', 'overloaded', 'optimal', 'underloaded'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {}}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full transition-colors capitalize',
                  selectedType === status
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {mockAllocations.slice(0, 8).map((alloc) => (
            <div key={alloc.id} className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {alloc.employeeName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{alloc.employeeName}</span>
                  <span className={cn(
                    'text-xs font-semibold tabular-nums',
                    alloc.totalAllocation > 100 ? 'text-red-600 dark:text-red-400' :
                    alloc.totalAllocation >= 90 ? 'text-amber-600 dark:text-amber-400' :
                    alloc.totalAllocation >= 50 ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-zinc-400 dark:text-zinc-500'
                  )}>
                    {alloc.totalAllocation}%
                  </span>
                </div>
                <AllocationBar
                  segments={alloc.allocations.map((a) => ({
                    label: a.projectName,
                    percentage: a.percentage,
                    color: '',
                  }))}
                  total={alloc.totalAllocation}
                  size="sm"
                  showLabel={false}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => router.push('/workforce/allocation')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            View all allocations →
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Activities</h2>
          <Clock className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="space-y-2">
          {mockWorkforceDashboard.recentActivities.map((act) => (
            <div key={act.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[0.6rem] font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
                {act.employeeName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-zinc-800 dark:text-zinc-200">
                  <span className="font-medium">{act.employeeName}</span>{' '}
                  <span className="text-zinc-500 dark:text-zinc-400">{act.action}</span>{' '}
                  <span className="font-medium">{act.item}</span>
                </span>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
