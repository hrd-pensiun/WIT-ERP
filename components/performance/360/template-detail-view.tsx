"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Eye, Layers, Loader2, Pencil } from "lucide-react"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatTemplatePeriodLabel,
  getPerformance360TemplateDetail,
  type Performance360TemplateDetail,
  type Performance360TemplateQuestionRow,
} from "@/hooks/usePerformance360Templates"
import { buildPerf360FormEstimates, fetchPerf360FormMatrixData, type Perf360FormEstimateRow } from "@/lib/performance-360-form-matrix"
import {
  coercePerf360ReasonMode,
  perf360ReasonAppliesToDbQuestionType,
  perf360ReasonModeLabel,
} from "@/lib/performance-360-reason-mode"
import { getTenantId } from "@/lib/tenant"
import { isMockMode } from "@/lib/insforge"

function statusBadge(status: "active" | "draft") {
  if (status === "active") {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/15 font-normal text-emerald-400">Aktif</Badge>
    )
  }
  return <Badge variant="secondary" className="bg-slate-800 font-normal text-slate-300">Draft</Badge>
}

function questionTypeLabel(dbType: string) {
  if (dbType === "rating") return "Rating (skala)"
  if (dbType === "text") return "Teks terbuka"
  if (dbType === "multiple_choice") return "Pilihan ganda"
  return dbType
}

/** Jalur bergantian section_title sama (termasuk null) ⇒ satu blok tampilan. */
function groupTemplateQuestionsBySection(rows: Performance360TemplateQuestionRow[]) {
  const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const groups: { label: string | null; rows: Performance360TemplateQuestionRow[] }[] = []
  for (const q of sorted) {
    const labelRaw = q.section_title?.trim() ?? ""
    const label = labelRaw.length ? labelRaw : null
    const prev = groups[groups.length - 1]
    if (prev && prev.label === label) prev.rows.push(q)
    else groups.push({ label, rows: [q] })
  }
  return groups
}

function inboundBreakdownText(r: Perf360FormEstimateRow): string {
  if (r.inbound_total === null) return ""
  return `${r.inbound_self ?? 0} nilai diri · ${r.inbound_manager ?? 0} atasan · ~${r.inbound_peer ?? 0} peer · ${r.inbound_subordinate ?? 0} bawahan`
}

function outboundBreakdownText(r: Perf360FormEstimateRow): string {
  const { outbound_as_self, outbound_as_manager, outbound_as_peer, outbound_as_subordinate } = r
  if (
    outbound_as_self +
      outbound_as_manager +
      outbound_as_peer +
      outbound_as_subordinate ===
    0
  ) {
    return "—"
  }
  const parts = [
    outbound_as_self ? `${outbound_as_self} diri` : null,
    outbound_as_manager ? `${outbound_as_manager} sebagai atasan` : null,
    outbound_as_peer ? `~${outbound_as_peer} sebagai peer` : null,
    outbound_as_subordinate ? `${outbound_as_subordinate} sebagai bawahan` : null,
  ].filter(Boolean)
  return parts.join(" · ")
}

export function Template360DetailView({ id }: { id: string }) {
  const tenantId = getTenantId()
  const [detail, setDetail] = useState<Performance360TemplateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [matrixRows, setMatrixRows] = useState<Perf360FormEstimateRow[]>([])
  const [matrixLoading, setMatrixLoading] = useState(true)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const row = await getPerformance360TemplateDetail(id)
        if (cancel) return
        setDetail(row)
        if (!row) setError("Template tidak ditemukan atau Anda tidak punya akses tenant ini.")
      } catch {
        if (!cancel) setError("Gagal memuat template.")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [id])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setMatrixLoading(true)
      setMatrixError(null)
      if (isMockMode()) {
        setMatrixRows([])
        setMatrixLoading(false)
        return
      }
      try {
        const pack = await fetchPerf360FormMatrixData(tenantId)
        if (cancel) return
        if (!pack) {
          setMatrixRows([])
          setMatrixError("Database tidak terhubung.")
          return
        }
        const rows = buildPerf360FormEstimates(pack.profiles, pack.settings)
        setMatrixRows(rows)
      } catch (e: unknown) {
        if (!cancel) {
          const msg = e instanceof Error ? e.message : "Gagal memuat estimasi penilaian."
          setMatrixError(msg)
          setMatrixRows([])
        }
      } finally {
        if (!cancel) setMatrixLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [tenantId])

  if (loading) {
    return (
      <Performance360Shell title="Preview template" subtitle="Memuat data…" backHref="/performance/360/template">
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        </div>
      </Performance360Shell>
    )
  }

  if (!detail || error) {
    return (
      <Performance360Shell title="Preview template" backHref="/performance/360/template">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="py-12 text-center text-slate-400">
            <p>{error ?? "Template tidak ditemukan."}</p>
            <Button asChild variant="outline" className="mt-4 border-slate-700">
              <Link href="/performance/360/template">Kembali ke daftar</Link>
            </Button>
          </CardContent>
        </Card>
      </Performance360Shell>
    )
  }

  const scale = detail.rating_scale_max
  const questions = detail.performance_360_template_questions ?? []
  const configuredRateeCount = matrixRows.filter((r) => r.configured_as_ratee).length

  return (
    <Performance360Shell
      title={detail.name}
      subtitle="Pratinjau template: ringkasan, pertanyaan, dan estimasi penilaian yang diterima vs dilakukan per karyawan (tenant saat ini)."
      backHref="/performance/360/template"
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-200" asChild>
            <Link href={`/performance/360/template/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit template
            </Link>
          </Button>
          <Badge variant="outline" className="h-9 shrink-0 border-slate-600 px-3 py-2 text-slate-300">
            Skala 1–{scale}
          </Badge>
          {statusBadge(detail.status)}
        </div>
      }
    >
      <Tabs defaultValue="summary" className="w-full gap-6">
        <TabsList variant="line" className="h-auto flex-wrap rounded-lg border border-slate-800 bg-slate-900/90 p-1">
          <TabsTrigger value="summary" className="data-active:border-slate-700">
            Rangkuman & pertanyaan
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2 data-active:border-slate-700">
            <Layers className="h-4 w-4" />
            Estimasi penilaian
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0 space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">Ringkasan penilaian</CardTitle>
              <CardDescription className="text-slate-500">
                Konten tetap template ini. Alur siklus & assignment konkret bisa berbeda per implementasi HR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-x-10 gap-y-2 border-t border-slate-800 pt-4">
                <div>
                  <p className="text-slate-500">Periode penilaian</p>
                  <p className="font-medium text-slate-200">{formatTemplatePeriodLabel(detail)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Terakhir diperbarui</p>
                  <p className="font-medium text-slate-200">
                    {detail.updated_at ? new Date(detail.updated_at).toLocaleString("id-ID") : "—"}
                  </p>
                </div>
              </div>
              {detail.description ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Deskripsi</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-300">{detail.description}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  Pratinjau pertanyaan
                </CardTitle>
                <CardDescription className="mt-1 text-slate-500">
                  {questions.length} pertanyaan dalam template — bisa dikelompok per bagian; urutan sama untuk setiap formulir dalam
                  siklus.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {questions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Tidak ada pertanyaan dalam template ini.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="w-10 text-slate-300">#</TableHead>
                      <TableHead className="text-slate-300">Pertanyaan</TableHead>
                      <TableHead className="text-slate-300">Kategori</TableHead>
                      <TableHead className="text-slate-300">Tipe input</TableHead>
                      <TableHead className="text-right text-slate-300">Bobot</TableHead>
                      <TableHead className="min-w-[120px] text-slate-300">Alasan</TableHead>
                      <TableHead className="text-slate-300">Cuplikan bagi penilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      let rowNum = 0
                      return groupTemplateQuestionsBySection(questions).flatMap((group, gIdx) => {
                        const header =
                          group.label != null ? (
                            <TableRow
                              key={`sec-${gIdx}`}
                              className="border-slate-800 bg-slate-950/90 hover:bg-slate-950/90"
                            >
                              <TableCell
                                colSpan={7}
                                className="py-2.5 text-sm font-semibold tracking-tight text-emerald-400/95"
                              >
                                {group.label}
                              </TableCell>
                            </TableRow>
                          ) : null
                        const body = group.rows.map((q) => {
                          rowNum += 1
                          const caption =
                            q.question_type === "rating"
                              ? `Pilih nilai 1 sampai ${scale}`
                              : q.question_type === "text"
                                ? "Area teks untuk jawaban"
                                : `Pilih salah satu jawaban`
                          const reasonCell = perf360ReasonAppliesToDbQuestionType(q.question_type)
                            ? perf360ReasonModeLabel(coercePerf360ReasonMode(q.reason_mode))
                            : "—"
                          return (
                            <TableRow key={q.id} className="border-slate-800">
                              <TableCell className="text-slate-500">{rowNum}</TableCell>
                              <TableCell className="max-w-[280px] font-medium text-slate-200">{q.question_text}</TableCell>
                              <TableCell className="text-slate-400">{q.category}</TableCell>
                              <TableCell className="text-slate-400">{questionTypeLabel(q.question_type)}</TableCell>
                              <TableCell className="text-right text-slate-300">{String(q.weight)}</TableCell>
                              <TableCell className="text-xs text-slate-400">{reasonCell}</TableCell>
                              <TableCell className="text-xs text-slate-500">{caption}</TableCell>
                            </TableRow>
                          )
                        })
                        return header ? [header, ...body] : body
                      })
                    })()}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-0">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">Estimasi penilaian 360</CardTitle>
              <CardDescription className="space-y-2 text-slate-500">
                <p>
                  <span className="font-medium text-slate-400">Penilaian yang Anda terima</span> — perkiraan berapa orang/posisi akan
                  memberi umpan balik tentang Anda sebagai yang dinilai (ratee).
                </p>
                <p>
                  <span className="font-medium text-slate-400">Penilaian yang Anda lakukan</span> — perkiraan berapa kali Anda mengisi
                  penilaian terhadap rekan/atasan/bawahan.
                </p>
                <p>
                  Peer memakai perkiraan rekan satu departemen (tanda&nbsp;~). Atasan mengikuti{" "}
                  <Link href="/performance/360/mapping-penilaian" className="text-cyan-400 hover:underline">
                    Mapping penilaian
                  </Link>{" "}
                  atau garis laporan <code className="text-slate-400">reports_to</code>.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMockMode() && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200/90">
                  Mode demo — tidak ada koneksi database; estimasi penilaian kosong.
                </p>
              )}
              {matrixError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{matrixError}</p>
              )}
              {!matrixLoading && !matrixError && !isMockMode() && configuredRateeCount === 0 && matrixRows.length > 0 ? (
                <p className="text-sm text-amber-200/85">
                  Belum ada karyawan yang ditandai sebagai yang dinilai di{" "}
                  <Link href="/performance/360/mapping-penilaian" className="underline">
                    Mapping penilaian
                  </Link>
                  . Tambahkan baris pengaturan agar kolom &quot;Yang Anda terima&quot; bisa dihitung.
                </p>
              ) : null}
              {matrixLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
              ) : matrixRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Tidak ada karyawan aktif untuk tenant ini.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent bg-slate-950/80">
                        <TableHead className="text-slate-300">Karyawan</TableHead>
                        <TableHead className="text-slate-300">Departemen</TableHead>
                        <TableHead className="max-w-[140px] text-right text-slate-300 align-bottom">
                          <span className="block text-xs leading-tight font-medium">Penilaian</span>
                          <span className="block text-[11px] font-normal leading-tight text-slate-500">Anda terima (est.)</span>
                        </TableHead>
                        <TableHead className="min-w-[200px] text-slate-300 align-bottom">Rincian terima</TableHead>
                        <TableHead className="max-w-[140px] text-right text-slate-300 align-bottom">
                          <span className="block text-xs leading-tight font-medium">Penilaian</span>
                          <span className="block text-[11px] font-normal leading-tight text-slate-500">Anda lakukan (est.)</span>
                        </TableHead>
                        <TableHead className="min-w-[220px] text-slate-300 align-bottom">Rincian lakukan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrixRows.map((r) => (
                        <TableRow key={r.profile_id} className="border-slate-800">
                          <TableCell className="font-medium text-slate-200">{r.full_name}</TableCell>
                          <TableCell className="text-slate-400">{r.department_label}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-200">
                            {r.inbound_total !== null ? r.inbound_total : "—"}
                          </TableCell>
                          <TableCell className="text-xs leading-relaxed text-slate-500">
                            {r.inbound_total !== null ? (
                              inboundBreakdownText(r)
                            ) : (
                              <span className="text-slate-600">Belum ada mapping — tidak bisa menghitung yang diterima</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-slate-200">{r.outbound_total}</TableCell>
                          <TableCell className="text-xs leading-relaxed text-slate-500">{outboundBreakdownText(r)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-slate-600">
                Angka bersifat estimasi untuk pratinjau (satu pool karyawan aktif di tenant); bisa berbeda pada siklus nyata dengan
                daftar nominasi peer khusus atau banyak periode paralel.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Performance360Shell>
  )
}
