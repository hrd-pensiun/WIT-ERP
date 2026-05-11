"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjects } from "@/hooks/useProjects"
import Link from "next/link"

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, loading } = useProjects()
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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createProject({
        tenant_id: "00000000-0000-0000-0000-000000000000",
        project_code: formData.project_code.toUpperCase(),
        project_name: formData.project_name,
        description: formData.description || null,
        client_name: formData.client_name || null,
        start_date: formData.start_date || null,
        target_end_date: formData.target_end_date || null,
        priority: formData.priority,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      })
      router.push("/projects")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Project Baru</h1><p className="text-muted-foreground text-sm">Buat project baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><FolderPlus className="w-5 h-5 text-emerald-500" /> Informasi Project</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Kode Project <span className="text-red-400">*</span></Label><Input value={formData.project_code} onChange={(e) => setFormData({ ...formData, project_code: e.target.value })} placeholder="e.g., PRJ-001" required className="bg-background border-border text-foreground uppercase" /></div>
              <div className="space-y-2"><Label>Nama Project <span className="text-red-400">*</span></Label><Input value={formData.project_name} onChange={(e) => setFormData({ ...formData, project_name: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Nama Klien</Label><Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Budget (Rp)</Label><Input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Tanggal Mulai</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Target Selesai</Label><Input type="date" value={formData.target_end_date} onChange={(e) => setFormData({ ...formData, target_end_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Prioritas</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Rendah</SelectItem><SelectItem value="medium">Sedang</SelectItem><SelectItem value="high">Tinggi</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="planning">Planning</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="on_hold">On Hold</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/projects"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Project"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
