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
  History,
  TrendingUp,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployees } from "@/hooks/useEmployees"
import { useEmployeeProfileDetails } from "@/hooks/useEmployeeProfileDetails"
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll"
import { useEmployeeCompensation, SALARY_REASONS } from "@/hooks/useEmployeeCompensation"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default function EmployeeDetailClient({ id }: { id: string }) {
  const { getEmployee } = useEmployees()
  const { getProfileDetails } = useEmployeeProfileDetails()
  const { payrollHistory, latestPayroll, loading: payrollLoading } = useEmployeePayroll(id)
  const { salaryHistory, allowances: compAllowances, currentSalary, loading: compLoading, fetchAllowanceHistory } = useEmployeeCompensation(id)

  // History modal (read-only)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTitle, setHistoryTitle] = useState("")

  const openHistory = async (allowanceId: string, name: string) => {
    setHistoryTitle(name)
    setHistoryModalOpen(true)
    setHistoryLoading(true)
    const items = await fetchAllowanceHistory(allowanceId)
    setHistoryItems(items)
    setHistoryLoading(false)
  }

  const reasonLabel = (r: string) => SALARY_REASONS.find((x) => x.value === r)?.label || r
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
      <div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{loadError || "Karyawan tidak ditemukan"}</p>
          <Link href="/hr/employees"><Button variant="outline" className="mt-4 border-border">Kembali</Button></Link>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/employees"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{employee.full_name}</h1>
            <p className="text-muted-foreground">
              {employee.employee_number || "-"} •{" "}
              {(employee as any).hr_positions?.name || "-"}
            </p>
          </div>
        </div>
        <Link href={`/hr/employees/${id}/edit`}><Button variant="outline" className="border-border">Edit</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center"><User className="w-5 h-5 text-emerald-500" /></div>
              <div><p className="text-sm text-muted-foreground">Department</p><p className="font-medium text-foreground">{(employee as any).departments?.name || "-"}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-sm text-muted-foreground">Posisi</p><p className="font-medium text-foreground">{(employee as any).hr_positions?.name || "-"}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-sm text-muted-foreground">Status</p><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{employee.status || "active"}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="family">Keluarga</TabsTrigger>
          <TabsTrigger value="education">Pendidikan</TabsTrigger>
          <TabsTrigger value="career">Karier</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="kompensasi">Kompensasi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Informasi Pribadi & Kepegawaian</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground" /><span>{employee.email || "-"}</span></div>
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground" /><span>{employee.phone || "-"}</span></div>
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Join: {employee.join_date || "-"}</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{employee.address || "-"}</span></div>
                <div>NPWP: {employee.npwp || "-"}</div>
                <div>Role Aplikasi: {String((employee as any).app_role || "-")}</div>
                <div>PTKP: {String((employee as any).ptkp_status || tax.ptkp_status || "-")}</div>
                <div>BPJS TK: {employee.bpjs_tk_number || "-"}</div>
                <div>BPJS Kesehatan: {employee.bpjs_kes_number || "-"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Riwayat Keluarga</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {familyHistory.length === 0 ? (
                <p className="text-muted-foreground">Belum ada data keluarga.</p>
              ) : (
                familyHistory.map((item, idx) => (
                  <div key={`family-${idx}`} className="rounded border border-border p-3">
                    <p className="text-foreground font-medium">{String(item.name || "-")} ({String(item.relation || "-")})</p>
                    <p className="text-muted-foreground text-sm">HP: {String(item.phone || "-")} • Lahir: {String(item.birth_date || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pendidikan Formal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {educationHistory.length === 0 ? (
                <p className="text-muted-foreground">Belum ada data pendidikan formal.</p>
              ) : (
                educationHistory.map((item, idx) => (
                  <div key={`edu-${idx}`} className="rounded border border-border p-3">
                    <p className="text-foreground font-medium">{String(item.level || "-")} — {String(item.institution || "-")}</p>
                    <p className="text-muted-foreground text-sm">{String(item.major || "-")} • {String(item.start_year || "-")} - {String(item.end_year || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border mt-4">
            <CardHeader><CardTitle>Pendidikan Informal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {informalEducationHistory.length === 0 ? (
                <p className="text-muted-foreground">Belum ada data pendidikan informal.</p>
              ) : (
                informalEducationHistory.map((item, idx) => (
                  <div key={`informal-${idx}`} className="rounded border border-border p-3">
                    <p className="text-foreground font-medium">{String(item.name || "-")} — {String(item.provider || "-")}</p>
                    <p className="text-muted-foreground text-sm">Tahun: {String(item.year || "-")} • Sertifikat: {String(item.certificate || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="career" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pengalaman Organisasi</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {organizationExperience.length === 0 ? (
                <p className="text-muted-foreground">Belum ada pengalaman organisasi.</p>
              ) : (
                organizationExperience.map((item, idx) => (
                  <div key={`org-${idx}`} className="rounded border border-border p-3">
                    <p className="text-foreground font-medium">{String(item.organization || "-")} — {String(item.role || "-")}</p>
                    <p className="text-muted-foreground text-sm">{String(item.start_year || "-")} - {String(item.end_year || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border mt-4">
            <CardHeader><CardTitle>Riwayat Pekerjaan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {workHistory.length === 0 ? (
                <p className="text-muted-foreground">Belum ada riwayat pekerjaan.</p>
              ) : (
                workHistory.map((item, idx) => (
                  <div key={`work-${idx}`} className="rounded border border-border p-3">
                    <p className="text-foreground font-medium">{String(item.company || "-")} — {String(item.position || "-")}</p>
                    <p className="text-muted-foreground text-sm">{String(item.start_date || "-")} - {String(item.end_date || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {portfolio.length === 0 ? (
                <p className="text-muted-foreground">Belum ada data portfolio.</p>
              ) : (
                portfolio.map((item, idx) => (
                  <div key={`portfolio-${idx}`} className="rounded border border-border p-3">
                    <p className="text-foreground font-medium">{String(item.title || "-")} ({String(item.year || "-")})</p>
                    <p className="text-muted-foreground text-sm">{String(item.role || "-")}</p>
                    <p className="text-muted-foreground text-sm">{String(item.url || "-")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kompensasi" className="mt-4 space-y-6">

          {/* === Section A: Gaji Pokok === */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Gaji Pokok
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {compLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />Memuat...
                </div>
              ) : currentSalary ? (
                <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(currentSalary.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Berlaku: {currentSalary.effective_date}
                      {currentSalary.reason && ` · ${reasonLabel(currentSalary.reason)}`}
                      {currentSalary.reason === "other" && currentSalary.reason_other && `: ${currentSalary.reason_other}`}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Override Manual</Badge>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  Gaji diambil dari <strong>salary matrix</strong> berdasarkan grade karyawan.
                </div>
              )}

              {salaryHistory.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Riwayat Perubahan Gaji</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Tgl Efektif</th>
                          <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Jumlah</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Alasan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryHistory.map((s, i) => (
                          <tr key={s.id} className="border-b border-border/50">
                            <td className="py-2 pr-4 text-muted-foreground">{s.effective_date}</td>
                            <td className="py-2 pr-4 text-right font-medium text-foreground">{formatCurrency(s.amount)}</td>
                            <td className="py-2 text-muted-foreground text-xs">
                              {reasonLabel(s.reason)}
                              {s.reason === "other" && s.reason_other ? `: ${s.reason_other}` : ""}
                              {i === 0 && <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 text-xs">Aktif</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === Section B: Tunjangan === */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tunjangan</CardTitle>
            </CardHeader>
            <CardContent>
              {compAllowances.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada tunjangan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Komponen</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Sifat</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Jumlah</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Riwayat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compAllowances.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 pr-4 font-medium text-foreground">
                            {(a as any).salary_components?.name || "-"}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {(a as any).salary_components?.type === "earning" ? "Tunjangan" : "Potongan"}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <Badge className={(a as any).salary_components?.is_fixed === false ? "bg-yellow-500/20 text-yellow-400 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                              {(a as any).salary_components?.is_fixed === false ? "Tidak Tetap" : "Tetap"}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(a.amount)}</td>
                          <td className="py-2 text-right">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-400" onClick={() => openHistory(a.id, (a as any).salary_components?.name || "Tunjangan")}>
                              <History className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === Section C: Payroll Terakhir === */}
          {latestPayroll && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Payroll Terakhir — {(latestPayroll as any).payroll_periods?.name || "—"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Gaji Pokok", value: latestPayroll.basic_salary },
                  { label: "Total Tunjangan", value: latestPayroll.total_allowances },
                  { label: "Total Potongan", value: latestPayroll.total_deductions },
                  { label: "Gaji Bersih", value: latestPayroll.net_salary },
                ].map(({ label, value }) => (
                  <Card key={label}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="font-bold text-foreground text-sm">{formatCurrency(value || 0)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* === Section D: Riwayat Payroll === */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Riwayat Payroll</CardTitle></CardHeader>
            <CardContent>
              {payrollLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />Memuat...
                </div>
              ) : payrollHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada riwayat payroll.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Periode</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Gaji Pokok</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Gaji Bersih</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollHistory.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 pr-4 text-foreground">{(p as any).payroll_periods?.name || "—"}</td>
                          <td className="py-2 pr-4 text-right text-muted-foreground">{formatCurrency(p.basic_salary || 0)}</td>
                          <td className="py-2 pr-4 text-right font-medium text-foreground">{formatCurrency(p.net_salary || 0)}</td>
                          <td className="py-2 text-center">
                            <Badge className={p.status === "paid" ? "bg-emerald-500/20 text-emerald-400" : p.status === "approved" ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"}>
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === Modal: Riwayat Tunjangan (read-only) === */}
          <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Riwayat — {historyTitle}</DialogTitle>
              </DialogHeader>
              {historyLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />Memuat...
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Belum ada riwayat perubahan.</p>
              ) : (
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Tanggal</th>
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Tipe</th>
                        <th className="text-right py-2 pr-3 font-medium text-muted-foreground">Lama</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Baru</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyItems.map((h) => (
                        <tr key={h.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 text-muted-foreground">{new Date(h.created_at).toLocaleDateString("id-ID")}</td>
                          <td className="py-2 pr-3">
                            <Badge className={h.change_type === "create" ? "bg-emerald-500/20 text-emerald-400 text-xs" : h.change_type === "delete" ? "bg-red-500/20 text-red-400 text-xs" : "bg-blue-500/20 text-blue-400 text-xs"}>
                              {h.change_type === "create" ? "Tambah" : h.change_type === "delete" ? "Hapus" : "Ubah"}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right text-muted-foreground">{h.old_amount != null ? formatCurrency(h.old_amount) : "—"}</td>
                          <td className="py-2 text-right">{h.new_amount != null ? formatCurrency(h.new_amount) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </TabsContent>
      </Tabs>
    </div>
  )
}
