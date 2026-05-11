"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  Loader2, CalendarDays, Clock, X, CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkCalendar, WorkCalendarEntry } from "@/hooks/useWorkCalendar"
import { useWorkShifts, WorkShift } from "@/hooks/useWorkShifts"
import { useEntities } from "@/hooks/useEntities"
import { formatTime } from "@/lib/attendance-utils"

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

const HOLIDAY_TYPE_LABEL: Record<string, string> = {
  national: "Nasional",
  company: "Perusahaan",
  cuti_bersama: "Cuti Bersama",
}

const HOLIDAY_TYPE_COLOR: Record<string, string> = {
  national: "bg-red-500/15 text-red-600 border-red-500/30",
  company: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  cuti_bersama: "bg-purple-500/15 text-purple-600 border-purple-500/30",
}

const HOLIDAY_CELL_BG: Record<string, string> = {
  national: "bg-red-500/10 border-red-400/40",
  company: "bg-orange-500/10 border-orange-400/40",
  cuti_bersama: "bg-purple-500/10 border-purple-400/40",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

// ── Work Calendar Tab ─────────────────────────────────────────────────────────

function WorkCalendarTab() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [entityId, setEntityId] = useState<string>("__global__")
  const [dialogDay, setDialogDay] = useState<{ date: string; entry?: WorkCalendarEntry } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  // Dialog form state
  const [isHoliday, setIsHoliday] = useState(false)
  const [holidayName, setHolidayName] = useState("")
  const [holidayType, setHolidayType] = useState<"national" | "company" | "cuti_bersama">("national")

  const { entities } = useEntities()
  const { calendar, loading, fetchCalendar, upsertDay, deleteDay } = useWorkCalendar()

  useEffect(() => {
    fetchCalendar(year, month, entityId === "__global__" ? undefined : entityId)
  }, [year, month, entityId, fetchCalendar])

  const calendarMap = useMemo(() => {
    const m = new Map<string, WorkCalendarEntry>()
    calendar.forEach((e) => m.set(e.date, e))
    return m
  }, [calendar])

  // Grid: get days of month, with leading empty cells
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay() // 0=Sun
  // Convert to Mon-first: 0=Mon ... 6=Sun
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const daysInMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const openDialog = (day: number) => {
    const date = toDateStr(year, month, day)
    const entry = calendarMap.get(date)
    setDialogDay({ date, entry })
    setIsHoliday(entry?.is_holiday ?? false)
    setHolidayName(entry?.holiday_name ?? "")
    setHolidayType((entry?.holiday_type as any) ?? "national")
    setDialogError(null)
  }

  const handleSave = async () => {
    if (!dialogDay) return
    setSaving(true)
    setDialogError(null)
    try {
      await upsertDay({
        date: dialogDay.date,
        entity_id: entityId === "__global__" ? null : entityId,
        is_holiday: isHoliday,
        holiday_name: isHoliday ? holidayName || null : null,
        holiday_type: isHoliday ? holidayType : null,
      })
      setDialogDay(null)
    } catch (err: any) {
      setDialogError(err.message ?? "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!dialogDay?.entry) return
    setDeleting(true)
    try {
      await deleteDay(dialogDay.entry.id)
      setDialogDay(null)
    } catch (err: any) {
      setDialogError(err.message ?? "Gagal menghapus")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month navigation */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-muted rounded transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground px-2 min-w-[140px] text-center">
            {MONTHS_ID[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-muted rounded transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Entity filter */}
        <Select value={entityId} onValueChange={setEntityId}>
          <SelectTrigger className="h-9 w-48 text-sm">
            <SelectValue placeholder="Semua Entitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__global__">Global (semua entitas)</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>{e.code} — {e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Legend */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {Object.entries(HOLIDAY_TYPE_LABEL).map(([type, label]) => (
            <span key={type} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${HOLIDAY_TYPE_COLOR[type]}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Memuat kalender...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {DAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {d}
                </div>
              ))}

              {/* Leading empty cells */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const date = toDateStr(year, month, day)
                const entry = calendarMap.get(date)
                const dow = new Date(year, month - 1, day).getDay() // 0=Sun 6=Sat
                const isWeekend = dow === 0 || dow === 6
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() + 1 &&
                  year === today.getFullYear()

                let cellCls = "rounded-lg border p-2 min-h-[64px] cursor-pointer transition-all hover:ring-1 hover:ring-emerald-500/40 "
                if (entry?.is_holiday && entry.holiday_type) {
                  cellCls += HOLIDAY_CELL_BG[entry.holiday_type] ?? "bg-muted/40 border-border"
                } else if (isWeekend) {
                  cellCls += "bg-muted/30 border-border/40"
                } else {
                  cellCls += "bg-background border-border/60"
                }

                return (
                  <div key={day} onClick={() => openDialog(day)} className={cellCls}>
                    <div className="flex items-start justify-between">
                      <span className={`text-sm font-semibold leading-none ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs"
                          : isWeekend ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {day}
                      </span>
                    </div>
                    {entry?.is_holiday && entry.holiday_name && (
                      <p className="text-[9px] leading-tight mt-1.5 text-current opacity-80 line-clamp-2">
                        {entry.holiday_name}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Dialog */}
      <Dialog open={!!dialogDay} onOpenChange={(v) => { if (!v) setDialogDay(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogDay && new Date(dialogDay.date + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Toggle holiday */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Tandai sebagai hari libur</span>
              <button
                onClick={() => setIsHoliday((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isHoliday ? "bg-emerald-500" : "bg-muted"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isHoliday ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {isHoliday && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Nama Hari Libur</label>
                  <input
                    type="text"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    placeholder="Contoh: Hari Raya Idul Fitri"
                    className="w-full text-sm rounded-md px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Tipe Libur</label>
                  <Select value={holidayType} onValueChange={(v: any) => setHolidayType(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">🔴 Nasional</SelectItem>
                      <SelectItem value="company">🟠 Perusahaan</SelectItem>
                      <SelectItem value="cuti_bersama">🟣 Cuti Bersama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {dialogError && (
              <p className="text-sm text-red-400 border border-red-500/20 bg-red-500/10 rounded px-3 py-2">
                {dialogError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            {dialogDay?.entry && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-red-400 hover:text-red-300 mr-auto"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Hapus
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDialogDay(null)} disabled={saving || deleting}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || deleting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                : <><CheckCircle2 className="w-4 h-4" />Simpan</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Shift Dialog ──────────────────────────────────────────────────────────────

const EMPTY_SHIFT: Omit<WorkShift, "id" | "tenant_id"> = {
  entity_id: null,
  code: "",
  name: "",
  start_time: "08:00:00",
  end_time: "17:00:00",
  grace_period_minutes: 15,
  break_duration_minutes: 60,
  is_night_shift: false,
  description: null,
  status: "active",
}

function ShiftDialog({
  open,
  shift,
  entities,
  onClose,
  onSave,
}: {
  open: boolean
  shift?: WorkShift | null
  entities: any[]
  onClose: () => void
  onSave: (data: Omit<WorkShift, "id" | "tenant_id">) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<WorkShift, "id" | "tenant_id">>(EMPTY_SHIFT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(shift ? { ...shift } : EMPTY_SHIFT)
      setError(null)
    }
  }, [open, shift])

  const set = (k: keyof typeof form, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.code || !form.start_time || !form.end_time) {
      setError("Nama, kode, jam masuk, dan jam keluar wajib diisi")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shift ? "Edit Shift" : "Tambah Shift Kerja"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Shift">
              <input type="text" value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls} placeholder="Shift Pagi" />
            </Field>
            <Field label="Kode">
              <input type="text" value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                className={inputCls} placeholder="PAGI" maxLength={20} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Masuk">
              <input type="time" value={form.start_time?.slice(0, 5)}
                onChange={(e) => set("start_time", e.target.value + ":00")}
                className={inputCls} />
            </Field>
            <Field label="Jam Keluar">
              <input type="time" value={form.end_time?.slice(0, 5)}
                onChange={(e) => set("end_time", e.target.value + ":00")}
                className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Toleransi Keterlambatan (menit)">
              <input type="number" min={0} max={60} value={form.grace_period_minutes}
                onChange={(e) => set("grace_period_minutes", Number(e.target.value))}
                className={inputCls} />
            </Field>
            <Field label="Istirahat (menit)">
              <input type="number" min={0} value={form.break_duration_minutes}
                onChange={(e) => set("break_duration_minutes", Number(e.target.value))}
                className={inputCls} />
            </Field>
          </div>

          <Field label="Entitas (kosongkan = berlaku semua)">
            <Select value={form.entity_id ?? "__all__"} onValueChange={(v) => set("entity_id", v === "__all__" ? null : v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Semua Entitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Entitas</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.code} — {e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Shift Malam</span>
            <button
              onClick={() => set("is_night_shift", !form.is_night_shift)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.is_night_shift ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.is_night_shift ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-500/20 bg-red-500/10 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
              : <><CheckCircle2 className="w-4 h-4" />Simpan</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const inputCls = "w-full text-sm rounded-md px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

// ── Shift Tab ─────────────────────────────────────────────────────────────────

function ShiftTab() {
  const { entities } = useEntities()
  const { shifts, loading, createShift, updateShift, deleteShift } = useWorkShifts()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editShift, setEditShift] = useState<WorkShift | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSave = async (data: Omit<WorkShift, "id" | "tenant_id">) => {
    if (editShift) {
      await updateShift(editShift.id, data)
    } else {
      await createShift(data)
    }
  }

  const handleDelete = async (shift: WorkShift) => {
    if (!confirm(`Hapus shift "${shift.name}"?`)) return
    setDeleteError(null)
    try {
      await deleteShift(shift.id)
    } catch (err: any) {
      setDeleteError(err.message ?? "Gagal menghapus")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Kelola jam kerja dan toleransi keterlambatan per shift.
        </p>
        <Button
          size="sm"
          onClick={() => { setEditShift(null); setDialogOpen(true) }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tambah Shift
        </Button>
      </div>

      {deleteError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {deleteError}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Belum ada shift. Klik "+ Tambah Shift" untuk membuat.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Shift</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Jam Masuk</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Jam Keluar</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Toleransi</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Istirahat</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{shift.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{shift.code}
                        {shift.is_night_shift && <span className="ml-1.5 text-indigo-400">🌙 malam</span>}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center text-foreground tabular-nums">
                      {formatTime(shift.start_time)}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground tabular-nums">
                      {formatTime(shift.end_time)}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {shift.grace_period_minutes} mnt
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {shift.break_duration_minutes} mnt
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={shift.status === "active"
                        ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                      }>
                        {shift.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditShift(shift); setDialogOpen(true) }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(shift)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ShiftDialog
        open={dialogOpen}
        shift={editShift}
        entities={entities}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HRMasterDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kalender & Shift Kerja</h1>
        <p className="text-muted-foreground mt-1">
          Atur hari libur, cuti bersama, dan jadwal shift karyawan
        </p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-emerald-600 gap-1.5">
            <CalendarDays className="w-4 h-4" />
            Kalender Kerja
          </TabsTrigger>
          <TabsTrigger value="shifts" className="data-[state=active]:bg-emerald-600 gap-1.5">
            <Clock className="w-4 h-4" />
            Shift Kerja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <WorkCalendarTab />
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <ShiftTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
