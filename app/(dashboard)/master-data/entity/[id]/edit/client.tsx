"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useEntities } from "@/hooks/useEntities"
import { useEntityPayrollConfig } from "@/hooks/useEntityPayrollConfig"
import { getTenantId } from "@/lib/tenant"
import { ensureSingleHeadquarters } from "@/lib/entity-headquarters"
import { AutocompleteInput } from "@/components/master-data/autocomplete-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  INDONESIA_MAJOR_CITIES,
  INDONESIA_PROVINCES,
} from "@/lib/id-major-cities"

type EntityRow = {
  id: string
  code: string
  name: string
  type: string
  address?: string | null
  city?: string | null
  province?: string | null
  phone?: string | null
  email?: string | null
  npwp?: string | null
  bpjs_tk_number?: string | null
  bpjs_kes_number?: string | null
  latitude?: number | null
  longitude?: number | null
  radius_meters?: number | null
  grace_period_minutes?: number | null
  status?: string | null
  is_headquarters?: boolean | null
}

export default function EntityEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { getEntity, update, fetchEntities } = useEntities()
  const { getLatestConfig, upsertConfig } = useEntityPayrollConfig()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

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
    bpjs_tk_number: "",
    bpjs_kes_number: "",
    latitude: "",
    longitude: "",
    radius_meters: "100",
    grace_period_minutes: "15",
    status: "active",
    is_headquarters: false,
  })
  const [payrollForm, setPayrollForm] = useState({
    effective_date: new Date().toISOString().split("T")[0],
    city: "",
    province: "",
    umr_amount: "0",
    bpjs_tk_employee_rate: "2",
    bpjs_tk_company_rate: "3.7",
    bpjs_tk_salary_cap: "",
    bpjs_health_employee_rate: "1",
    bpjs_health_company_rate: "4",
    bpjs_health_salary_cap: "",
    pph21_method: "ter",
    pph21_rate: "5",
    npwp_required: false,
    notes: "",
    status: "active",
  })

  const hydrateFromRow = useCallback((entity: EntityRow) => {
    setFormData({
      code: entity.code || "",
      name: entity.name || "",
      type: entity.type || "branch",
      address: entity.address || "",
      city: entity.city || "",
      province: entity.province || "",
      phone: entity.phone || "",
      email: entity.email || "",
      npwp: entity.npwp || "",
      bpjs_tk_number: entity.bpjs_tk_number || "",
      bpjs_kes_number: entity.bpjs_kes_number || "",
      latitude:
        entity.latitude != null && !Number.isNaN(Number(entity.latitude))
          ? String(entity.latitude)
          : "",
      longitude:
        entity.longitude != null && !Number.isNaN(Number(entity.longitude))
          ? String(entity.longitude)
          : "",
      radius_meters: String(entity.radius_meters ?? 100),
      grace_period_minutes: String(entity.grace_period_minutes ?? 15),
      status: entity.status || "active",
      is_headquarters: Boolean(entity.is_headquarters),
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    setLoaded(false)
    getEntity(id)
      .then(async (row) => {
        if (cancelled || !row) return
        hydrateFromRow(row as EntityRow)
        const cfg = await getLatestConfig(id)
        if (cfg) {
          setPayrollForm({
            effective_date: cfg.effective_date || new Date().toISOString().split("T")[0],
            city: cfg.city || "",
            province: cfg.province || "",
            umr_amount: String(cfg.umr_amount ?? 0),
            bpjs_tk_employee_rate: String(cfg.bpjs_tk_employee_rate ?? 2),
            bpjs_tk_company_rate: String(cfg.bpjs_tk_company_rate ?? 3.7),
            bpjs_tk_salary_cap:
              cfg.bpjs_tk_salary_cap != null ? String(cfg.bpjs_tk_salary_cap) : "",
            bpjs_health_employee_rate: String(cfg.bpjs_health_employee_rate ?? 1),
            bpjs_health_company_rate: String(cfg.bpjs_health_company_rate ?? 4),
            bpjs_health_salary_cap:
              cfg.bpjs_health_salary_cap != null
                ? String(cfg.bpjs_health_salary_cap)
                : "",
            pph21_method: cfg.pph21_method || "ter",
            pph21_rate: String(cfg.pph21_rate ?? 5),
            npwp_required: Boolean(cfg.npwp_required),
            notes: cfg.notes || "",
            status: cfg.status || "active",
          })
        }
        setLoaded(true)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Gagal memuat entity"
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, getEntity, hydrateFromRow, getLatestConfig])

  const buildPayload = () => {
    return {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      type: formData.type,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      province: formData.province.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      npwp: formData.npwp.trim() || null,
      bpjs_tk_number: formData.bpjs_tk_number.trim() || null,
      bpjs_kes_number: formData.bpjs_kes_number.trim() || null,
      latitude: formData.latitude
        ? parseFloat(formData.latitude)
        : null,
      longitude: formData.longitude
        ? parseFloat(formData.longitude)
        : null,
      radius_meters: parseInt(formData.radius_meters, 10) || 100,
      grace_period_minutes: parseInt(formData.grace_period_minutes, 10) || 15,
      status: formData.status,
      is_headquarters: formData.is_headquarters,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = buildPayload()
      await update(id, payload)
      if (payload.is_headquarters) {
        await ensureSingleHeadquarters(getTenantId(), id)
      }
      await upsertConfig(id, {
        effective_date: payrollForm.effective_date,
        city: payrollForm.city || null,
        province: payrollForm.province || null,
        umr_amount: parseFloat(payrollForm.umr_amount) || 0,
        bpjs_tk_employee_rate: parseFloat(payrollForm.bpjs_tk_employee_rate) || 0,
        bpjs_tk_company_rate: parseFloat(payrollForm.bpjs_tk_company_rate) || 0,
        bpjs_tk_salary_cap: payrollForm.bpjs_tk_salary_cap
          ? parseFloat(payrollForm.bpjs_tk_salary_cap)
          : null,
        bpjs_health_employee_rate:
          parseFloat(payrollForm.bpjs_health_employee_rate) || 0,
        bpjs_health_company_rate:
          parseFloat(payrollForm.bpjs_health_company_rate) || 0,
        bpjs_health_salary_cap: payrollForm.bpjs_health_salary_cap
          ? parseFloat(payrollForm.bpjs_health_salary_cap)
          : null,
        pph21_method: payrollForm.pph21_method as
          | "gross"
          | "gross_up"
          | "net"
          | "ter"
          | "flat",
        pph21_rate: parseFloat(payrollForm.pph21_rate) || 0,
        npwp_required: payrollForm.npwp_required,
        notes: payrollForm.notes || null,
        status: payrollForm.status as "active" | "inactive",
      })
      await fetchEntities()
      router.push("/master-data/entity")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan entity")
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/master-data/entity">
          <Button variant="ghost" size="sm" className="text-slate-400">
            ← Kembali
          </Button>
        </Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          {loadError}
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/entity">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Edit Entity</h1>
          <p className="text-xs text-slate-500">
            EDIT-ENTITY : {formData.name || formData.code || "-"}
          </p>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Building2 className="h-5 w-5 text-emerald-500" />
              Pengaturan Entity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="general" className="data-[state=active]:bg-emerald-600">
                  Informasi Umum
                </TabsTrigger>
                <TabsTrigger value="payroll" className="data-[state=active]:bg-emerald-600">
                  Payroll, BPJS, Pajak
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-4 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
              <div className="space-y-1">
                <Label className="text-slate-200">Kantor pusat</Label>
                <p className="text-xs text-slate-500">
                  Tandai sebagai referensi default & sumber salin master data. Hanya
                  satu entity per tenant yang berstatus kantor pusat.
                </p>
              </div>
              <Switch
                checked={formData.is_headquarters}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, is_headquarters: Boolean(v) })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">
                  Kode <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  className="border-slate-800 bg-slate-950 uppercase text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">
                  Nama <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">
                  Tipe <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900">
                    <SelectItem value="branch">Cabang (Branch)</SelectItem>
                    <SelectItem value="unit_business">Unit Bisnis</SelectItem>
                    <SelectItem value="subsidiary">Anak Perusahaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900">
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">NPWP</Label>
                <Input
                  value={formData.npwp}
                  onChange={(e) =>
                    setFormData({ ...formData, npwp: e.target.value })
                  }
                  className="border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Telepon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Alamat</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                className="border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Kota</Label>
                <AutocompleteInput
                  datalistId={`edit-city-${id}`}
                  suggestions={INDONESIA_MAJOR_CITIES}
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Ketik atau pilih"
                  className="border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Provinsi</Label>
                <AutocompleteInput
                  datalistId={`edit-prov-${id}`}
                  suggestions={INDONESIA_PROVINCES}
                  value={formData.province}
                  onChange={(e) =>
                    setFormData({ ...formData, province: e.target.value })
                  }
                  placeholder="Ketik atau pilih"
                  className="border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="mb-4 text-lg font-medium text-slate-100">
                GPS / presensi
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Latitude</Label>
                  <Input
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="border-slate-800 bg-slate-950 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Longitude</Label>
                  <Input
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="border-slate-800 bg-slate-950 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Radius (m)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    value={formData.radius_meters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        radius_meters: e.target.value,
                      })
                    }
                    className="border-slate-800 bg-slate-950 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Grace period (menit)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={formData.grace_period_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        grace_period_minutes: e.target.value,
                      })
                    }
                    className="border-slate-800 bg-slate-950 text-slate-100"
                  />
                </div>
              </div>
            </div>

              </TabsContent>

              <TabsContent value="payroll" className="mt-4 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Tanggal berlaku</Label>
                    <Input
                      type="date"
                      value={payrollForm.effective_date}
                      onChange={(e) =>
                        setPayrollForm({ ...payrollForm, effective_date: e.target.value })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">UMR</Label>
                    <Input
                      type="number"
                      value={payrollForm.umr_amount}
                      onChange={(e) =>
                        setPayrollForm({ ...payrollForm, umr_amount: e.target.value })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Metode PPh21</Label>
                    <Select
                      value={payrollForm.pph21_method}
                      onValueChange={(value) =>
                        setPayrollForm({ ...payrollForm, pph21_method: value })
                      }
                    >
                      <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-900">
                        <SelectItem value="ter">TER</SelectItem>
                        <SelectItem value="flat">Flat %</SelectItem>
                        <SelectItem value="gross">Gross</SelectItem>
                        <SelectItem value="gross_up">Gross Up</SelectItem>
                        <SelectItem value="net">Net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-200">BPJS TK karyawan (%)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={payrollForm.bpjs_tk_employee_rate}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          bpjs_tk_employee_rate: e.target.value,
                        })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">BPJS TK perusahaan (%)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={payrollForm.bpjs_tk_company_rate}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          bpjs_tk_company_rate: e.target.value,
                        })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Batas gaji BPJS TK (opsional)</Label>
                    <Input
                      type="number"
                      value={payrollForm.bpjs_tk_salary_cap}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          bpjs_tk_salary_cap: e.target.value,
                        })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-200">BPJS Kes karyawan (%)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={payrollForm.bpjs_health_employee_rate}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          bpjs_health_employee_rate: e.target.value,
                        })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">BPJS Kes perusahaan (%)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={payrollForm.bpjs_health_company_rate}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          bpjs_health_company_rate: e.target.value,
                        })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Batas gaji BPJS Kes (opsional)</Label>
                    <Input
                      type="number"
                      value={payrollForm.bpjs_health_salary_cap}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          bpjs_health_salary_cap: e.target.value,
                        })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Rate PPh21 (%)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={payrollForm.pph21_rate}
                      onChange={(e) =>
                        setPayrollForm({ ...payrollForm, pph21_rate: e.target.value })
                      }
                      className="border-slate-800 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Status config</Label>
                    <Select
                      value={payrollForm.status}
                      onValueChange={(value) =>
                        setPayrollForm({ ...payrollForm, status: value })
                      }
                    >
                      <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-900">
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={payrollForm.npwp_required}
                        onCheckedChange={(v) =>
                          setPayrollForm({
                            ...payrollForm,
                            npwp_required: Boolean(v),
                          })
                        }
                      />
                      <Label className="text-slate-200">NPWP wajib untuk hitung pajak</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Catatan konfigurasi</Label>
                  <Textarea
                    value={payrollForm.notes}
                    onChange={(e) =>
                      setPayrollForm({ ...payrollForm, notes: e.target.value })
                    }
                    rows={3}
                    className="border-slate-800 bg-slate-950 text-slate-100"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-6">
              <Link href="/master-data/entity">
                <Button type="button" variant="ghost" className="text-slate-400">
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
