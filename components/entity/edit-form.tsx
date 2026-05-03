"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Building2, Loader2, Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useEntities } from "@/hooks/useEntities"

export default function EditEntityPage() {
  const params = useParams()
  const router = useRouter()
  const { entities, loading: entitiesLoading, getEntity, updateEntity } = useEntities()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    city: "",
    address: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    status: "",
  })

  useEffect(() => {
    const id = params.id as string
    if (!id) {
      setLoading(false)
      return
    }

    // Try to get entity from already loaded entities first
    const existing = entities.find((e: any) => e.id === id)
    if (existing) {
      setFormData({
        code: existing.code || "",
        name: existing.name || "",
        type: existing.type || "",
        city: existing.city || "",
        address: existing.address || "",
        contact_person: existing.contact_person || "",
        contact_phone: existing.contact_phone || "",
        contact_email: existing.contact_email || "",
        status: existing.status || "",
      })
      setLoading(false)
      return
    }

    // Otherwise fetch from API
    getEntity(id)
      .then((entity: any) => {
        if (entity) {
          setFormData({
            code: entity.code || "",
            name: entity.name || "",
            type: entity.type || "",
            city: entity.city || "",
            address: entity.address || "",
            contact_person: entity.contact_person || "",
            contact_phone: entity.contact_phone || "",
            contact_email: entity.contact_email || "",
            status: entity.status || "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id, entities, getEntity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateEntity(params.id as string, formData)
      router.push("/master-data/entity")
    } catch {
      // error handled by hook
    } finally {
      setSaving(false)
    }
  }

  if (loading || entitiesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/entity">
          <Button variant="ghost" size="icon" className="text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Edit Entity</h1>
          <p className="text-slate-400">Update entity information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Entity Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="unit_business">Unit Business</SelectItem>
                    <SelectItem value="subsidiary">Subsidiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">City</Label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-slate-800 border-slate-700" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="bg-slate-800 border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Contact Person</Label>
                <Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="bg-slate-800 border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Contact Phone</Label>
                <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="bg-slate-800 border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Contact Email</Label>
                <Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="bg-slate-800 border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/master-data/entity">
                <Button type="button" variant="ghost" className="text-slate-400">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
