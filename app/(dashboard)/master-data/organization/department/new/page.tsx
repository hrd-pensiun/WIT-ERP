"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDepartments } from "@/hooks/useDepartments"
import { useEntities } from "@/hooks/useEntities"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { getTenantId } from "@/lib/tenant"
import { getDefaultOrganizationEntityId } from "@/lib/organization-default-entity"

export default function NewDepartmentPage() {
  const router = useRouter()
  const { createDepartment, loading } = useDepartments()
  const { entities, loading: entitiesLoading } = useEntities()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    entity_id: "",
    cost_center: "",
  })

  useEffect(() => {
    if (entitiesLoading) return
    const stored = getDefaultOrganizationEntityId()
    if (
      stored &&
      entities.some((e) => String(e.id) === stored)
    ) {
      setFormData((prev) =>
        prev.entity_id === stored ? prev : { ...prev, entity_id: stored }
      )
      return
    }
    if (!formData.entity_id && entities.length > 0) {
      setFormData((prev) => ({ ...prev, entity_id: String(entities[0].id) }))
    }
  }, [entitiesLoading, entities, formData.entity_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (!formData.entity_id) {
        setError("Pilih entity untuk departemen ini")
        return
      }

      await createDepartment({
        tenant_id: getTenantId(),
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        entity_id: formData.entity_id || null,
        cost_center: formData.cost_center || null,
        status: "active",
      })

      router.push("/master-data/organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create department")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/organization">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tambah Departemen</h1>
          <p className="text-muted-foreground text-sm">Buat departemen baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              Informasi Departemen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Kode <span className="text-red-400">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., IT"
                  required
                  className="bg-background border-border text-foreground uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama <span className="text-red-400">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Information Technology"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_id">
                Entity <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.entity_id}
                onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
              >
                <SelectTrigger
                  disabled={entitiesLoading || entities.length === 0}
                  className="bg-background border-border text-foreground"
                >
                  <SelectValue placeholder={entitiesLoading ? "Memuat..." : "Pilih entity"} />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((ent) => (
                    <SelectItem key={ent.id} value={String(ent.id)}>
                      {ent.code} - {ent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi departemen..."
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_center">Cost Center</Label>
              <Input
                id="cost_center"
                value={formData.cost_center}
                onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                placeholder="e.g., CC-001"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/master-data/organization">
                <Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button>
              </Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
