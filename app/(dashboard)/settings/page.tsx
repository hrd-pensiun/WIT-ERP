"use client"

import { useEffect, useMemo, useState } from "react"
import { ShieldCheck, User, Mail, Building2, Briefcase, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

type EmployeeProfile = {
  id: string
  full_name?: string | null
  employee_number?: string | null
  email?: string | null
  phone?: string | null
  status?: string | null
  join_date?: string | null
  app_role?: string | null
  user_id?: string | null
  departments?: { name?: string | null } | null
  divisions?: { name?: string | null } | null
  hr_positions?: { name?: string | null } | null
  hr_job_grades?: { name?: string | null; level?: number | null } | null
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [relinkLoading, setRelinkLoading] = useState(false)
  const [relinkMessage, setRelinkMessage] = useState<string | null>(null)

  const effectiveRole = useMemo(() => {
    const metadataRole = user?.metadata?.role
    if (typeof metadataRole === "string" && metadataRole.length > 0) return metadataRole
    if (typeof user?.profileRole === "string" && user.profileRole.length > 0) return user.profileRole
    return "employee"
  }, [user])

  useEffect(() => {
    if (!user?.id || !insForge) return

    const tenantId = getTenantId()
    let cancelled = false

    const loadProfile = async () => {
      setLoadingProfile(true)
      setProfileError(null)
      try {
        const byUserId = await insForge
          .from("user_profiles")
          .select(
            "id,user_id,full_name,employee_number,email,phone,status,join_date,app_role,departments:department_id(name),divisions:division_id(name),hr_positions:position_id(name),hr_job_grades:job_grade_id(name,level)"
          )
          .eq("tenant_id", tenantId)
          .eq("user_id", user.id)
          .maybeSingle()

        let found = (byUserId.data || null) as EmployeeProfile | null

        if (!found && user.email) {
          const byEmail = await insForge
            .from("user_profiles")
            .select(
              "id,user_id,full_name,employee_number,email,phone,status,join_date,app_role,departments:department_id(name),divisions:division_id(name),hr_positions:position_id(name),hr_job_grades:job_grade_id(name,level)"
            )
            .eq("tenant_id", tenantId)
            .eq("email", user.email)
            .maybeSingle()
          found = (byEmail.data || null) as EmployeeProfile | null
        }

        if (!cancelled) setProfile(found)
      } catch (error) {
        if (!cancelled) {
          setProfile(null)
          setProfileError(error instanceof Error ? error.message : "Gagal memuat profil karyawan.")
        }
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.email])

  const handleRelinkProfile = async () => {
    if (!insForge || !user?.id) return
    setRelinkLoading(true)
    setRelinkMessage(null)
    try {
      const tenantId = getTenantId()

      let targetProfileId = profile?.id ?? null
      if (!targetProfileId && user.email) {
        const byEmail = await insForge
          .from("user_profiles")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("email", user.email)
          .maybeSingle()
        targetProfileId = (byEmail.data as { id?: string } | null)?.id || null
      }

      if (!targetProfileId) {
        setRelinkMessage("Profil karyawan dengan email login tidak ditemukan.")
        return
      }

      const { error } = await insForge
        .from("user_profiles")
        .update({ user_id: user.id })
        .eq("tenant_id", tenantId)
        .eq("id", targetProfileId)

      if (error) throw error

      const refreshed = await insForge
        .from("user_profiles")
        .select(
          "id,user_id,full_name,employee_number,email,phone,status,join_date,app_role,departments:department_id(name),divisions:division_id(name),hr_positions:position_id(name),hr_job_grades:job_grade_id(name,level)"
        )
        .eq("tenant_id", tenantId)
        .eq("id", targetProfileId)
        .maybeSingle()
      setProfile((refreshed.data || null) as EmployeeProfile | null)
      setRelinkMessage("Profil berhasil dihubungkan ke akun login ini.")
    } catch (error) {
      setRelinkMessage(error instanceof Error ? error.message : "Gagal relink profile.")
    } finally {
      setRelinkLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">Informasi akun login dan profil karyawan.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Akun Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {authLoading ? (
            <p className="text-slate-400 text-sm">Memuat akun...</p>
          ) : !user ? (
            <p className="text-red-400 text-sm">User belum terautentikasi.</p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-slate-400 text-sm">Email Login</span>
                <span className="text-slate-100 text-sm font-medium">{user.email || "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-slate-400 text-sm">Role Aktif</span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  {effectiveRole}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-500" />
              Profil Karyawan
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-200"
              onClick={handleRelinkProfile}
              disabled={relinkLoading || !user}
            >
              {relinkLoading ? "Relink..." : "Refresh / Re-link Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {relinkMessage ? (
            <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              {relinkMessage}
            </div>
          ) : null}
          {loadingProfile ? (
            <p className="text-slate-400 text-sm">Memuat profil karyawan...</p>
          ) : profileError ? (
            <p className="text-red-400 text-sm">{profileError}</p>
          ) : !profile ? (
            <p className="text-amber-400 text-sm">
              Profil belum terhubung ke akun ini. Pastikan employee memiliki email yang sama atau `user_id` yang ter-link.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Nama Lengkap</p>
                <p className="text-slate-100">{profile.full_name || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Nomor Karyawan</p>
                <p className="text-slate-100">{profile.employee_number || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Email Profil
                </p>
                <p className="text-slate-100">{profile.email || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Role Profil</p>
                <p className="text-slate-100">{profile.app_role || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Link ke Auth User</p>
                <p className="text-slate-100">{profile.user_id || "Belum ter-link"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Departemen / Divisi
                </p>
                <p className="text-slate-100">
                  {profile.departments?.name || "-"} / {profile.divisions?.name || "-"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  Jabatan / Grade
                </p>
                <p className="text-slate-100">
                  {profile.hr_positions?.name || "-"} / {profile.hr_job_grades?.name || "-"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Join Date
                </p>
                <p className="text-slate-100">
                  {profile.join_date ? new Date(profile.join_date).toLocaleDateString("id-ID") : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="text-slate-100">{profile.status || "-"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
