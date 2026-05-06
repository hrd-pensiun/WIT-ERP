"use client"

import { useMemo } from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type BehavioralCompetencyDatum = {
  key: string
  subject: string
  score: number
}

const DEFAULT_BEHAVIORAL_ROW: BehavioralCompetencyDatum[] = [
  { key: "leadership", subject: "Kepemimpinan", score: 4.5 },
  { key: "communication", subject: "Komunikasi", score: 4.8 },
  { key: "collaboration", subject: "Kolaborasi", score: 4.2 },
  { key: "accountability", subject: "Akuntabilitas", score: 4.6 },
  { key: "problem_solving", subject: "Pemecahan masalah", score: 4.9 },
]

function qualitativeBand(score: number): { label: string; tone: "excellent" | "good" | "fair" | "develop" } {
  if (score >= 4.5) return { label: "Sangat baik", tone: "excellent" }
  if (score >= 4.0) return { label: "Baik", tone: "good" }
  if (score >= 3.5) return { label: "Cukup", tone: "fair" }
  return { label: "Perlu pengembangan", tone: "develop" }
}

const toneClass: Record<
  ReturnType<typeof qualitativeBand>["tone"],
  string
> = {
  excellent: "text-emerald-400",
  good: "text-sky-400",
  fair: "text-amber-400",
  develop: "text-orange-400",
}

export function Perf360BehavioralCompetencies({
  title = "Kompetensi perilaku (360°)",
  rows = DEFAULT_BEHAVIORAL_ROW,
  className,
}: {
  title?: string
  rows?: BehavioralCompetencyDatum[]
  className?: string
}) {
  const radarData = useMemo(
    () => rows.map((r) => ({ subject: r.subject, score: r.score, fullMark: 5 })),
    [rows]
  )

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-slate-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="h-[min(360px,50vh)] w-full min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tickCount={6}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
                formatter={(value) =>
                  `${typeof value === "number" ? value.toFixed(1) : String(value ?? "—")} (skala 5)`
                }
              />
              <Radar
                name="Skor"
                dataKey="score"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.38}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-col justify-center gap-4">
          {rows.map((row) => {
            const band = qualitativeBand(row.score)
            return (
              <li
                key={row.key}
                className="flex items-baseline justify-between gap-4 border-b border-slate-800 pb-4 last:border-0 last:pb-0"
              >
                <span className="text-sm font-medium text-slate-200">{row.subject}</span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="text-lg tabular-nums font-semibold text-slate-100">
                    {row.score.toFixed(1)}
                  </span>
                  <span className={cn("text-sm font-medium", toneClass[band.tone])}>
                    {band.label}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
