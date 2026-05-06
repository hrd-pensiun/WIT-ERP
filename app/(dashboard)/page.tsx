"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { Building2, CircleDot, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEmployees } from "@/hooks/useEmployees"
import { useDepartments } from "@/hooks/useDepartments"
import { useAttendance } from "@/hooks/useAttendance"
import { useLeave } from "@/hooks/useLeave"
import { useLeads } from "@/hooks/useLeads"
import { useOpportunities } from "@/hooks/useOpportunities"
import { useProjects } from "@/hooks/useProjects"
import { useInvoices } from "@/hooks/useInvoices"
import { usePerformance360Templates } from "@/hooks/usePerformance360Templates"
import { useActivities } from "@/hooks/useActivities"

function formatCompactIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatRelative(dateValue: string | null | undefined) {
  if (!dateValue) return "Unknown"
  const date = new Date(dateValue)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)))
    return `${hours} jam lalu`
  }
  if (diffMs < dayMs * 2) return "Yesterday"
  const days = Math.max(1, Math.floor(diffMs / dayMs))
  return `${days} hari lalu`
}

export default function DashboardPage() {
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees(undefined, { pollInterval: 300000 })
  const { departments, loading: departmentsLoading, fetchDepartments } = useDepartments(undefined, { pollInterval: 600000 })
  const { attendance, loading: attendanceLoading, fetchAttendance } = useAttendance(undefined, { pollInterval: 600000 })
  const { leaves, loading: leaveLoading, fetchLeaves } = useLeave(undefined, { pollInterval: 600000 })
  const { leads, loading: leadsLoading, fetchLeads } = useLeads(undefined, { pollInterval: 600000 })
  const { opportunities, loading: opportunitiesLoading, fetchOpportunities } = useOpportunities(undefined, { pollInterval: 600000 })
  const { projects, tasks, loading: projectsLoading, fetchProjects, fetchTasks } = useProjects(undefined, { pollInterval: 600000 })
  const { invoices, loading: invoicesLoading, fetchInvoices } = useInvoices(undefined, { pollInterval: 600000 })
  const { templates, loading: templatesLoading, refetch: refetchTemplates } = usePerformance360Templates()
  const { activities, loading: activitiesLoading, fetchActivities } = useActivities(undefined, { pollInterval: 120000 })

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  const loading =
    employeesLoading ||
    departmentsLoading ||
    attendanceLoading ||
    leaveLoading ||
    leadsLoading ||
    opportunitiesLoading ||
    projectsLoading ||
    invoicesLoading ||
    templatesLoading ||
    activitiesLoading

  const totalUsers = employees.length
  const totalProjects = projects.filter((item) =>
    ["active", "planning", "in_progress"].includes(String(item.status ?? "").toLowerCase())
  ).length
  const openTasks = tasks.filter((task) => !["done", "completed"].includes(String(task.status ?? "").toLowerCase())).length
  const healthStatus: "Operational" | "Maintenance" | "Down" = "Operational"

  const attendancePercentage = useMemo(() => {
    if (!attendance.length) return 0
    const present = attendance.filter((item) => String(item.status).toLowerCase() === "present").length
    return Math.round((present / attendance.length) * 100)
  }, [attendance])

  const pendingLeave = leaves.filter((item) => String(item.status ?? "").toLowerCase() === "pending").length
  const crmDeals = opportunities.filter((item) => !["lost"].includes(String(item.stage ?? "").toLowerCase())).length
  const projectsCompleted = projects.filter((item) =>
    ["done", "completed"].includes(String(item.status ?? "").toLowerCase())
  ).length
  const projectsOnTrack = projects.length
    ? Math.round((projects.filter((item) => (item.progress_percent ?? 0) >= 70).length / projects.length) * 100)
    : 0
  const monthlyRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount ?? inv.amount ?? 0), 0)
  const invoicesDue = invoices.filter((inv) => !["paid"].includes(String(inv.status ?? "").toLowerCase())).length
  const budgetUtilization = 78
  const activeTemplate = templates.find((tpl) => tpl.status === "active")
  const performanceStatus = activeTemplate ? "Active" : "Inactive"

  const quickStats = [
    { label: "Total Users", value: totalUsers, subtitle: "Active this month" },
    { label: "Total Projects", value: totalProjects, subtitle: "In progress" },
    { label: "Open Tasks", value: openTasks, subtitle: "Pending action" },
  ]

  const modules = [
    {
      title: "Master Data",
      icon: "📊",
      rows: [
        ["Employees", totalUsers.toString()],
        ["Departments", departments.length.toString()],
        ["Last updated", "Today"],
      ],
      href: "/master-data",
      cta: "View Details",
    },
    {
      title: "HR Management",
      icon: "👥",
      rows: [
        ["Attendance", `${attendancePercentage}%`],
        ["Leave Requests", pendingLeave.toString()],
        ["Performance", performanceStatus],
      ],
      href: "/hr",
      cta: "View Details",
    },
    {
      title: "CRM",
      icon: "🎯",
      rows: [
        ["Contacts", leads.length.toString()],
        ["Deals", crmDeals.toString()],
        ["Activities", activities.length.toString()],
      ],
      href: "/crm",
      cta: "Details",
    },
    {
      title: "Projects",
      icon: "📋",
      rows: [
        ["In Progress", totalProjects.toString()],
        ["Completed", projectsCompleted.toString()],
        ["On Track", `${projectsOnTrack}%`],
      ],
      href: "/projects",
      cta: "View Details",
    },
    {
      title: "Finance",
      icon: "💰",
      rows: [
        ["This Month", formatCompactIdr(monthlyRevenue)],
        ["Invoices Due", invoicesDue.toString()],
        ["Budget Status", `${budgetUtilization}%`],
      ],
      href: "/finance",
      cta: "View Details",
    },
    {
      title: "Performance",
      icon: "⭐",
      rows: [
        ["Avg Score", "3.5/5.0"],
        ["Assessment", performanceStatus],
        ["Completion", `${projectsOnTrack}%`],
      ],
      href: "/performance/360/dashboard",
      cta: "Details",
    },
  ]

  const recentActivities = activities.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Main Dashboard</h1>
          <p className="text-sm text-slate-400">Ringkasan semua modul dalam satu tampilan.</p>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          onClick={() => {
            void fetchEmployees()
            void fetchDepartments()
            void fetchAttendance()
            void fetchLeaves()
            void fetchLeads()
            void fetchOpportunities()
            void fetchProjects()
            void fetchTasks()
            void fetchInvoices()
            void fetchActivities()
            void refetchTemplates()
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => (
          <Card key={item.label} className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">System</p>
            <div className="mt-2">
              <Badge
                className={
                  healthStatus === "Operational"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : healthStatus === "Maintenance"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      : "bg-red-500/15 text-red-400 border border-red-500/20"
                }
              >
                {healthStatus}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">All systems OK</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title} className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-100">
                <span className="mr-2">{module.icon}</span>
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.rows.map(([name, value]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{name}</span>
                  <span className="font-medium text-slate-200">{value}</span>
                </div>
              ))}
              <Link href={module.href} className="block pt-2">
                <Button variant="outline" className="w-full border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800">
                  {module.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat aktivitas...
            </div>
          ) : recentActivities.length ? (
            recentActivities.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="flex items-start gap-2 text-sm text-slate-100">
                  <CircleDot className="mt-0.5 h-4 w-4 text-blue-400" />
                  {item.subject || item.title || "Aktivitas baru tercatat"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatRelative(item.created_at || item.scheduled_at)} • CRM
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Belum ada aktivitas terbaru.</p>
          )}
          <Link href="/crm/activities" className="inline-flex text-sm text-emerald-400 hover:text-emerald-300">
            View all activities
          </Link>
        </CardContent>
      </Card>

    </div>
  )
}
