"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Layers, Loader2, Save } from "lucide-react"
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
import { useDivisions } from "@/hooks/useDivisions"
import { useDepartments } from "@/hooks/useDepartments"
import { useEntities } from "@/hooks/useEntities"
import { getTenantId } from "@/lib/tenant"
import { getDefaultOrganizationEntityId } from "@/lib/organization-default-entity"

export default function DivisionEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { divisions, update, loading: hookLoading } = useDivisions()
  const { entities } = useEntities()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    department_id: "",
  })

  const divRecord = divisions.find((d) => d.id === id)
  const entityScope = useMemo(() => {
    if (divRecord?.departments?.entity_id) {
      return String(divRecord.departments.entity_id)
    }
    return getDefaultOrganizationEntityId()
  }, [divRecord])

  const { departments } = useDepartments(getTenantId(), {
    entityId: entityScope ?? undefined,
  })

  useEffect(() => {
    const div = divisions.find((d) => d.id === id)
    if (div) {
      setFormData({
        code: div.code || "",
        name: div.name || "",
        description: div.description || "",
        department_id: div.department_id || "",
      })
    }
  }, [divisions, id])

  const selectedDept = departments.find((d) => d.id === formData.department_id)
  const entityLabel = selectedDept?.entity_id
    ? entities.find((e) => e.id === selectedDept.entity_id)
    : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.department_id) {
      setError("Pilih departemen.")
      return
    }
    setSaving(true)
    try {
      await update(id, {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        department_id: formData.department_id,
      })
      router.push("/master-data/organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui divisi")
    } finally {
      setSaving(false)
    }
  }

  const div = divisions.find((d) => d.id === id)
  if (hookLoading && !div) {
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
          <h1 className="text-2xl font-bold text-foreground">Edit Divisi</h1>
          <p className="text-xs text-muted-foreground">
            EDIT-DIVISION : {formData.name || formData.code || "-"}
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
              <Layers className="h-5 w-5 text-emerald-500" />
              Informasi Divisi
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
            </div>

            <div className="space-y-2">
              <Label>
                Departemen <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, department_id: value })
                }
              >
                <SelectTrigger className="border-border bg-background text-foreground">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Instansi mengikuti departemen yang dipilih.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Instansi (entity)
              </p>
              <p className="mt-1 text-sm text-foreground">
                {entityLabel
                  ? `${entityLabel.code} — ${entityLabel.name}`
                  : selectedDept && !selectedDept.entity_id
                    ? "Global / tidak terikat entity"
                    : "—"}
              </p>
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
                disabled={saving}
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
