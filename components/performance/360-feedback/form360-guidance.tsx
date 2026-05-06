"use client"

import { Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  PERF360_CONFIDENTIAL_LINE,
  PERF360_IMPORTANT_NOTE_EN,
  PERF360_INSTRUCTION_ITEMS,
  PERF360_SCALE_LEGEND_1_5,
  PERF360_SECTION_INTRO_ID,
} from "@/lib/perf360-form-reference"

type Props = {
  scaleMax: number
  assessedName: string
  raterRoleLabel: string
  /** Baris pengenal penilai (mis. nama — peran dari roster), opsional */
  raterContextLine?: string | null
  templateName: string
}

export function Perf360FormGuidance({
  scaleMax,
  assessedName,
  raterRoleLabel,
  raterContextLine,
  templateName,
}: Props) {
  const formattedDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-200/90">
        <Shield className="size-3.5 shrink-0 text-amber-400" aria-hidden />
        <span>{PERF360_CONFIDENTIAL_LINE}</span>
      </div>

      <Card className="border-slate-800 bg-slate-950/50">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base text-slate-100">Ringkasan form</CardTitle>
          <CardDescription className="text-slate-500">
            {templateName} — Anda mengisi sebagai <span className="text-slate-400">{raterRoleLabel}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 border-t border-slate-800/80 pb-4 pt-3 text-sm text-slate-400">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-slate-500">Yang dinilai</span>
            <span className="font-medium text-slate-200">{assessedName}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-slate-500">Konteks penilai</span>
            <span className="text-right text-slate-300">{raterContextLine?.trim() || "—"}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-slate-500">Tanggal pengisian</span>
            <span className="text-slate-300">{formattedDate}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-slate-500">Skala rating</span>
            <span className="text-slate-300">1 sampai {scaleMax}</span>
          </div>
        </CardContent>
      </Card>

      <Accordion
        type="multiple"
        defaultValue={["instructions", "scale"]}
        className="rounded-xl border border-slate-800 bg-slate-950/40 px-3"
      >
        <AccordionItem value="instructions">
          <AccordionTrigger className="text-sm">Petunjuk pengisian</AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-400">
              {PERF360_INSTRUCTION_ITEMS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            <p className="mt-3 border-t border-slate-800/80 pt-3 text-xs text-slate-500">{PERF360_SECTION_INTRO_ID}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scale">
          <AccordionTrigger className="text-sm">Arti skala rating</AccordionTrigger>
          <AccordionContent>
            {scaleMax === 5 ? (
              <ul className="space-y-4 text-sm">
                {PERF360_SCALE_LEGEND_1_5.map((row) => (
                  <li key={row.score} className="border-l-2 border-emerald-500/40 pl-3">
                    <p className="font-medium text-slate-200">
                      {row.score} — {row.labelId}{" "}
                      <span className="text-xs font-normal text-slate-500">({row.labelEn})</span>
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-500">
                      {row.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                Template ini menggunakan skala 1–{scaleMax}. Nilai terendah mengarah pada kinerja di bawah ekspektasi;
                nilai tertinggi pada kinerja yang sangat baik atau melebihi ekspektasi. Sesuaikan penilaian dengan
                pengalaman kerja langsung Anda dengan orang yang dinilai.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="important">
          <AccordionTrigger className="text-sm">Catatan penting (English)</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm leading-relaxed text-slate-400">{PERF360_IMPORTANT_NOTE_EN}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
