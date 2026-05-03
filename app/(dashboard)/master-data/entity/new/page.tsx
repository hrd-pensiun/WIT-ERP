"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useEntities } from "@/hooks/useEntities"
import Link from "next/link"
import { getTenantId } from "@/lib/tenant"
import { ensureSingleHeadquarters } from "@/lib/entity-headquarters"
import { copyEntityMasterFromSource } from "@/lib/entity-copy-master"
import { AutocompleteInput } from "@/components/master-data/autocomplete-input"
import { EntitySourcePicker } from "@/components/master-data/entity-source-picker"
import {
  INDONESIA_MAJOR_CITIES,
  INDONESIA_PROVINCES,
} from "@/lib/id-major-cities"

export default function NewEntityPage() {
  const router = useRouter()
  const { createEntity, loading, entities, fetchEntities } = useEntities()
  const [error, setError] = useState<string | null>(null)
  const [copyBusy, setCopyBusy] = useState(false)

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "branch",
    address: "",
    city: "",
    province: "",
    phone: "",
    email: "",
    npwp: "",
    latitude: "",
    longitude: "",
    radius_meters: "100",
    grace_period_minutes: "15",
    is_headquarters: false,
  })

  const [copyMasterEnabled, setCopyMasterEnabled] = useState(false)
  const [copySourceEntityId, setCopySourceEntityId] = useState("")

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  useEffect(() => {
    if (copySourceEntityId || entities.length === 0) return
    const hq = entities.find((e: { is_headquarters?: boolean }) => e.is_headquarters)
    if (hq) setCopySourceEntityId(hq.id)
  }, [entities, copySourceEntityId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (copyMasterEnabled && !copySourceEntityId) {
      setError("Pilih entity sumber untuk menyalin master data, atau matikan opsi salin.")
      return
    }

    const tenantId = getTenantId()
    const codeUpper = formData.code.trim().toUpperCase()

    try {
      const result = await createEntity({
        tenant_id: tenantId,
        code: codeUpper,
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address || null,
        city: formData.city || null,
        province: formData.province || null,
        phone: formData.phone || null,
        email: formData.email || null,
        npwp: formData.npwp || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radius_meters: parseInt(formData.radius_meters, 10) || 100,
        grace_period_minutes: parseInt(formData.grace_period_minutes, 10) || 15,
        status: "active",
        is_headquarters: formData.is_headquarters,
      })

      if (!result?.id) {
        router.push("/master-data/entity")
        return
      }

      if (formData.is_headquarters) {
        await ensureSingleHeadquarters(tenantId, result.id)
      }

      if (copyMasterEnabled && copySourceEntityId && copySourceEntityId !== result.id) {
        setCopyBusy(true)
        const copyResult = await copyEntityMasterFromSource(
          tenantId,
          copySourceEntityId,
          result.id,
          codeUpper
        )
        setCopyBusy(false)
        if (copyResult.errors.length > 0) {
          console.warn("Salin master (sebagian gagal):", copyResult.errors)
        }
      }

      router.push("/master-data/entity")
    } catch (err) {
      setCopyBusy(false)
      setError(err instanceof Error ? err.message : "Gagal membuat entity")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/master-data/entity">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tambah Entity</h1>
          <p className="text-slate-400 text-sm">Buat cabang atau unit bisnis baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              Informasi Entity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">
                  Kode <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., JKT01"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100 uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Nama Entity <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Kantor Pusat Jakarta"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-200">
                  Tipe <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="branch">Cabang (Branch)</SelectItem>
                    <SelectItem value="unit_business">Unit Bisnis</SelectItem>
                    <SelectItem value="subsidiary">Anak Perusahaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div>
                  <Label className="text-slate-200">Kantor pusat</Label>
                  <p className="text-xs text-slate-500">
                    Penanda referensi; hanya satu entity per tenant.
                  </p>
                </div>
                <Switch
                  checked={formData.is_headquarters}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, is_headquarters: Boolean(v) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="npwp" className="text-slate-200">
                  NPWP
                </Label>
                <Input
                  id="npwp"
                  value={formData.npwp}
                  onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                  placeholder="99.999.999.9-999.999"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-200">
                Alamat
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap..."
                rows={3}
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-slate-200">
                  Kota
                </Label>
                <AutocompleteInput
                  id="city"
                  datalistId="entity-new-city"
                  suggestions={INDONESIA_MAJOR_CITIES}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ketik atau pilih"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="text-slate-200">
                  Provinsi
                </Label>
                <AutocompleteInput
                  id="province"
                  datalistId="entity-new-province"
                  suggestions={INDONESIA_PROVINCES}
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Ketik atau pilih"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-200">
                  Telepon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="021-12345678"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kantor@company.com"
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>

            {/* Copy master dari entity lain */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h3 className="text-lg font-medium text-slate-100">Salin master data (copy-on-create)</h3>
              <p className="text-sm text-slate-500">
                Duplikasi shift kerja, komponen gaji (per entity), kalender kerja, dan job title dari entity sumber.
                Kode di baris baru diberi sufiks unik agar memenuhi constraint database.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Checkbox
                  id="copy-master"
                  checked={copyMasterEnabled}
                  onCheckedChange={(v) => setCopyMasterEnabled(Boolean(v))}
                />
                <Label htmlFor="copy-master" className="text-slate-200 cursor-pointer">
                  Aktifkan penyalinan setelah entity dibuat
                </Label>
              </div>
              {copyMasterEnabled && (
                <EntitySourcePicker
                  entities={entities.map((e: { id: string; code: string; name: string; is_headquarters?: boolean }) => ({
                    id: e.id,
                    code: e.code,
                    name: e.name,
                    is_headquarters: e.is_headquarters,
                  }))}
                  value={copySourceEntityId}
                  onValueChange={setCopySourceEntityId}
                  disabled={entities.length === 0}
                />
              )}
            </div>

            {/* GPS Settings */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-medium text-slate-100 mb-4">Pengaturan GPS (Presensi)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-slate-200">
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-6.2088"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-slate-200">
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="106.8456"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius" className="text-slate-200">
                    Radius (meter)
                  </Label>
                  <Input
                    id="radius"
                    type="number"
                    min="10"
                    max="500"
                    value={formData.radius_meters}
                    onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grace_period" className="text-slate-200">
                    Grace Period (menit)
                  </Label>
                  <Input
                    id="grace_period"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.grace_period_minutes}
                    onChange={(e) => setFormData({ ...formData, grace_period_minutes: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/master-data/entity">
                <Button type="button" variant="ghost" className="text-slate-400">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || copyBusy}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {copyBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyalin master…
                  </>
                ) : loading ? (
                  "Menyimpan..."
                ) : (
                  "Simpan Entity"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
