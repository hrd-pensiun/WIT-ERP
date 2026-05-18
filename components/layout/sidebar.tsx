"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Briefcase,
  PieChart,
  BarChart3,
  ChevronRight,
  LineChart,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Banknote,
  GanttChart,
  Monitor,
  Calculator,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Workforce",
    href: "/workforce",
    icon: GanttChart,
    children: [
      { name: "Dashboard", href: "/workforce" },
      { name: "Workload", href: "/workforce/workload" },
      { name: "Allocation", href: "/workforce/allocation" },
      { name: "Timesheet", href: "/workforce/timesheet" },
    ],
  },
  {
    name: "Commercial",
    href: "/commercial/raw-calculator",
    icon: Calculator,
    children: [
      { name: "Calculator", href: "/commercial/raw-calculator" },
      { name: "Projects", href: "/projects" },
      { name: "Rate Cards", href: "/commercial/rate-cards" },
      { name: "Master Data", href: "/commercial/master-data" },
      { name: "Leads", href: "/commercial/leads" },
      { name: "Manajemen Klien", href: "/commercial/clients" },
      { name: "Manajemen Perusahaan", href: "/commercial/companies" },
      { name: "Activities", href: "/commercial/activities" },
    ],
  },
  {
    name: "Projects",
    href: "/projects",
    icon: PieChart,
    children: [
      { name: "All Projects", href: "/projects" },
    ],
  },
  {
    name: "Master Data",
    href: "/master-data",
    icon: Building2,
    children: [
      { name: "Entity", href: "/master-data/entity" },
      { name: "Organization", href: "/master-data/organization" },
      { name: "Payroll Config", href: "/master-data/payroll" },
      { name: "Kalender & Shift", href: "/master-data/hr" },
    ],
  },
  {
    name: "HR",
    href: "/hr",
    icon: Users,
    children: [
      { name: "Employees", href: "/hr/employees" },
      { name: "Attendance", href: "/hr/attendance" },
      { name: "Leave", href: "/hr/leave" },
    ],
  },
  {
    name: "Payroll",
    href: "/payroll",
    icon: Banknote,
    children: [
      { name: "Kompensasi Karyawan",   href: "/payroll/compensation" },
      { name: "Proses Penggajian",      href: "/payroll/processing" },
      { name: "Persetujuan Payroll",    href: "/payroll/approval" },
      { name: "Slip Gaji & Pembayaran", href: "/payroll/slips" },
      { name: "Pajak & Potongan",       href: "/payroll/tax" },
      { name: "Laporan Payroll",        href: "/payroll/reports" },
      { name: "Analitik Payroll",       href: "/payroll/analytics" },
    ],
  },
  {
    name: "Finance",
    href: "/finance",
    icon: Wallet,
    children: [
      { name: "BOPP Calculator", href: "/finance/bopp" },
      { name: "Invoices", href: "/finance/invoices" },
      { name: "Expenses", href: "/finance/expenses" },
    ],
  },
  {
    name: "Performance",
    href: "/performance",
    icon: LineChart,
    children: [
      { name: "Dashboard", href: "/performance/360/dashboard" },
      { name: "Template penilaian", href: "/performance/360/template" },
      { name: "Mapping Penilaian", href: "/performance/360/mapping-penilaian" },
      { name: "Konfigurasi", href: "/performance/360/konfigurasi" },
      { name: "My Performance", href: "/performance/360-feedback" },
    ],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    children: [
      { name: "Executive", href: "/dashboards/executive" },
      { name: "Employees", href: "/reports/employees" },
      { name: "Sales", href: "/reports/sales" },
      { name: "Projects", href: "/reports/projects" },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (v: boolean) => void
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user } = useAuth()
  const [expanded, setExpanded] = useState<string[]>([])

  const normalizedRole = (user?.profileRole ?? "").trim().toLowerCase()
  const isStaffOrManager = normalizedRole === "employee" || normalizedRole === "manager"
  const navItems = navigation.map((item) => {
    if (item.name !== "Performance" || !item.children || !isStaffOrManager) return item
    return {
      ...item,
      children: item.children.filter((child) => child.href === "/performance/360-feedback"),
    }
  })

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      router.replace("/login")
    }
  }

  return (
    <div
      className={cn(
        "h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300",
        collapsed ? "w-[60px]" : "w-64"
      )}
      style={{
        background: "linear-gradient(160deg, #0d3535 0%, #0a2a2a 50%, #061e1e 100%)",
      }}
    >
      {/* Logo + collapse */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-white/10">
        {!collapsed && (
          <span className="text-2xl font-black text-white tracking-tight leading-none select-none">
            WIT<span className="text-red-500">.</span>
          </span>
        )}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-all",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
            : <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const isExpanded = expanded.includes(item.name)

          return (
            <div key={item.name}>
              <button
                onClick={() => item.children ? toggleExpand(item.name) : router.push(item.href)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "group w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[0.8125rem] font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "gap-2.5")}>
                  <item.icon
                    className={cn(
                      "shrink-0 transition-colors",
                      collapsed ? "w-5 h-5" : "w-4 h-4",
                      isActive ? "text-white" : "text-white/60 group-hover:text-white"
                    )}
                    strokeWidth={1.5}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && item.children && (
                  <ChevronRight
                    className={cn(
                      "w-3.5 h-3.5 text-white/30 transition-transform duration-200",
                      isExpanded ? "rotate-90" : ""
                    )}
                    strokeWidth={1.5}
                  />
                )}
              </button>

              {/* Submenu */}
              {!collapsed && item.children && isExpanded && (
                <div className="ml-[1.625rem] mt-0.5 mb-0.5 space-y-0.5 pl-2 border-l border-white/15">
                  {item.children.map((child) => {
                    const isChildActive =
                      pathname === child.href ||
                      pathname.startsWith(`${child.href}/`)
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "block px-2.5 py-1.5 rounded-md text-[0.78rem] transition-all duration-150",
                          isChildActive
                            ? "text-white bg-white/15"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-white/10 space-y-0.5 shrink-0">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center px-2.5 py-2 rounded-md text-[0.8125rem] font-medium transition-all duration-150",
            collapsed ? "justify-center" : "gap-2.5",
            pathname === "/settings"
              ? "bg-white/15 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <Settings className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} strokeWidth={1.5} />
          {!collapsed && "Settings"}
        </Link>
        <button
          type="button"
          onClick={() => { void handleLogout() }}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center px-2.5 py-2 rounded-md text-[0.8125rem] font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150",
            collapsed ? "justify-center" : "gap-2.5"
          )}
        >
          <LogOut className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} strokeWidth={1.5} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  )
}
