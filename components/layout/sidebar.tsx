"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Briefcase,
  PieChart,
  Settings,
  ChevronDown,
  BarChart3,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Master Data",
    href: "/master-data",
    icon: Building2,
    children: [
      { name: "Entity", href: "/master-data/entity" },
      { name: "Organization", href: "/master-data/organization" },
      { name: "Payroll Config", href: "/master-data/payroll" },
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
      { name: "Payroll", href: "/hr/payroll" },
    ],
  },
  {
    name: "CRM",
    href: "/crm",
    icon: Briefcase,
    children: [
      { name: "Pipeline", href: "/crm/pipeline" },
      { name: "Leads", href: "/crm/leads" },
      { name: "Activities", href: "/crm/activities" },
    ],
  },
  {
    name: "Projects",
    href: "/projects",
    icon: PieChart,
    children: [
      { name: "All Projects", href: "/projects" },
      { name: "Kanban Board", href: "/projects/kanban" },
      { name: "Time Tracking", href: "/projects/time" },
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
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    children: [
      { name: "Employees", href: "/reports/employees" },
      { name: "Sales", href: "/reports/sales" },
      { name: "Projects", href: "/reports/projects" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(["Master Data", "HR", "CRM", "Projects", "Finance", "Reports"])

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <span className="text-lg font-bold text-slate-100">WIT-ERP</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const isExpanded = expanded.includes(item.name)

          return (
            <div key={item.name}>
              <button
                onClick={() => item.children && toggleExpand(item.name)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600/10 text-emerald-400"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.children && (
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded ? "rotate-180" : ""
                    )}
                  />
                )}
              </button>

              {/* Submenu */}
              {item.children && isExpanded && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-sm transition-colors",
                          isChildActive
                            ? "bg-emerald-600/10 text-emerald-400"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
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
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-emerald-600/10 text-emerald-400"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Link>
      </div>
    </div>
  )
}
