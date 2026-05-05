"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployees } from "@/hooks/useEmployees"
import { useEmployeeProfileDetails } from "@/hooks/useEmployeeProfileDetails"

export default function EmployeeDetailClient({ id }: { id: string }) {
  const { getEmployee } = useEmployees()
  const { getProfileDetails } = useEmployeeProfileDetails()
  const [employee, setEmployee] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [history, setHistory] = useState({
    familyMembers: [] as Record<string, unknown>[],
    educationHistories: [] as Record<string, unknown>[],
    informalEducations: [] as Record<string, unknown>[],
    organizationExperiences: [] as Record<string, unknown>[],
    workHistories: [] as Record<string, unknown>[],
    portfolioItems: [] as Record<string, unknown>[],
  })

  useEffect(() => {
    let cancelled = false
    setDetailLoading(true)
    setLoadError(null)
    setEmployee(null)

    getEmployee(id)
      .then((row) => {
        if (!cancelled && row) setEmployee(row)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Gagal memuat karyawan")
          setEmployee(null)
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    getProfileDetails(id)
      .then((detail) => {
        if (cancelled) return
        setHistory({
          familyMembers: detail.familyMembers,
          educationHistories: detail.educationHistories,
          informalEducations: detail.informalEducations,
          organizationExperiences: detail.organizationExperiences,
          workHistories: detail.workHistories,
          portfolioItems: detail.portfolioItems,
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [id, getEmployee, getProfileDetails])

  if (detailLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-400">{loadError || "Karyawan tidak ditemukan"}</p>
          <Link href="/hr/employees"><Button variant="outline" className="mt-4 border-slate-700">Kembali</Button></Link>
        </div>
      </div>
    )
  }

  const docs =
    employee.documents && typeof employee.documents === "object"
      ? (employee.documents as Record<string, unknown>)
      : {}
  const tax =
    docs.tax && typeof docs.tax === "object"
      ? (docs.tax as Record<string, unknown>)
      : {}
  const familyHistory = history.familyMembers
  const educationHistory = history.educationHistories
  const informalEducationHistory = history.informalEducations
  const organizationExperience = history.organizationExperiences
  const workHistory = history.workHistories
  const portfolio = history.portfolioItems

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/employees"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{employee.full_name}</h1>
            <p className="text-slate-400">
              {employee.employee_number || "-"} •{" "}
              {(employee as any).hr_positions?.name || "-"}
            </p>
          </div>
        </div>
        <Link href={`/hr/employees/${id}/edit`}><Button variant="outline" className="border-slate-700">Edit</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center"><User className="w-5 h-5 text-emerald-500" /></div>
              <div><p className="text-sm text-slate-400">Department</p><p className="font-medium text-slate-200">{(employee as any).departments?.name || "-"}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-sm text-slate-400">Posisi</p><p className="font-medium text-slate-200">{(employee as any).hr_positions?.name || "-"}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-sm text-slate-400">Status</p><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{employee.status || "active"}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="family">Keluarga</TabsTrigger>
          <TabsTrigger value="education">Pendidikan</TabsTrigger>
          <TabsTrigger value="career">Karier</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-slate-100">Informasi Pribadi & Kepegawaian</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{employee.email || "-"}</span></div>
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{employee.phone || "-"}</span></div>
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Join: {employee.join_date || "-"}</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{employee.address || "-"}</span></div>
                <div className="text-slate-300">NPWP: {employee.npwp || "-"}</div>
                <div className="text-slate-300">PTKP: {String((employee as any).ptkp_status || tax.ptkp_status || "-")}</div>
                <div className="text-slate-300">BPJS TK: {employee.bpjs_tk_number || "-"}</div>
                <div className="text-slate-300">BPJS Kesehatan: {employee.bpjs_kes_number || "-"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-slate-100">Riwayat Keluarga</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {familyHistory.length === 0 ? (
                <p className="text-slate-500">Belum ada data keluarga.</p>
              ) : (
                familyHistory.map((item, idx) => (
                  <div key={`family-${idx}`} className="rounded border border-slate-800 p-3">
                    <p className="text-slate-200 font-medium">{String(item.name || "-")} ({String(item.relation || "-")})</p>
                    <p className="text-slate-400 text-sm">HP: {String(item.phone || "-")} • Lahir: {String(item.birth_date || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-slate-100">Pendidikan Formal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {educationHistory.length === 0 ? (
                <p className="text-slate-500">Belum ada data pendidikan formal.</p>
              ) : (
                educationHistory.map((item, idx) => (
                  <div key={`edu-${idx}`} className="rounded border border-slate-800 p-3">
                    <p className="text-slate-200 font-medium">{String(item.level || "-")} — {String(item.institution || "-")}</p>
                    <p className="text-slate-400 text-sm">{String(item.major || "-")} • {String(item.start_year || "-")} - {String(item.end_year || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800 mt-4">
            <CardHeader><CardTitle className="text-slate-100">Pendidikan Informal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {informalEducationHistory.length === 0 ? (
                <p className="text-slate-500">Belum ada data pendidikan informal.</p>
              ) : (
                informalEducationHistory.map((item, idx) => (
                  <div key={`informal-${idx}`} className="rounded border border-slate-800 p-3">
                    <p className="text-slate-200 font-medium">{String(item.name || "-")} — {String(item.provider || "-")}</p>
                    <p className="text-slate-400 text-sm">Tahun: {String(item.year || "-")} • Sertifikat: {String(item.certificate || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="career" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-slate-100">Pengalaman Organisasi</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {organizationExperience.length === 0 ? (
                <p className="text-slate-500">Belum ada pengalaman organisasi.</p>
              ) : (
                organizationExperience.map((item, idx) => (
                  <div key={`org-${idx}`} className="rounded border border-slate-800 p-3">
                    <p className="text-slate-200 font-medium">{String(item.organization || "-")} — {String(item.role || "-")}</p>
                    <p className="text-slate-400 text-sm">{String(item.start_year || "-")} - {String(item.end_year || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800 mt-4">
            <CardHeader><CardTitle className="text-slate-100">Riwayat Pekerjaan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {workHistory.length === 0 ? (
                <p className="text-slate-500">Belum ada riwayat pekerjaan.</p>
              ) : (
                workHistory.map((item, idx) => (
                  <div key={`work-${idx}`} className="rounded border border-slate-800 p-3">
                    <p className="text-slate-200 font-medium">{String(item.company || "-")} — {String(item.position || "-")}</p>
                    <p className="text-slate-400 text-sm">{String(item.start_date || "-")} - {String(item.end_date || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-slate-100">Portfolio</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {portfolio.length === 0 ? (
                <p className="text-slate-500">Belum ada data portfolio.</p>
              ) : (
                portfolio.map((item, idx) => (
                  <div key={`portfolio-${idx}`} className="rounded border border-slate-800 p-3">
                    <p className="text-slate-200 font-medium">{String(item.title || "-")} ({String(item.year || "-")})</p>
                    <p className="text-slate-400 text-sm">{String(item.role || "-")}</p>
                    <p className="text-slate-400 text-sm">{String(item.url || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
