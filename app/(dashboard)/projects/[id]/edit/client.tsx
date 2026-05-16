"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FolderPlus, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { insForge } from "@/lib/insforge"

export default function ProjectEditClient({ id }: { id: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    project_name: "",
    project_code: "",
    company_name: "",
    client_name: "",
    status: "draft",
    health: "green",
    project_type: "Consultant",
    po_value: "",
    start_date: "",
    end_date: "",
    term_of_payment: "",
    notes: "",
  })

  const fetchProject = useCallback(async () => {
    if (!insForge) return
    try {
      const { data, error: fetchErr } = await insForge
        .from("commercial_projects")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
      if (fetchErr) throw fetchErr
      if (data) {
        setFormData({
          project_name: data.project_name || "",
          project_code: data.project_code || "",
          company_name: data.company_name || "",
          client_name: data.client_name || "",
          status: data.status || "draft",
          health: data.health || "green",
          project_type: data.project_type || "Consultant",
          po_value: data.po_value ? String(data.po_value) : "",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          term_of_payment: data.term_of_payment || "",
          notes: data.notes || "",
        })
      }
    } catch (err) {
      console.error("Failed to fetch project:", err)
      setError("Gagal memuat data project")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!insForge) return
    setError(null)
    setSaving(true)
    try {
      const { error: updateErr } = await insForge
        .from("commercial_projects")
        .update({
          project_name: formData.project_name,
          company_name: formData.company_name || null,
          client_name: formData.client_name || null,
          status: formData.status,
          health: formData.health,
          project_type: formData.project_type,
          po_value: formData.po_value ? parseFloat(formData.po_value) : 0,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          term_of_payment: formData.term_of_payment || null,
          notes: formData.notes || null,
        })
        .eq("id", id)
      if (updateErr) throw updateErr
      router.push(`/projects/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update project")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${id}`}><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Edit Project</h1><p className="text-xs text-muted-foreground">{formData.project_code}</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><FolderPlus className="w-5 h-5 text-emerald-500" /> Informasi Project</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Kode Project</Label><Input value={formData.project_code} readOnly className="bg-muted border-border text-foreground uppercase" /></div>
              <div className="space-y-2"><Label>Nama Project <span className="text-red-400">*</span></Label><Input value={formData.project_name} onChange={(e) => setFormData({ ...formData, project_name: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Perusahaan / Company</Label><Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Nama Klien</Label><Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Nilai PO (Rp)</Label><Input type="number" value={formData.po_value} onChange={(e) => setFormData({ ...formData, po_value: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Tanggal Mulai</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Tanggal Selesai</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Term of Payment</Label>
                <Select value={formData.term_of_payment} onValueChange={(value) => setFormData({ ...formData, term_of_payment: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Pilih TOP" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DP 30%">DP 30%</SelectItem>
                    <SelectItem value="DP 50%">DP 50%</SelectItem>
                    <SelectItem value="100% di awal">100% di awal</SelectItem>
                    <SelectItem value="100% di akhir">100% di akhir</SelectItem>
                    <SelectItem value="Bertahap">Bertahap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="quotation">Quotation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Health</Label>
                <Select value={formData.health} onValueChange={(value) => setFormData({ ...formData, health: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe Project</Label>
                <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultant">Consultant</SelectItem>
                    <SelectItem value="Networking">Networking</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Web">Web</SelectItem>
                    <SelectItem value="WMS">WMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href={`/projects/${id}`}><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
