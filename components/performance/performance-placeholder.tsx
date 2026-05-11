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
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground shrink-0">
          <Link href="/performance/360/template" aria-label="Kembali ke template penilaian">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          {docRef ? (
            <p className="text-xs text-muted-foreground mt-2">Rujukan: {docRef}</p>
          ) : null}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">Placeholder</CardTitle>
          <CardDescription>
            Halaman siap diisi form, tabel, dan integrasi data sesuai `docs/360.md`.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
