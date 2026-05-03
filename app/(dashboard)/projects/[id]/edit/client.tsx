"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FolderPlus, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjects } from "@/hooks/useProjects"

export default function ProjectEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { projects, update, loading: hookLoading } = useProjects()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    project_code: "",
    project_name: "",
    description: "",
    client_name: "",
    start_date: "",
    target_end_date: "",
    priority: "medium",
    status: "planning",
    budget: "",
    health: "green",
  })

  useEffect(() => {
    const proj = projects.find(p => p.id === id)
    if (proj) {
      setFormData({
        project_code: proj.project_code || "",
        project_name: proj.project_name || "",
        description: proj.description || "",
        client_name: proj.client_name || "",
        start_date: proj.start_date || "",
        target_end_date: proj.target_end_date || "",
        priority: proj.priority || "medium",
        status: proj.status || "planning",
        budget: proj.budget ? String(proj.budget) : "",
        health: proj.health || "green",
      })
    }
  }, [projects, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await update(id, {
        project_code: formData.project_code.toUpperCase(),
        project_name: formData.project_name,
        description: formData.description || null,
        client_name: formData.client_name || null,
        start_date: formData.start_date || null,
        target_end_date: formData.target_end_date || null,
        priority: formData.priority,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        health: formData.health,
      })
      router.push("/projects")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setSaving(false)
    }
  }

  const proj = projects.find(p => p.id === id)
  if (hookLoading && !proj) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Edit Project</h1><p className="text-xs text-slate-500">EDIT-PROJECT : {formData.project_name || formData.project_code || "-"}</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-emerald-500" /> Informasi Project</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-slate-200">Kode Project <span className="text-red-400">*</span></Label><Input value={formData.project_code} onChange={(e) => setFormData({ ...formData, project_code: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100 uppercase" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Nama Project <span className="text-red-400">*</span></Label><Input value={formData.project_name} onChange={(e) => setFormData({ ...formData, project_name: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Nama Klien</Label><Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Budget (Rp)</Label><Input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Tanggal Mulai</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Target Selesai</Label><Input type="date" value={formData.target_end_date} onChange={(e) => setFormData({ ...formData, target_end_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2">
                <Label className="text-slate-200">Prioritas</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="low">Rendah</SelectItem><SelectItem value="medium">Sedang</SelectItem><SelectItem value="high">Tinggi</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="planning">Planning</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="on_hold">On Hold</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Health</Label>
                <Select value={formData.health} onValueChange={(value) => setFormData({ ...formData, health: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-slate-200">Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/projects"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
