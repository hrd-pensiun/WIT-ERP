"use client"

/**
 * Ringkasan kartu skor per tipe penilai + tabel rincian kategori + footer formula.
 * Dipakai di Matrix HR dan tab «Hasil terbaru» dashboard karyawan.
 */
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const SCORE_CARDS = [
  {
    label: "Self Assessment",
    value: "4.2",
    subtitle: "dari 5.0 (3 responses)",
    className: "from-emerald-600/90 to-cyan-600/80",
  },
  {
    label: "Manager / Atasan",
    value: "3.8",
    subtitle: "dari 5.0 (1 response)",
    className: "from-fuchsia-600/85 to-rose-600/75",
  },
  {
    label: "Rekan / Peer",
    value: "4.0",
    subtitle: "dari 5.0 (4 responses)",
    className: "from-sky-600/85 to-cyan-500/75",
  },
  {
    label: "Bawahan / Subordinate",
    value: "3.5",
    subtitle: "dari 5.0 (3 responses)",
    className: "from-green-600/85 to-emerald-500/75",
  },
] as const

type MatrixRow = {
  category: string
  self: number
  atasan: number
  rekan: number
  bawahan: number
  total: number
  avg: number
  avgTone?: "neutral" | "warn"
}

const MATRIX_ROWS: MatrixRow[] = [
  { category: "Kompetensi Teknis", self: 4.3, atasan: 4.1, rekan: 4.2, bawahan: 3.8, total: 16.4, avg: 4.1 },
  { category: "Kepemimpinan", self: 4.1, atasan: 3.9, rekan: 4.0, bawahan: 3.6, total: 15.6, avg: 3.9 },
  {
    category: "Komunikasi",
    self: 4.0,
    atasan: 3.5,
    rekan: 3.8,
    bawahan: 3.3,
    total: 14.6,
    avg: 3.7,
    avgTone: "warn",
  },
  { category: "Teamwork", self: 4.2, atasan: 4.0, rekan: 4.1, bawahan: 3.9, total: 16.2, avg: 4.0 },
]

const TOTAL_ROW = { self: 4.2, atasan: 3.9, rekan: 4.0, bawahan: 3.6, overall: 3.9 }

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-emerald-500/90 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function CellScore({ value }: { value: number }) {
  return (
    <div className="min-w-[100px]">
      <span className="text-sm font-medium text-slate-200">{value.toFixed(1)}</span>
      <ScoreBar value={value} />
    </div>
  )
}

export function Perf360ResultsScoreMatrix({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SCORE_CARDS.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-xl border border-white/10 bg-gradient-to-br p-4 text-white shadow-lg",
              c.className
            )}
          >
            <p className="text-sm opacity-90">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs opacity-80">{c.subtitle}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 font-medium text-slate-200">Rincian skor per kategori</h3>
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Kategori</TableHead>
                <TableHead className="text-slate-400">Self</TableHead>
                <TableHead className="text-slate-400">Atasan</TableHead>
                <TableHead className="text-slate-400">Rekan</TableHead>
                <TableHead className="text-slate-400">Bawahan</TableHead>
                <TableHead className="text-slate-400">Total skor</TableHead>
                <TableHead className="text-slate-400">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX_ROWS.map((row) => (
                <TableRow key={row.category} className="border-slate-800">
                  <TableCell className="font-medium text-slate-200">{row.category}</TableCell>
                  <TableCell>
                    <CellScore value={row.self} />
                  </TableCell>
                  <TableCell>
                    <CellScore value={row.atasan} />
                  </TableCell>
                  <TableCell>
                    <CellScore value={row.rekan} />
                  </TableCell>
                  <TableCell>
                    <CellScore value={row.bawahan} />
                  </TableCell>
                  <TableCell className="font-semibold text-slate-200">{row.total.toFixed(1)}</TableCell>
                  <TableCell
                    className={cn(
                      "font-semibold",
                      row.avgTone === "warn" ? "text-amber-400" : "text-emerald-400"
                    )}
                  >
                    {row.avg.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-slate-800 bg-slate-950/80 font-semibold">
                <TableCell className="text-slate-200">SKOR TOTAL</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.self.toFixed(1)}</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.atasan.toFixed(1)}</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.rekan.toFixed(1)}</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.bawahan.toFixed(1)}</TableCell>
                <TableCell className="text-slate-500">—</TableCell>
                <TableCell className="text-lg text-emerald-400">{TOTAL_ROW.overall.toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="border-l-4 border-l-cyan-500 border-slate-800 bg-slate-950/80">
        <CardContent className="space-y-2 pt-6 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Formula perhitungan</p>
          <p>Skor total = (Self × 20% + Atasan × 30% + Rekan × 25% + Bawahan × 25%)</p>
          <p className="text-xs text-slate-500">Bobot dapat disesuaikan di halaman Konfigurasi.</p>
        </CardContent>
      </Card>
    </div>
  )
}
