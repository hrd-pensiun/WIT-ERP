"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft, Settings2, Loader2, Save, Edit2, X,
  TrendingDown, Lock, Info, CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useAttendanceFineConfig, AttendanceFineConfig, LateMethod } from "@/hooks/useAttendanceFineConfig"
import { usePositionFineEligibility, FineType } from "@/hooks/usePositionFineEligibility"
import { useEntities } from "@/hooks/useEntities"
import { usePositions } from "@/hooks/usePositions"
import Link from "next/link"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined): string {
  if (!n && n !== 0) return ""
  return new Intl.NumberFormat("id-ID").format(n)
}
function parseIDR(s: string): number {
  return Number(s.replace(/\D/g, "")) || 0
}

// ─── Method cards ─────────────────────────────────────────────────────────────
interface MethodCardProps {
  id: LateMethod
  selected: boolean
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  tag?: string
}
function MethodCard({ id, selected, disabled, onClick, icon, title, subtitle, tag }: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex-1 text-left rounded-xl border-2 p-5 transition-all duration-200
        ${selected
          ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
          : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
        }
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
    >
      {selected && (
        <CheckCircle2 className="absolute top-3.5 right-3.5 w-4 h-4 text-emerald-500" />
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors
        ${selected ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-semibold text-sm ${selected ? "text-foreground" : "text-foreground/80"}`}>
          {title}
        </span>
        {tag && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
            {tag}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
    </button>
  )
}

// ─── Config form ──────────────────────────────────────────────────────────────
interface FormState {
  late_method: LateMethod
  proportional_custom: boolean    // false = auto PP 35/2021, true = custom rate
  late_fine_per_hour: string      // custom hourly rate for proportional
  late_fixed_amount: string       // flat amount for fixed method
  late_min_minutes: string
  late_max_amount: string
  no_checkin_amount: string
  no_checkout_amount: string
  is_active: boolean
}

function buildForm(cfg?: AttendanceFineConfig): FormState {
  if (!cfg) {
    return {
      late_method: "proportional",
      proportional_custom: false,
      late_fine_per_hour: "",
      late_fixed_amount: "",
      late_min_minutes: "15",
      late_max_amount: "",
      no_checkin_amount: "",
      no_checkout_amount: "",
      is_active: true,
    }
  }
  return {
    late_method: cfg.late_method ?? "proportional",
    proportional_custom: (cfg.late_fine_per_hour ?? 0) > 0,
    late_fine_per_hour: fmt(cfg.late_fine_per_hour) || "",
    late_fixed_amount: fmt(cfg.late_fixed_amount) || "",
    late_min_minutes: String(cfg.late_min_minutes ?? 15),
    late_max_amount: cfg.late_max_amount ? fmt(cfg.late_max_amount) : "",
    no_checkin_amount: fmt(cfg.no_checkin_amount) || "",
    no_checkout_amount: fmt(cfg.no_checkout_amount) || "",
    is_active: cfg.is_active ?? true,
  }
}

// ─── Labeled input with Rp prefix ─────────────────────────────────────────────
function IDRInput({
  label, hint, value, onChange, onBlur, disabled, placeholder = "0"
}: {
  label: string; hint?: string; value: string
  onChange: (v: string) => void; onBlur?: (v: string) => void
  disabled?: boolean; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">Rp</span>
        <Input
          className="pl-9"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── Position fine matrix (auto-save on click) ────────────────────────────────
const FINE_COLS: { key: FineType; label: string; sub: string }[] = [
  { key: "late",       label: "Terlambat",    sub: "Denda keterlambatan" },
  { key: "no_checkin", label: "Tdk Check-in", sub: "Tidak absen masuk"   },
  { key: "no_checkout",label: "Tdk Check-out",sub: "Tidak absen pulang"  },
]

function PositionMatrix() {
  const { positions, loading: posLoading } = usePositions()
  const { loading: eligLoading, isSubject, toggleOne } = usePositionFineEligibility()
  // Track which cells are currently saving: key = `${posId}_${fineType}`
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const handleToggle = async (posId: string, fineType: FineType, next: boolean) => {
    const key = `${posId}_${fineType}`
    setSaving((p) => ({ ...p, [key]: true }))
    try {
      await toggleOne(posId, fineType, next)
      // Flash "saved" indicator for 1.5s
      setSaved((p) => ({ ...p, [key]: true }))
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 1500)
    } finally {
      setSaving((p) => ({ ...p, [key]: false }))
    }
  }

  const isLoading = posLoading || eligLoading

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground">Jabatan yang Dikenai Denda</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Centang untuk mengikuti aturan denda di atas — perubahan tersimpan otomatis
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Default: semua dikenai
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Memuat...</span>
          </div>
        ) : positions.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">Belum ada data jabatan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 text-sm font-semibold text-foreground">
                    Jabatan
                  </th>
                  {FINE_COLS.map((col) => (
                    <th key={col.key} className="py-2.5 px-4 text-center min-w-[120px]">
                      <div className="text-sm font-semibold text-foreground">{col.label}</div>
                      <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{col.sub}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, i) => (
                  <tr
                    key={pos.id}
                    className={`border-b border-border/40 transition-colors hover:bg-muted/20
                      ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    {/* Jabatan name */}
                    <td className="py-3 px-3">
                      <p className="text-sm font-medium text-foreground">{pos.name}</p>
                      {pos.code && (
                        <p className="text-xs text-muted-foreground">{pos.code}</p>
                      )}
                    </td>

                    {/* Checkbox per fine type */}
                    {FINE_COLS.map((col) => {
                      const key = `${pos.id}_${col.key}`
                      const checked = isSubject(pos.id, col.key)
                      const isSaving = saving[key]
                      const justSaved = saved[key]
                      return (
                        <td key={col.key} className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                              <div className="relative">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => handleToggle(pos.id, col.key, Boolean(v))}
                                  className={`
                                    transition-all
                                    ${checked
                                      ? "border-emerald-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                      : ""}
                                    ${justSaved ? "scale-110" : "scale-100"}
                                  `}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AttendanceSettingsPage() {
  const { entities, loading: entLoading } = useEntities()
  const { configs, loading, error, fetchConfigs, upsertConfig, getConfigForEntity } =
    useAttendanceFineConfig()

  const [entityId, setEntityId] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(buildForm())
  const [snapshot, setSnapshot] = useState<FormState>(buildForm())

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  // Load config when entity changes
  useEffect(() => {
    if (!entityId) return
    const cfg = getConfigForEntity(entityId)
    const f = buildForm(cfg)
    setForm(f)
    setSnapshot(f)
    setIsEditing(false)
    setSaveError(null)
  }, [entityId, configs]) // eslint-disable-line

  const patch = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val })), [])

  const handleEdit = () => {
    setSnapshot({ ...form })
    setIsEditing(true)
    setSaveError(null)
  }

  const handleCancel = () => {
    setForm({ ...snapshot })
    setIsEditing(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!entityId) return
    setSaving(true)
    setSaveError(null)
    try {
      await upsertConfig({
        entity_id: entityId,
        late_method: form.late_method,
        late_fine_per_hour: form.proportional_custom ? parseIDR(form.late_fine_per_hour) : 0,
        late_fixed_amount: parseIDR(form.late_fixed_amount),
        late_min_minutes: Number(form.late_min_minutes) || 0,
        late_max_amount: form.late_max_amount ? parseIDR(form.late_max_amount) : null,
        no_checkin_amount: parseIDR(form.no_checkin_amount),
        no_checkout_amount: parseIDR(form.no_checkout_amount),
        description: null,
        is_active: form.is_active,
      })
      setIsEditing(false)
    } catch (err: any) {
      setSaveError(err.message ?? "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const currentCfg = entityId ? getConfigForEntity(entityId) : undefined
  const hasConfig = !!currentCfg

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/hr/attendance">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan Denda</h1>
          <p className="text-muted-foreground text-sm">Atur aturan denda keterlambatan per entitas</p>
        </div>
      </div>

      {/* ── Entity picker ── */}
      <div className="flex items-end gap-4">
        <div className="flex-1 max-w-sm space-y-1.5">
          <Label className="text-sm font-medium">Entitas</Label>
          <Select value={entityId || undefined} onValueChange={setEntityId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={entLoading ? "Memuat..." : "Pilih entitas..."} />
            </SelectTrigger>
            <SelectContent>
              {entities.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {entityId && hasConfig && (
          <Badge className={form.is_active
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-muted text-muted-foreground"}>
            {form.is_active ? "Aktif" : "Non-aktif"}
          </Badge>
        )}
      </div>

      {/* ── Config card (shown after entity selected) ── */}
      {entityId ? (
        <>
        <Card className="border-border">
          <CardContent className="p-6 space-y-8">

            {/* Error */}
            {saveError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {saveError}
              </div>
            )}

            {/* ── Section 1: Metode ── */}
            <section className="space-y-3">
              <div>
                <h2 className="font-semibold text-foreground">Metode Perhitungan Keterlambatan</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pilih bagaimana denda dihitung saat karyawan terlambat
                </p>
              </div>

              <div className="flex gap-3">
                <MethodCard
                  id="proportional"
                  selected={form.late_method === "proportional"}
                  disabled={!isEditing}
                  onClick={() => patch("late_method", "proportional")}
                  icon={<TrendingDown className="w-5 h-5" />}
                  title="Proporsional"
                  tag="Rekomendasi"
                  subtitle="Denda dihitung berdasarkan upah per jam karyawan. Makin lama terlambat, makin besar dendanya."
                />
                <MethodCard
                  id="fixed"
                  selected={form.late_method === "fixed"}
                  disabled={!isEditing}
                  onClick={() => patch("late_method", "fixed")}
                  icon={<Lock className="w-5 h-5" />}
                  title="Tetap (Fixed)"
                  subtitle="Nominal denda sama berapapun lama terlambatnya — sederhana dan mudah dikomunikasikan ke karyawan."
                />
              </div>
            </section>

            {/* ── Section 2: Detail metode ── */}
            <section className="space-y-4">
              <div className="h-px bg-border" />

              {form.late_method === "proportional" && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-foreground">Tarif Upah per Jam</h2>

                  {/* Auto / Custom toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                    <div>
                      <p className="text-sm font-medium text-foreground">Ikuti aturan ketenagakerjaan</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PP 35/2021 — Upah per Jam = Gaji Bulanan ÷ 173
                      </p>
                    </div>
                    <Switch
                      checked={!form.proportional_custom}
                      onCheckedChange={(v) => isEditing && patch("proportional_custom", !v)}
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Custom rate input — shown when not auto */}
                  {form.proportional_custom && (
                    <IDRInput
                      label="Tarif Custom (Rp per Jam)"
                      hint="Akan digunakan sebagai pengganti formula PP 35/2021"
                      value={form.late_fine_per_hour}
                      onChange={(v) => patch("late_fine_per_hour", v)}
                      onBlur={(v) => patch("late_fine_per_hour", fmt(parseIDR(v)) || "")}
                      disabled={!isEditing}
                      placeholder="Masukkan tarif per jam..."
                    />
                  )}

                  {/* Formula info box */}
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      {!form.proportional_custom ? (
                        <>
                          <p className="font-medium text-foreground/80">Formula: (Gaji ÷ 173) × (Menit Terlambat ÷ 60)</p>
                          <p>Contoh: Gaji Rp5.000.000 → Rp28.902/jam. Terlambat 30 menit → denda ≈ Rp14.451</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-foreground/80">Formula: Tarif Custom × (Menit Terlambat ÷ 60)</p>
                          <p>Berlaku sama untuk semua karyawan terlepas dari besaran gajinya</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {form.late_method === "fixed" && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-foreground">Nominal Denda Terlambat</h2>
                  <IDRInput
                    label="Denda per Kejadian"
                    hint="Dipotong flat setiap kali terlambat, berapapun durasinya"
                    value={form.late_fixed_amount}
                    onChange={(v) => patch("late_fixed_amount", v)}
                    onBlur={(v) => patch("late_fixed_amount", fmt(parseIDR(v)) || "")}
                    disabled={!isEditing}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Toleransi & Cap — berlaku semua metode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Toleransi Keterlambatan</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      value={form.late_min_minutes}
                      onChange={(e) => patch("late_min_minutes", e.target.value)}
                      disabled={!isEditing}
                      className="pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                      menit
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Di bawah ini tidak dikenai denda</p>
                </div>
                <IDRInput
                  label="Maksimum Denda per Hari"
                  hint="Cap harian — kosongkan untuk tanpa batas"
                  value={form.late_max_amount}
                  onChange={(v) => patch("late_max_amount", v)}
                  onBlur={(v) => patch("late_max_amount", v ? fmt(parseIDR(v)) : "")}
                  disabled={!isEditing}
                  placeholder="Tanpa batas"
                />
              </div>
            </section>

            {/* ── Section 3: Tidak Absen ── */}
            <section className="space-y-4">
              <div className="h-px bg-border" />
              <div>
                <h2 className="font-semibold text-foreground">Tidak Melakukan Absen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nominal flat per kejadian — berlaku terlepas dari metode keterlambatan
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <IDRInput
                  label="Tidak Check-in"
                  hint="Per hari tidak melakukan check-in"
                  value={form.no_checkin_amount}
                  onChange={(v) => patch("no_checkin_amount", v)}
                  onBlur={(v) => patch("no_checkin_amount", fmt(parseIDR(v)) || "")}
                  disabled={!isEditing}
                  placeholder="0"
                />
                <IDRInput
                  label="Tidak Check-out"
                  hint="Per hari tidak melakukan check-out"
                  value={form.no_checkout_amount}
                  onChange={(v) => patch("no_checkout_amount", v)}
                  onBlur={(v) => patch("no_checkout_amount", fmt(parseIDR(v)) || "")}
                  disabled={!isEditing}
                  placeholder="0"
                />
              </div>
            </section>

            {/* ── Section 4: Status ── */}
            <section>
              <div className="h-px bg-border mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Aktifkan Aturan Denda</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nonaktifkan untuk menangguhkan denda sementara tanpa menghapus konfigurasi
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => isEditing && patch("is_active", v)}
                  disabled={!isEditing}
                />
              </div>
            </section>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={handleCancel} disabled={saving} className="text-muted-foreground">
                    <X className="w-4 h-4 mr-1.5" />Batal
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]">
                    {saving
                      ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Menyimpan...</>
                      : <><Save className="w-4 h-4 mr-1.5" />Simpan</>}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-1.5" />Edit Pengaturan
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ── Position matrix — always visible when entity selected ── */}
        <PositionMatrix />
        </>
      ) : (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Settings2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">Pilih Entitas</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Setiap entitas bisa memiliki metode perhitungan denda yang berbeda
          </p>
        </div>
      )}
    </div>
  )
}
