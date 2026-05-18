'use client'

import { KpiCard } from '@/components/workforce/kpi-card'
import { mockCommercialProjects, mockWorkforceDashboard, mockUtilizationHistory } from '@/hooks/useWorkforceMockData'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  BarChart3,
  Activity,
  AlertTriangle,
} from 'lucide-react'

export default function ExecutiveDashboard() {
  const totalRevenue = mockCommercialProjects.reduce((s, p) => s + p.revenue, 0)
  const totalBudget = mockCommercialProjects.reduce((s, p) => s + p.budget, 0)
  const activeProjects = mockCommercialProjects.filter((p) => p.status === 'delivery' || p.status === 'won').length
  const avgProfitability = mockCommercialProjects
    .filter((p) => p.profitability > 0)
    .reduce((s, p) => s + p.profitability, 0) / mockCommercialProjects.filter((p) => p.profitability > 0).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Executive Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Company-wide KPI summary, profitability & operational visibility</p>
      </div>

      {/* KPI Cards - Executive Level */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Company Utilization"
          value={`${mockWorkforceDashboard.averageUtilization}%`}
          subtitle="Workforce efficiency"
          icon={<Activity className="w-4 h-4" />}
          trend="up"
          trendValue={`+${mockWorkforceDashboard.utilizationTrend}%`}
          variant="success"
        />
        <KpiCard
          title="Total Revenue"
          value={`Rp ${(totalRevenue / 1e9).toFixed(1)}B`}
          subtitle="All projects"
          icon={<DollarSign className="w-4 h-4" />}
          trend="up"
          trendValue="+18% YoY"
        />
        <KpiCard
          title="Active Projects"
          value={activeProjects}
          subtitle="In delivery"
          icon={<Briefcase className="w-4 h-4" />}
        />
        <KpiCard
          title="Avg Profitability"
          value={`${Math.round(avgProfitability)}%`}
          subtitle="Project margin"
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Utilization Trend */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Company Utilization Rate</h2>
            <BarChart3 className="w-4 h-4 text-zinc-400" />
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
          <p className="text-xs text-zinc-500 mt-3">Annual trend: billable vs non-billable hours</p>
        </div>

        {/* Project Performance */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Project Performance</h2>
          <div className="space-y-3">
            {mockCommercialProjects
              .filter((p) => p.health === 'healthy' || p.health === 'critical')
              .map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    p.health === 'healthy' ? 'bg-emerald-500' : p.health === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.projectName}</p>
                    <p className="text-xs text-zinc-500">{p.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{p.progressPercent}%</p>
                    <p className="text-[0.6rem] text-zinc-400">Margin: {p.profitability}%</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Department Overview</h2>
          <div className="space-y-3">
            {mockWorkforceDashboard.departmentUtilization.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{dept.department}</p>
                  <p className="text-xs text-zinc-500">{dept.headcount} employees</p>
                </div>
                <span className={cn(
                  'text-sm font-semibold',
                  dept.rate >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                  dept.rate >= 70 ? 'text-blue-600 dark:text-blue-400' :
                  dept.rate >= 55 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
                )}>
                  {dept.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Key Business Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Headcount', value: mockWorkforceDashboard.totalEmployees, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Overloaded %', value: `${Math.round((mockWorkforceDashboard.overloadedCount / mockWorkforceDashboard.totalEmployees) * 100)}%`, color: 'text-red-600 dark:text-red-400' },
              { label: 'Avg Project Margin', value: `${Math.round(avgProfitability)}%`, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Completion Rate', value: `${mockWorkforceDashboard.workItemSummary.averageCompletionRate}%`, color: 'text-blue-600 dark:text-blue-400' },
            ].map((metric) => (
              <div key={metric.label} className="text-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{metric.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
