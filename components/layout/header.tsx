"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { insForge } from "@/lib/insforge";
import { getTenantId } from "@/lib/tenant";

type HeaderProfile = {
  full_name?: string | null
  hr_positions?: { name?: string | null } | null
}

export function Header() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<HeaderProfile | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const newIsDark = !isDark
    html.classList.toggle("dark", newIsDark)
    localStorage.setItem("theme", newIsDark ? "dark" : "light")
    setIsDark(newIsDark)
  }

  useEffect(() => {
    if (!user?.id || !insForge) return

    const tenantId = getTenantId()
    let cancelled = false

    const loadProfile = async () => {
      const byUserId = await insForge
        .from("user_profiles")
        .select("full_name,hr_positions:position_id(name)")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .maybeSingle()

      let found = (byUserId.data || null) as HeaderProfile | null

      if (!found && user.email) {
        const byEmail = await insForge
          .from("user_profiles")
          .select("full_name,hr_positions:position_id(name)")
          .eq("tenant_id", tenantId)
          .eq("email", user.email)
          .maybeSingle()
        found = (byEmail.data || null) as HeaderProfile | null
      }

      if (!cancelled) setProfile(found)
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.email])

  const displayName = profile?.full_name?.trim() || user?.email || "User"
  const displayPosition = profile?.hr_positions?.name?.trim() || "Tanpa jabatan"
  const initialSource = displayName.includes("@") ? displayName.split("@")[0] : displayName
  const avatarInitials = initialSource
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U"

  return (
    <header className="h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
      {/* Left — mobile menu + search */}
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-foreground size-8"
        >
          <Menu className="w-4 h-4" strokeWidth={1.5} />
        </Button>

        <div className="relative max-w-xs w-full hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <Input
            type="search"
            placeholder="Search..."
            className="h-8 pl-8 text-sm bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:ring-emerald-500/10 rounded-md"
          />
        </div>
      </div>

      {/* Right — theme toggle + notifications + avatar */}
      <div className="flex items-center gap-2">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground size-8 transition-colors"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground size-8"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-background" />
        </Button>

        <div className="hidden md:flex items-center gap-2.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 cursor-default">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25 shrink-0">
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="max-w-[160px] truncate text-xs font-medium text-foreground leading-tight">{displayName}</p>
            <p className="max-w-[160px] truncate text-[0.7rem] text-muted-foreground leading-tight">{displayPosition}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
