"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Building2,
  Calendar,
  ClipboardList,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Settings2,
  Shield,
  Target,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  coercePerf360ReasonMode,
  perf360ReasonModeLabel,
  type Perf360ReasonMode,
} from "@/lib/performance-360-reason-mode"

/** Pertanyaan contoh untuk tab Form — struktur seperti baris DB template (rating + reason_mode). */
const DEMO_RATINGS_TAB_QUESTIONS: {
  id: string
  section: string
  text: string
  reason_mode: Perf360ReasonMode
}[] = [
  {
    id: "demo-noreason",
    section: "Bagian demo: perilaku sama seperti dari template aktif",
    text: "Menunjukkan keahlian teknis yang kuat dalam pekerjaan",
    reason_mode: "none",
  },
  {
    id: "demo-optional",
    section: "Bagian demo: perilaku sama seperti dari template aktif",
    text: "Mengikuti perkembangan industri / praktik terbaik",
    reason_mode: "optional",
  },
  {
    id: "demo-required",
    section: "Bagian demo: perilaku sama seperti dari template aktif",
    text: "Berbagi pengetahuan dan membimbing rekan kerja",
    reason_mode: "required",
  },
]

function demoInitialAnswers(): Record<string, { rating: number | null; reason: string }> {
  const init: Record<string, { rating: number | null; reason: string }> = {}
  for (const q of DEMO_RATINGS_TAB_QUESTIONS) {
    init[q.id] = { rating: null, reason: "" }
  }
  return init
}

function demoRowComplete(
  q: (typeof DEMO_RATINGS_TAB_QUESTIONS)[number],
  a: { rating: number | null; reason: string }
): boolean {
  if (a.rating == null) return false
  const mode = coercePerf360ReasonMode(q.reason_mode)
  if (mode === "required" && !a.reason.trim()) return false
  return true
}

/** Static demo data — UI shell only; replace with API/InsForge later. */
const MOCK_ACTIVE_CYCLES = [
  { id: "1", name: "Q2 2024 Review", progress: 45, label: "Complete" },
  { id: "2", name: "Q3 2024 Review", progress: 12, label: "Complete" },
  { id: "3", name: "Annual 2024", progress: 0, label: "Not Started" },
]

const MOCK_MY_STATUS = [
  {
    assessment: "Q2 Marketing",
    role: "Manager",
    status: "done" as const,
    deadline: "2024-06-30",
  },
  {
    assessment: "Q2 IT",
    role: "Peer",
    status: "pending" as const,
    deadline: "2024-06-25",
  },
  {
    assessment: "Q3 Finance",
    role: "Direct",
    status: "not_started" as const,
    deadline: "2024-09-30",
  },
]

const MOCK_DISTRIBUTION = [
  { label: "Self", score: 4.2, pct: 84 },
  { label: "Manager", score: 3.8, pct: 76 },
  { label: "Peers (4)", score: 4.0, pct: 80 },
  { label: "Direct (3)", score: 3.2, pct: 64 },
  { label: "Average", score: 3.8, pct: 76, highlight: true },
]

const MOCK_CATEGORIES = [
  { name: "Leadership", score: "4.1", trend: "↑ +0.3" },
  { name: "Technical", score: "4.3", trend: "→ 0.0" },
  { name: "Communication", score: "3.5", trend: "↓ -0.2" },
  { name: "Teamwork", score: "3.9", trend: "↑ +0.5" },
]

const MOCK_TEMPLATES = [
  { name: "Annual Review", status: "live" as const, questions: 45 },
  { name: "Mid-Year", status: "draft" as const, questions: 32 },
  { name: "New Manager", status: "live" as const, questions: 28 },
]

const MOCK_ADMIN_CYCLES = [
  { name: "Q2 2024", progress: 78, deadline: "2024-06-30", state: "active" as const },
  { name: "Q3 2024", progress: 0, deadline: "2024-09-30", state: "planned" as const },
]

function StatusBadge({ status }: { status: "done" | "pending" | "not_started" }) {
  if (status === "done")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Selesai</Badge>
    )
  if (status === "pending")
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Menunggu</Badge>
    )
  return <Badge variant="secondary">Belum dimulai</Badge>
}

function RatingRow({
  value,
  onChange,
}: {
  value: number | null
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "h-10 w-10 rounded-full border text-sm font-medium transition-colors",
            value === n
              ? "border-emerald-500 bg-emerald-600 text-white"
              : "border-slate-700 bg-slate-950 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function ThreeSixtyFeedbackMockup() {
  const [answers, setAnswers] = useState(demoInitialAnswers)
  const [formError, setFormError] = useState<string | null>(null)

  const demoTotal = DEMO_RATINGS_TAB_QUESTIONS.length
  const demoDone = DEMO_RATINGS_TAB_QUESTIONS.filter((q) => demoRowComplete(q, answers[q.id])).length
  const formProgressPct = demoTotal ? (demoDone / demoTotal) * 100 : 0

  const setRating = (id: string, rating: number) => {
    setFormError(null)
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], rating } }))
  }
  const setReason = (id: string, reason: string) => {
    setFormError(null)
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], reason } }))
  }

  const validateDemoSubmit = (): string | null => {
    for (const q of DEMO_RATINGS_TAB_QUESTIONS) {
      const a = answers[q.id]
      if (a.rating == null) {
        return `Pilih rating untuk: "${q.text.slice(0, 48)}${q.text.length > 48 ? "…" : ""}"`
      }
      if (coercePerf360ReasonMode(q.reason_mode) === "required" && !a.reason.trim()) {
        return `Alasan wajib diisi untuk: "${q.text.slice(0, 40)}…"`
      }
    }
    return null
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-slate-100 shrink-0 mt-0.5">
            <Link href="/performance/360/template" aria-label="Kembali ke template penilaian">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">360 Assessment</p>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <MessageCircle className="w-7 h-7 text-emerald-500" />
              360 Feedback
            </h1>
            <p className="text-slate-400 mt-1 text-sm max-w-xl">
              Pratinjau UI: tab Form menggunakan contoh struktur dari template — kolom &quot;alasan&quot;
              mengikuti <span className="text-slate-400">reason_mode</span> (tanpa / opsional / wajib), sama seperti
              produksi nanti setelah backend siklus dihubungkan.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" type="button">
            <Users className="w-4 h-4 mr-1.5" />
            Profil
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" type="button">
            <Settings2 className="w-4 h-4 mr-1.5" />
            Pengaturan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="gap-4">
        <TabsList
          variant="line"
          className="w-full flex-wrap justify-start gap-0 bg-transparent border-b border-slate-800 rounded-none p-0 h-auto"
        >
          <TabsTrigger
            value="dashboard"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            <LayoutDashboard className="w-4 h-4 mr-1.5 opacity-70" />
            Ringkasan
          </TabsTrigger>
          <TabsTrigger
            value="form"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            <ClipboardList className="w-4 h-4 mr-1.5 opacity-70" />
            Form penilaian
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            <BarChart3 className="w-4 h-4 mr-1.5 opacity-70" />
            Analitik
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            <Shield className="w-4 h-4 mr-1.5 opacity-70" />
            Kelola
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 mt-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Siklus aktif
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_ACTIVE_CYCLES.map((c) => (
                <Card key={c.id} className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base">{c.name}</CardTitle>
                    <CardDescription className="text-slate-500">{c.label}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-bold text-emerald-400">{c.progress}%</p>
                    <Progress value={c.progress} className="h-2 bg-slate-800 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Status penilaian saya</h2>
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Assessment</TableHead>
                    <TableHead className="text-slate-400">Peran</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MY_STATUS.map((row) => (
                    <TableRow key={row.assessment} className="border-slate-800">
                      <TableCell className="text-slate-200 font-medium">{row.assessment}</TableCell>
                      <TableCell className="text-slate-400">{row.role}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right text-slate-500">{row.deadline}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-700" type="button">
              <Plus className="w-4 h-4 mr-2" />
              Siklus baru
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-200" type="button">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Lihat laporan
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-200" type="button">
              <Building2 className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          <Card className="bg-slate-900/50 border-slate-800 border-dashed">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base">Buat siklus (pratinjau)</CardTitle>
              <CardDescription>Form statis — tidak menyimpan data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Nama siklus</Label>
                <Input
                  placeholder="Contoh: Q4 2026 Review"
                  className="bg-slate-950 border-slate-800"
                  readOnly
                  defaultValue="Q4 2026 Review"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Template</Label>
                <Select disabled defaultValue="annual">
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="annual">Annual Review</SelectItem>
                    <SelectItem value="mid">Mid-Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Catatan</Label>
                <Textarea
                  readOnly
                  className="bg-slate-950 border-slate-800 min-h-[80px]"
                  defaultValue="Demo field — hubungkan ke create cycle API nanti."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Penilaian: John Smith</h2>
              <p className="text-sm text-slate-500">Anda memberi feedback sebagai responden (mock).</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">Progres isian</span>
              <span className="font-semibold text-emerald-400">{Math.round(formProgressPct)}%</span>
            </div>
          </div>
          <Progress
            value={formProgressPct}
            className="h-2 max-w-md bg-slate-800 [&>[data-slot=progress-indicator]]:bg-cyan-500"
          />

          {formError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {formError}
            </p>
          ) : null}

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">Form penilaian (contoh struktur DB)</CardTitle>
              <CardDescription className="text-slate-500">
                Setiap baris memakai <span className="text-slate-400">reason_mode</span> dari template. Zona teks untuk
                alasan hanya tampil bila Opsional atau Wajib; jika Wajib, formulir tolak sampai terisi (coba tombol kirim).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
              {(() => {
                let lastSection = ""
                return DEMO_RATINGS_TAB_QUESTIONS.map((q, idx) => {
                  const mode = coercePerf360ReasonMode(q.reason_mode)
                  const showSection = q.section !== lastSection
                  lastSection = q.section
                  const a = answers[q.id]
                  return (
                    <div key={q.id} className="space-y-3">
                      {showSection ? (
                        <h3 className="border-b border-slate-800 pb-2 text-sm font-semibold tracking-tight text-cyan-400/95">
                          {q.section}
                        </h3>
                      ) : null}
                      <div className="space-y-3 pl-0 sm:pl-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono text-xs text-slate-500">{idx + 1}.</span>
                          <Label className="text-slate-200">{q.text}</Label>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>
                            Kebijakan alasan template:{" "}
                            <span className="text-slate-400">{perf360ReasonModeLabel(mode)}</span>
                          </span>
                          {mode !== "none" ? (
                            <span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-slate-500">
                              reason_mode=<span className="text-cyan-500/90">{mode}</span>
                            </span>
                          ) : null}
                        </div>
                        <RatingRow value={a.rating} onChange={(n) => setRating(q.id, n)} />
                        <p className="text-xs text-slate-500">Skala demo 1–5 (nilai aktif mengikuti template)</p>
                        {mode !== "none" ? (
                          <div className="space-y-2 pt-1">
                            <Label className="text-slate-200">
                              Alasan / komentar
                              {mode === "required" ? (
                                <span className="text-red-400"> *</span>
                              ) : (
                                <span className="font-normal text-slate-500"> (opsional)</span>
                              )}
                            </Label>
                            <Textarea
                              value={a.reason}
                              onChange={(e) => setReason(q.id, e.target.value)}
                              placeholder={
                                mode === "required"
                                  ? "Wajib diisi untuk mengirim penilaian…"
                                  : "Anda bisa menambahkan context…"
                              }
                              rows={3}
                              className={cn(
                                "border-slate-800 bg-slate-950 text-slate-100",
                                mode === "required" && !a.reason.trim() && "border-amber-500/40"
                              )}
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 italic">Template: tanpa kolom alasan tambahan.</p>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" className="text-slate-400">
              Kembali
            </Button>
            <Button variant="outline" type="button" className="border-slate-700">
              Simpan progres
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              type="button"
              onClick={() => {
                const err = validateDemoSubmit()
                if (err) {
                  setFormError(err)
                  return
                }
                setFormError(null)
                alert("Demo: semua jawaban lolos validasi — di produksi akan disimpan ke database.")
              }}
            >
              Kirim penilaian
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 mt-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Hasil assessment: Q2 2024
              <span className="text-slate-500 font-normal text-base ml-2">— John Smith</span>
            </h2>
          </div>

          <section>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
              Distribusi skor per perspektif
            </h3>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-4">
                {MOCK_DISTRIBUTION.map((row) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-sm w-28 shrink-0",
                        row.highlight ? "text-emerald-400 font-semibold" : "text-slate-400"
                      )}
                    >
                      {row.label}
                    </span>
                    <div className="flex-1 h-7 rounded bg-slate-800 overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded transition-all",
                          row.highlight ? "bg-gradient-to-r from-emerald-600 to-cyan-600" : "bg-emerald-600/80"
                        )}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-emerald-400 w-14 text-right">{row.score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Skor per kategori</h3>
            <Card className="bg-slate-900 border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Kategori</TableHead>
                    <TableHead className="text-slate-400">Skor</TableHead>
                    <TableHead className="text-slate-400">Tren</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CATEGORIES.map((c) => (
                    <TableRow key={c.name} className="border-slate-800">
                      <TableCell className="text-slate-200">{c.name}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">{c.score} ★</TableCell>
                      <TableCell className="text-slate-500">{c.trend}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>

          <Card className="bg-slate-950/80 border-slate-800 border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                AI insights (placeholder)
              </CardTitle>
              <CardDescription>Teks contoh — integrasi model AI opsional di fase berikutnya.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                <li>Kekuatan utama: Technical Skills (4.3/5.0)</li>
                <li>Area pengembangan: Communication (3.5/5.0)</li>
                <li>Selisih persepsi: self 4.2 vs bawahan 3.2 — peluang peningkatan komunikasi ke tim</li>
                <li>Rekomendasi: perkuat one-on-one dan forum komunikasi rutin</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-slate-700" type="button">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" className="border-slate-700" type="button">
              <Users className="w-4 h-4 mr-2" />
              Bandingkan rekan
            </Button>
            <Button variant="outline" className="border-slate-700" type="button">
              <Target className="w-4 h-4 mr-2" />
              Tujuan development
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-8 mt-6">
          <div className="flex items-center gap-2 text-amber-400/90 text-sm">
            <Shield className="w-4 h-4" />
            Konsol admin (UI demo — aksi tidak memanggil API)
          </div>

          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Template</h3>
            <Card className="bg-slate-900 border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Nama</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Jumlah pertanyaan</TableHead>
                    <TableHead className="text-slate-400 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_TEMPLATES.map((t) => (
                    <TableRow key={t.name} className="border-slate-800">
                      <TableCell className="text-slate-200 font-medium">{t.name}</TableCell>
                      <TableCell>
                        {t.status === "live" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400">Live</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">{t.questions}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-cyan-400 h-8">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" type="button">
              <Plus className="w-4 h-4 mr-2" />
              Template baru
            </Button>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              Siklus assessment
            </h3>
            <Card className="bg-slate-900 border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Siklus</TableHead>
                    <TableHead className="text-slate-400">Progres</TableHead>
                    <TableHead className="text-slate-400">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ADMIN_CYCLES.map((c) => (
                    <TableRow key={c.name} className="border-slate-800">
                      <TableCell className="text-slate-200">{c.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <Progress
                            value={c.progress}
                            className="h-2 flex-1 bg-slate-800 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                          />
                          <span className="text-xs text-slate-500 w-8">{c.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {c.deadline}{" "}
                        {c.state === "active" ? (
                          <Badge variant="outline" className="ml-2 border-emerald-500/40 text-emerald-400">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 border-slate-600 text-slate-400">
                            Direncanakan
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Button variant="outline" className="mt-4 border-slate-700" type="button">
              <Plus className="w-4 h-4 mr-2" />
              Siklus baru
            </Button>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Pengguna & undangan</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-slate-700" type="button">
                Unggah massal
              </Button>
              <Button variant="outline" className="border-slate-700" type="button">
                Set penilai
              </Button>
              <Button variant="outline" className="border-slate-700" type="button">
                Kirim pengingat
              </Button>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
