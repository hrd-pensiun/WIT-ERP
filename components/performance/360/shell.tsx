import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Performance360Shell({
  title,
  subtitle,
  action,
  children,
  backHref = "/performance/360/template",
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  /** Set `null` untuk menyembunyikan tombol kembali (mis. halaman indeks). */
  backHref?: string | null
}) {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {backHref !== null ? (
            <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-slate-100 shrink-0 mt-0.5">
              <Link href={backHref} aria-label="Kembali">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
            {subtitle ? <p className="text-slate-400 mt-1 text-sm max-w-2xl">{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
      </div>
      {children}
    </div>
  )
}
