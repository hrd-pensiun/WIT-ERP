"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Layers, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDivisions } from "@/hooks/useDivisions"
import { useDepartments } from "@/hooks/useDepartments"
import { useEntities } from "@/hooks/useEntities"
import Link from "next/link"
import { getTenantId } from "@/lib/tenant"
import { getDefaultOrganizationEntityId } from "@/lib/organization-default-entity"

export default function NewDivisionPage() {
  const router = useRouter()
  const { createDivision, loading } = useDivisions()
  const [scopeEntityId] = useState<string | null>(() =>
    typeof window !== "undefined" ? getDefaultOrganizationEntityId() : null
  )

  const { departments } = useDepartments(getTenantId(), {
    entityId: scopeEntityId ?? undefined,
  })
  const { entities } = useEntities()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    department_id: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.department_id) {
      setError("Pilih departemen.")
      return
    }
    try {
      await createDivision({
        tenant_id: getTenantId(),
        code: formData.code.toUpperCase(),
        name: formData.name,
        department_id: formData.department_id,
        description: formData.description || null,
        status: "active",
      })
      router.push("/master-data/organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create division")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/organization">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tambah Divisi</h1>
          <p className="text-slate-400 text-sm">Buat divisi baru dalam departemen</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-500" /> Informasi Divisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-200">Kode <span className="text-red-400">*</span></Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., SW" required className="bg-slate-950 border-slate-800 text-slate-100 uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Nama <span className="text-red-400">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Software" required className="bg-slate-950 border-slate-800 text-slate-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Departemen <span className="text-red-400">*</span></Label>
              <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.department_id && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Instansi (mengikuti departemen)</p>
                  <p className="text-sm text-slate-200">
                    {(() => {
                      const dept = departments.find((x) => x.id === formData.department_id)
                      if (!dept?.entity_id) return "Global / tidak terikat entity"
                      const ent = entities.find((e) => e.id === dept.entity_id)
                      return ent ? `${ent.code} — ${ent.name}` : "—"
                    })()}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Deskripsi</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi divisi..." rows={3} className="bg-slate-950 border-slate-800 text-slate-100" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/master-data/organization"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
