"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, X, LayoutDashboard, Building2, Users, 
  Wallet, Briefcase, PieChart, Settings, LineChart 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

const mobileNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Master Data", href: "/master-data", icon: Building2 },
  { name: "HR", href: "/hr", icon: Users },
  { name: "CRM", href: "/crm", icon: Briefcase },
  { name: "Projects", href: "/projects", icon: PieChart },
  { name: "Finance", href: "/finance", icon: Wallet },
  { name: "Performance", href: "/performance/360/dashboard", icon: LineChart },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const normalizedRole = (user?.profileRole ?? "").trim().toLowerCase()
  const isStaffOrManager = normalizedRole === "employee" || normalizedRole === "manager"
  const navItems = mobileNavItems.map((item) =>
    item.name === "Performance" && isStaffOrManager
      ? { ...item, href: "/performance/360-feedback" }
      : item
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="text-lg font-semibold text-slate-100">WeWok.dtk</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-slate-100"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        lg:hidden fixed top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 z-40
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.name === "Performance"
                ? pathname.startsWith("/performance")
                : pathname === item.href || pathname.startsWith(item.href + "/")
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                  isActive 
                    ? "bg-emerald-600/10 text-emerald-500"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
          
          <hr className="border-slate-800 my-2" />
          
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Bottom Tab Bar (for very small screens) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
        <nav className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 min-w-0 flex-1",
                  isActive ? "text-emerald-500" : "text-slate-500"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
