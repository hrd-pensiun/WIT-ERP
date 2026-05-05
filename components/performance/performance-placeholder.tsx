import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PerformancePlaceholderPage({
  title,
  description,
  docRef,
}: {
  title: string
  description: string
  docRef?: string
}) {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-slate-100 shrink-0">
          <Link href="/performance/360/template" aria-label="Kembali ke template penilaian">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="text-slate-400 mt-1 text-sm">{description}</p>
          {docRef ? (
            <p className="text-xs text-slate-500 mt-2">Rujukan: {docRef}</p>
          ) : null}
        </div>
      </div>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">Placeholder</CardTitle>
          <CardDescription>
            Halaman siap diisi form, tabel, dan integrasi data sesuai `docs/360.md`.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
