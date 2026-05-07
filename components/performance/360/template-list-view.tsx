"use client"

import { useState } from "react"
import Link from "next/link"
import { Copy, Eye, FileStack, LayoutTemplate, ListChecks, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  usePerformance360Templates,
} from "@/hooks/usePerformance360Templates"

function statusBadge(status: "active" | "draft") {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-normal">Aktif</Badge>
    )
  }
  return <Badge variant="secondary" className="bg-muted text-foreground font-normal">Draft</Badge>
}

export function Template360ListView() {
  const { templates, loading, error, deleteTemplate, duplicateTemplate } = usePerformance360Templates()
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const total = templates.length
  const aktif = templates.filter((t) => t.status === "active").length

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus template "${name}"? Pertanyaan ikut terhapus.`)) return
    try {
      await deleteTemplate(id)
    } catch {
      /* error ditampilkan dari hook state */
    }
  }

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id)
    try {
      await duplicateTemplate(id)
    } catch {
      /* error dari hook */
    } finally {
      setDuplicatingId(null)
    }
  }

  return (
    <Performance360Shell
      title="Template penilaian"
      subtitle="Kelola template 360° dan periode penilaian. Data per tenant (tenant_id otomatis dari environment)."
      backHref={null}
      action={
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/performance/360/template/new">
            <Plus className="w-4 h-4 mr-2" />
            Tambah template
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm font-medium flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-cyan-400" />
              Total template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">Terdaftar di tenant ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm font-medium flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-400" />
              Template aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{aktif}</p>
            <p className="text-xs text-muted-foreground mt-1">Dipakai untuk siklus penilaian</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm font-medium flex items-center gap-2">
              <FileStack className="w-4 h-4 text-amber-400" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{total - aktif}</p>
            <p className="text-xs text-muted-foreground mt-1">Belum dipublikasikan</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">Daftar template</CardTitle>
          <CardDescription className="text-muted-foreground">
            Nama template, periode penilaian, dan ringkasan konten.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Belum ada template. Tambahkan dari tombol &quot;Tambah template&quot;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">Nama template</TableHead>
                  <TableHead className="text-foreground">Periode penilaian</TableHead>
                  <TableHead className="text-foreground text-right">Pertanyaan</TableHead>
                  <TableHead className="text-foreground">Skala</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((row) => {
                  const n = row.performance_360_template_questions?.length ?? 0
                  const scale = `1–${row.rating_scale_max}`
                  return (
                    <TableRow key={row.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatTemplatePeriodLabel(row)}</TableCell>
                      <TableCell className="text-right text-foreground">{n}</TableCell>
                      <TableCell className="text-muted-foreground">{scale}</TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" asChild>
                            <Link href={`/performance/360/template/${row.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              Preview
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground" asChild>
                            <Link href={`/performance/360/template/${row.id}/edit`}>
                              <Pencil className="mr-1 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyan-400/90 hover:text-cyan-300"
                            type="button"
                            disabled={duplicatingId !== null}
                            title="Buat salinan template baru (draft)"
                            onClick={() => void handleDuplicate(row.id)}
                          >
                            {duplicatingId === row.id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="mr-1 h-4 w-4" />
                            )}
                            Duplikat
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            type="button"
                            onClick={() => void handleDelete(row.id, row.name)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Performance360Shell>
  )
}
