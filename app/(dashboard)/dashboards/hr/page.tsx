'use client'

import { KpiCard } from '@/components/workforce/kpi-card'
import { AllocationBar } from '@/components/workforce/allocation-bar'
import { mockWorkforceDashboard, mockAllocations, mockUtilizationHistory } from '@/hooks/useWorkforceMockData'
import { cn } from '@/lib/utils'
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
} from 'lucide-react'

export default function HRDashboard() {
  const { departmentUtilization } = mockWorkforceDashboard
  const avgUtil = mockWorkforceDashboard.averageUtilization

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">HR Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Workforce monitoring, utilization & manpower visibility</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Headcount"
          value={mockWorkforceDashboard.totalEmployees}
          subtitle={`${mockWorkforceDashboard.activeEmployees} active`}
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          title="Utilization"
          value={`${avgUtil}%`}
          subtitle="Company average"
          icon={<Activity className="w-4 h-4" />}
          trend="up"
          trendValue={`+${mockWorkforceDashboard.utilizationTrend}%`}
        />
        <KpiCard
          title="Overloaded"
          value={mockWorkforceDashboard.overloadedCount}
          variant="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          title="Departments"
          value={departmentUtilization.length}
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Utilization Trend */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Utilization Trend</h2>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="h-48 flex items-end gap-1.5">
            {mockUtilizationHistory.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col items-center justify-end h-40 gap-0.5">
                  <div
                    className="w-full bg-emerald-400 dark:bg-emerald-600 rounded-t-sm transition-all"
                    style={{ height: `${m.billable}%` }}
                  />
                  <div
                    className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-t-sm transition-all"
                    style={{ height: `${m.nonBillable}%` }}
                  />
                </div>
                <span className="text-[0.6rem] text-zinc-500 dark:text-zinc-400">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400 dark:bg-emerald-600" /> Billable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-200 dark:bg-emerald-800" /> Non-Billable
            </span>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Department Utilization</h2>
            <div className="space-y-3">
              {departmentUtilization.map((dept) => (
                <div key={dept.department}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{dept.department}</span>
                    <span className="text-zinc-500">{dept.rate}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        dept.rate >= 85 ? 'bg-emerald-500' : dept.rate >= 70 ? 'bg-blue-500' : dept.rate >= 55 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Status */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Workforce Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { label: 'Critical', count: mockAllocations.filter((a) => a.status === 'critical').length, color: 'bg-red-500', desc: 'Above 100% allocation' },
            { label: 'Optimal', count: mockAllocations.filter((a) => a.status === 'optimal').length, color: 'bg-emerald-500', desc: '70-90% allocation' },
            { label: 'Underloaded', count: mockAllocations.filter((a) => a.status === 'underloaded').length, color: 'bg-amber-500', desc: 'Below 70% allocation' },
          ]).map((status) => (
            <div key={status.label} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 text-center">
              <span className={cn('w-3 h-3 rounded-full inline-block mb-2', status.color)} />
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{status.count}</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{status.label}</p>
              <p className="text-xs text-zinc-500">{status.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
