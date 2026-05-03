"use client"

import { useEffect, useState } from "react"
import {
  Users,
  Clock,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  Building2,
  Wallet,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useEmployees } from "@/hooks/useEmployees"
import { useAttendance } from "@/hooks/useAttendance"
import { useLeads } from "@/hooks/useLeads"
import { useOpportunities } from "@/hooks/useOpportunities"
import { useProjects } from "@/hooks/useProjects"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts"

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const { employees, loading: empLoading } = useEmployees({ pollInterval: 30000 })
  const { attendance, loading: attLoading } = useAttendance({ pollInterval: 30000 })
  const { leads, loading: leadLoading } = useLeads({ pollInterval: 30000 })
  const { opportunities, loading: oppLoading } = useOpportunities({ pollInterval: 30000 })
  const { projects, loading: projLoading } = useProjects({ pollInterval: 30000 })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Calculate real stats
  const totalEmployees = employees.length
  const activeLeads = leads.filter(l => l.status !== 'closed_won' && l.status !== 'closed_lost').length
  const ongoingProjects = projects.filter(p => p.status === 'active' || p.status === 'planning').length
  const revenueThisMonth = 0
  const revenueLastMonth = 0

  // Attendance data for chart
  const attendanceChartData = [
    { day: "Sen", present: attendance?.filter((a: any) => a.status === 'present').length || 0, absent: attendance?.filter((a: any) => a.status === 'absent').length || 0 },
    { day: "Sel", present: 0, absent: 0 },
    { day: "Rab", present: 0, absent: 0 },
    { day: "Kam", present: 0, absent: 0 },
    { day: "Jum", present: 0, absent: 0 },
  ]

  // Pipeline data for pie chart
  const pipelineData = [
    { name: 'Discovery', value: opportunities.filter(o => o.stage === 'discovery').length },
    { name: 'Proposal', value: opportunities.filter(o => o.stage === 'proposal').length },
    { name: 'Negotiation', value: opportunities.filter(o => o.stage === 'negotiation').length },
    { name: 'Contract', value: opportunities.filter(o => o.stage === 'contract').length },
    { name: 'Won', value: opportunities.filter(o => o.stage === 'won').length },
  ].filter(d => d.value > 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      notation: "compact",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/employees/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/hr/employees/new"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Karyawan</Button></Link>
        <Link href="/crm/leads/new"><Button size="sm" variant="outline" className="border-slate-700"><Plus className="w-4 h-4 mr-2" />Lead</Button></Link>
        <Link href="/projects/new"><Button size="sm" variant="outline" className="border-slate-700"><Plus className="w-4 h-4 mr-2" />Project</Button></Link>
        <Link href="/finance/invoices/new"><Button size="sm" variant="outline" className="border-slate-700"><Plus className="w-4 h-4 mr-2" />Invoice</Button></Link>
        <Link href="/hr/attendance/new"><Button size="sm" variant="outline" className="border-slate-700"><Plus className="w-4 h-4 mr-2" />Absensi</Button></Link>
        <Link href="/hr/leave/new"><Button size="sm" variant="outline" className="border-slate-700"><Plus className="w-4 h-4 mr-2" />Cuti</Button></Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Karyawan</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{totalEmployees}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+5% this month</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Kehadiran</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+2.1% vs minggu lalu</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Leads</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{activeLeads}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">-1 dari kemarin</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Revenue (MTD)</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(revenueThisMonth)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+16.3% vs bulan lalu</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Trend Kehadiran</CardTitle>
            <CardDescription className="text-slate-400">Kehadiran mingguan</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceChartData.some(d => d.present > 0 || d.absent > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                Belum ada data kehadiran
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Pie Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Pipeline CRM</CardTitle>
            <CardDescription className="text-slate-400">Distribusi opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Legend fontSize={12} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                Belum ada data pipeline
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Line Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Trend Revenue</CardTitle>
            <CardDescription className="text-slate-400">6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
              Data revenue belum tersedia
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100">Sales Pipeline</CardTitle>
              <CardDescription className="text-slate-400">Active opportunities by stage</CardDescription>
            </div>
            <Link href="/crm/pipeline">
              <Button variant="ghost" size="sm" className="text-emerald-400">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.length > 0 ? pipelineData.map((stage, idx) => (
                <div key={stage.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-300">{stage.name}</span>
                      <span className="text-sm text-slate-400">{stage.value} deals</span>
                    </div>
                    <Progress value={(stage.value / Math.max(...pipelineData.map(d => d.value))) * 100} className="h-2 bg-slate-800" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Belum ada opportunity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">Latest updates across modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 text-sm">
              Aktivitas terbaru akan muncul di sini
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-100">Active Projects</CardTitle>
            <CardDescription className="text-slate-400">Project progress and status</CardDescription>
          </div>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-emerald-400">
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.length > 0 ? projects.slice(0, 3).map((project: any) => (
              <div key={project.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-200">{project.project_name}</h4>
                  <Badge variant="outline" className={project.health === "green" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"}>
                    {project.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-slate-300">{project.progress_percent || 0}%</span>
                  </div>
                  <Progress value={project.progress_percent || 0} className="h-2 bg-slate-800" />
                </div>
              </div>
            )) : (
              <div className="md:col-span-3 text-center py-8 text-slate-500 text-sm">
                Belum ada project aktif
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
