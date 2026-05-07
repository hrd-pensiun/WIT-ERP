"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Briefcase, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePositions } from "@/hooks/usePositions"
import { useEntities } from "@/hooks/useEntities"
import { useJobGrades } from "@/hooks/useJobGrades"

export default function PositionEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { positions, update, loading: hookLoading } = usePositions()
  const { entities, loading: entitiesLoading } = useEntities()
  const { jobGrades, loading: gradesLoading } = useJobGrades()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    job_grade_id: "",
    entity_id: "",
  })
  const hydratedOnceRef = useRef(false)
  const legacyLevelRef = useRef<number | null>(null)

  useEffect(() => {
    if (hydratedOnceRef.current) return
    const pos = positions.find((p) => p.id === id)
    if (pos) {
      legacyLevelRef.current =
        pos.level != null && !Number.isNaN(Number(pos.level))
          ? Number(pos.level)
          : null
      setFormData({
        code: pos.code || "",
        name: pos.name || "",
        description: pos.description || "",
        job_grade_id: pos.job_grade_id ? String(pos.job_grade_id) : "",
        entity_id: pos.entity_id ? String(pos.entity_id) : "",
      })
      hydratedOnceRef.current = true
    }
  }, [positions, id])

  useEffect(() => {
    if (!hydratedOnceRef.current) return
    if (formData.job_grade_id || !jobGrades.length) return
    if (legacyLevelRef.current == null) return

    const inferredGrade = jobGrades.find(
      (g) => Number(g.level) === Number(legacyLevelRef.current)
    )
    if (!inferredGrade?.id) return

    setFormData((prev) => ({
      ...prev,
      job_grade_id: prev.job_grade_id || String(inferredGrade.id),
    }))
  }, [jobGrades, formData.job_grade_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await update(id, {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        job_grade_id: formData.job_grade_id || null,
        entity_id: formData.entity_id || null,
      })
      router.push("/master-data/organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui jabatan")
    } finally {
      setSaving(false)
    }
  }

  const pos = positions.find((p) => p.id === id)
  if (hookLoading && !pos) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/organization">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Job Title</h1>
          <p className="text-xs text-muted-foreground">
            EDIT-JOB TITLE : {formData.name || formData.code || "-"}
          </p>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              Informasi Jabatan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Kode <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  className="border-border bg-background uppercase text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Nama <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Grade <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.job_grade_id || "__none__"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      job_grade_id: v === "__none__" ? "" : v,
                    })
                  }
                  disabled={gradesLoading}
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue placeholder="Pilih grade (otomatis menentukan level)" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="__none__">-</SelectItem>
                    {jobGrades.map((grade) => (
                      <SelectItem key={grade.id} value={String(grade.id)}>
                        {grade.code} — {grade.name} (Level {grade.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instansi (entity)</Label>
                <Select
                  value={formData.entity_id || "__none__"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      entity_id: v === "__none__" ? "" : v,
                    })
                  }
                  disabled={entitiesLoading}
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue placeholder="Opsional — hubungkan ke instansi" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="__none__">Tidak spesifik</SelectItem>
                    {entities.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>
                        {ent.code} — {ent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="border-border bg-background text-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
              <Link href="/master-data/organization">
                <Button type="button" variant="ghost" className="text-muted-foreground">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving || !formData.job_grade_id}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
