"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
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
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      {/* Left - Mobile menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-400 hover:text-slate-100"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Cari..."
            className="pl-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Right - Notifications */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="max-w-[180px] truncate text-sm font-medium text-slate-100 leading-tight">{displayName}</p>
            <p className="max-w-[180px] truncate text-xs text-slate-400 leading-tight">{displayPosition}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-slate-100"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
