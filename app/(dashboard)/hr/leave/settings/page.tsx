"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Pencil, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useLeaveTypes } from "@/hooks/useLeaveTypes"

const BLANK_FORM = {
  code: "",
  name: "",
  days_per_year: 12,
  carry_over_allowed: false,
  max_carry_over_days: 0,
  min_service_months: 0,
  is_paid: true,
  requires_approval: true,
  approval_levels: 1,
  description: "",
  status: "active",
}

export default function LeaveSettingsPage() {
  const { leaveTypes, loading, createLeaveType, updateLeaveType } = useLeaveTypes()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<typeof BLANK_FORM>(BLANK_FORM)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setEditId(null)
    setForm(BLANK_FORM)
    setError(null)
    setOpen(true)
  }

  const openEdit = (lt: any) => {
    setEditId(lt.id)
    setForm({
      code: lt.code ?? "",
      name: lt.name ?? "",
      days_per_year: lt.days_per_year ?? 12,
      carry_over_allowed: lt.carry_over_allowed ?? false,
      max_carry_over_days: lt.max_carry_over_days ?? 0,
      min_service_months: lt.min_service_months ?? 0,
      is_paid: lt.is_paid ?? true,
      requires_approval: lt.requires_approval ?? true,
      approval_levels: lt.approval_levels ?? 1,
      description: lt.description ?? "",
      status: lt.status ?? "active",
    })
    setError(null)
    setOpen(true)
  }

  const handleSave = async () => {
    setError(null)
    if (!form.code.trim() || !form.name.trim()) {
      setError("Kode dan Nama wajib diisi.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        days_per_year: Number(form.days_per_year),
        max_carry_over_days: Number(form.max_carry_over_days),
        min_service_months: Number(form.min_service_months),
        approval_levels: Number(form.approval_levels),
      }
      if (editId) {
        await updateLeaveType(editId, payload)
      } else {
        await createLeaveType(payload)
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (lt: any) => {
    const next = lt.status === "active" ? "inactive" : "active"
    await updateLeaveType(lt.id, { status: next })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/leave">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-500" />
              Tipe Cuti
            </h1>
            <p className="text-muted-foreground text-sm">Kelola jenis-jenis cuti dan kuotanya</p>
          </div>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tipe
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Tipe Cuti</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />Memuat...
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Belum ada tipe cuti. Klik <strong>Tambah Tipe</strong> untuk mulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Kode</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Nama</th>
                    <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Hari/Tahun</th>
                    <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Carry Over</th>
                    <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Berbayar</th>
                    <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveTypes.map((lt) => (
                    <tr key={lt.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{lt.code}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">{lt.name}</td>
                      <td className="py-3 pr-4 text-center">{lt.days_per_year}</td>
                      <td className="py-3 pr-4 text-center">
                        {lt.carry_over_allowed ? (
                          <span className="text-emerald-500">✓ maks {lt.max_carry_over_days}h</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {lt.is_paid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Badge
                          className={
                            lt.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {lt.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(lt)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs ${lt.status === "active" ? "text-red-400 hover:text-red-300" : "text-emerald-500 hover:text-emerald-400"}`}
                            onClick={() => handleToggleStatus(lt)}
                          >
                            {lt.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Tipe Cuti" : "Tambah Tipe Cuti"}</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode <span className="text-red-400">*</span></Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="TAHUNAN"
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Hari per Tahun</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.days_per_year}
                  onChange={(e) => setForm({ ...form, days_per_year: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama <span className="text-red-400">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cuti Tahunan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. Masa Kerja (bulan)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_service_months}
                  onChange={(e) => setForm({ ...form, min_service_months: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Level Persetujuan</Label>
                <Select
                  value={String(form.approval_levels)}
                  onValueChange={(v) => setForm({ ...form, approval_levels: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Level</SelectItem>
                    <SelectItem value="2">2 Level</SelectItem>
                    <SelectItem value="3">3 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer">Carry Over</Label>
                <Switch
                  checked={form.carry_over_allowed}
                  onCheckedChange={(v) => setForm({ ...form, carry_over_allowed: v })}
                />
              </div>
              {form.carry_over_allowed && (
                <div className="space-y-2 pl-4">
                  <Label>Maks. Carry Over (hari)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.max_carry_over_days}
                    onChange={(e) => setForm({ ...form, max_carry_over_days: Number(e.target.value) })}
                    className="w-32"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer">Berbayar</Label>
                <Switch
                  checked={form.is_paid}
                  onCheckedChange={(v) => setForm({ ...form, is_paid: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer">Butuh Persetujuan</Label>
                <Switch
                  checked={form.requires_approval}
                  onCheckedChange={(v) => setForm({ ...form, requires_approval: v })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Keterangan opsional..."
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
