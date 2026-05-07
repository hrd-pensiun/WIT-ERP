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
import { loadPerf360RaterWeights } from "@/components/performance/360/assessment-weights-storage"

export type Perf360ResultsScoreCard = {
  label: string
  valueText: string
  subtitle: string
  className: string
}

export type Perf360ResultsMatrixRow = {
  category: string
  self: number | null
  atasan: number | null
  rekan: number | null
  bawahan: number | null
  total: number | null
  avg: number | null
  avgTone?: "neutral" | "warn"
}

export type Perf360ResultsTotalRow = {
  self: number | null
  atasan: number | null
  rekan: number | null
  bawahan: number | null
  overall: number | null
}

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

const MATRIX_ROWS: Perf360ResultsMatrixRow[] = [
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

const TOTAL_ROW: Perf360ResultsTotalRow = { self: 4.2, atasan: 3.9, rekan: 4.0, bawahan: 3.6, overall: 3.9 }

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-emerald-500/90 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function CellScore({ value }: { value: number }) {
  return (
    <div className="min-w-[100px]">
      <span className="text-sm font-medium text-foreground">{value.toFixed(1)}</span>
      <ScoreBar value={value} />
    </div>
  )
}

function fmtScore(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—"
  return v.toFixed(1)
}

function CellScoreMaybe({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return <CellScore value={value} />
}

export function Perf360ResultsScoreMatrix({
  className,
  data,
}: {
  className?: string
  data?: {
    cards: Perf360ResultsScoreCard[]
    rows: Perf360ResultsMatrixRow[]
    totalRow: Perf360ResultsTotalRow
  } | null
}) {
  const weights = loadPerf360RaterWeights()
  const cards = data?.cards ?? (SCORE_CARDS as unknown as Perf360ResultsScoreCard[])
  const rows = data?.rows ?? MATRIX_ROWS
  const totalRow = data?.totalRow ?? TOTAL_ROW
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-xl border border-white/10 bg-gradient-to-br p-4 text-white shadow-lg",
              c.className
            )}
          >
            <p className="text-sm opacity-90">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.valueText}</p>
            <p className="mt-1 text-xs opacity-80">{c.subtitle}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 font-medium text-foreground">Rincian skor per kategori</h3>
        <Card className="overflow-hidden ">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Kategori</TableHead>
                <TableHead className="text-muted-foreground">Self</TableHead>
                <TableHead className="text-muted-foreground">Atasan</TableHead>
                <TableHead className="text-muted-foreground">Rekan</TableHead>
                <TableHead className="text-muted-foreground">Bawahan</TableHead>
                <TableHead className="text-muted-foreground">Total skor</TableHead>
                <TableHead className="text-muted-foreground">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.category} className="border-border">
                  <TableCell className="font-medium text-foreground">{row.category}</TableCell>
                  <TableCell>
                    <CellScoreMaybe value={row.self} />
                  </TableCell>
                  <TableCell>
                    <CellScoreMaybe value={row.atasan} />
                  </TableCell>
                  <TableCell>
                    <CellScoreMaybe value={row.rekan} />
                  </TableCell>
                  <TableCell>
                    <CellScoreMaybe value={row.bawahan} />
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{fmtScore(row.total)}</TableCell>
                  <TableCell
                    className={cn(
                      "font-semibold",
                      row.avgTone === "warn" ? "text-amber-400" : "text-emerald-400"
                    )}
                  >
                    {fmtScore(row.avg)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-border bg-background/80 font-semibold">
                <TableCell className="text-foreground">SKOR TOTAL</TableCell>
                <TableCell className="text-emerald-400">{fmtScore(totalRow.self)}</TableCell>
                <TableCell className="text-emerald-400">{fmtScore(totalRow.atasan)}</TableCell>
                <TableCell className="text-emerald-400">{fmtScore(totalRow.rekan)}</TableCell>
                <TableCell className="text-emerald-400">{fmtScore(totalRow.bawahan)}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-lg text-emerald-400">{fmtScore(totalRow.overall)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="border-l-4 border-l-cyan-500 border-border bg-background/80">
        <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Formula perhitungan</p>
          <p>
            Skor total = (Self × {Math.round(weights.self)}% + Atasan × {Math.round(weights.manager)}% + Rekan ×{" "}
            {Math.round(weights.peer)}% + Bawahan × {Math.round(weights.subordinate)}%)
          </p>
          <p className="text-xs text-muted-foreground">Bobot dapat disesuaikan di halaman Konfigurasi.</p>
        </CardContent>
      </Card>
    </div>
  )
}
