"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePositions } from "@/hooks/usePositions"
import { useEntities } from "@/hooks/useEntities"
import { useJobGrades } from "@/hooks/useJobGrades"
import Link from "next/link"
import { getTenantId } from "@/lib/tenant"
import { getDefaultOrganizationEntityId } from "@/lib/organization-default-entity"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewPositionPage() {
  const router = useRouter()
  const { createPosition, loading } = usePositions()
  const { entities, loading: entitiesLoading } = useEntities()
  const { jobGrades, loading: gradesLoading } = useJobGrades()

  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    job_grade_id: "",
    description: "",
    entity_id:
      typeof window !== "undefined"
        ? (getDefaultOrganizationEntityId() ?? "")
        : "",
  })

  useEffect(() => {
    if (formData.job_grade_id || jobGrades.length === 0) return
    const defaultGrade = [...jobGrades].sort(
      (a, b) => Number(a.level) - Number(b.level)
    )[0]
    if (defaultGrade?.id) {
      setFormData((prev) => ({ ...prev, job_grade_id: String(defaultGrade.id) }))
    }
  }, [formData.job_grade_id, jobGrades])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createPosition({
        tenant_id: getTenantId(),
        entity_id: formData.entity_id || null,
        code: formData.code.toUpperCase(),
        name: formData.name,
        job_grade_id: formData.job_grade_id || null,
        description: formData.description || null,
        status: "active",
      })
      router.push("/master-data/organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create position")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/organization"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Tambah Jabatan</h1><p className="text-muted-foreground text-sm">Buat jabatan/posisi baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-500" /> Informasi Jabatan</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Kode <span className="text-red-400">*</span></Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., DEV" required className="bg-background border-border text-foreground uppercase" /></div>
              <div className="space-y-2"><Label>Nama <span className="text-red-400">*</span></Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Developer" required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Job Grade <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.job_grade_id}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      job_grade_id: v,
                    })
                  }
                  disabled={gradesLoading}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Pilih grade (otomatis menentukan level)" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Pilih instansi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tidak spesifik</SelectItem>
                    {entities.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>
                        {ent.code} — {ent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default diisi dari instansi aktif di halaman Struktur Organisasi (SuperAdmin).
                </p>
              </div>
            </div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi jabatan..." rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/master-data/organization"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={loading || !formData.job_grade_id} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
