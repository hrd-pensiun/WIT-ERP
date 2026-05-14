"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, Loader2, Save, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useLeads } from "@/hooks/useLeads"
import { insForge } from "@/lib/insforge"

export default function LeadEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { leads, updateLead, loading: hookLoading } = useLeads()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([])
  const [formData, setFormData] = useState({
    contact_name: "",
    company_name: "",
    contact_email: "",
    contact_phone: "",
    contact_position: "",
    lead_source: "website",
    estimated_value: "",
    priority: "medium",
    status: "new",
    notes: "",
    budget_confirmed: false,
    authority_confirmed: false,
    need_confirmed: false,
    timeline_confirmed: false,
    project_type_id: "",
  })

  useEffect(() => {
    if (!insForge) return
    insForge.from("commercial_project_types").select("id,name").eq("is_active", true).order("name")
      .then(({ data }: any) => { if (data) setProjectTypes(data) })
  }, [])

  useEffect(() => {
    const lead = leads.find(l => l.id === id)
    if (lead) {
      setFormData({
        contact_name: lead.contact_name || "",
        company_name: lead.company_name || "",
        contact_email: lead.contact_email || "",
        contact_phone: lead.contact_phone || "",
        contact_position: lead.contact_position || "",
        lead_source: lead.lead_source || "website",
        estimated_value: lead.estimated_value ? String(lead.estimated_value) : "",
        priority: lead.priority || "medium",
        status: lead.status || "new",
        notes: lead.notes || "",
        budget_confirmed: lead.budget_confirmed ?? false,
        authority_confirmed: lead.authority_confirmed ?? false,
        need_confirmed: lead.need_confirmed ?? false,
        timeline_confirmed: lead.timeline_confirmed ?? false,
        project_type_id: lead.project_type_id || "",
      })
    }
  }, [leads, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await updateLead(id, {
        contact_name: formData.contact_name,
        company_name: formData.company_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        contact_position: formData.contact_position || null,
        lead_source: formData.lead_source,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes || null,
        budget_confirmed: formData.budget_confirmed,
        authority_confirmed: formData.authority_confirmed,
        need_confirmed: formData.need_confirmed,
        timeline_confirmed: formData.timeline_confirmed,
        project_type_id: formData.project_type_id || null,
      })
      router.push("/crm/pipeline")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus lead ini?")) return
    if (!insForge) return
    setDeleting(true)
    try {
      await insForge.from("crm_leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      router.push("/crm/pipeline")
    } catch (err) {
      console.error("Failed to delete lead:", err)
      setDeleting(false)
    }
  }

  const lead = leads.find(l => l.id === id)
  if (hookLoading && !lead) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/pipeline"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Edit Lead</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            {lead?.lead_number && (
              <code className="text-emerald-500 font-mono bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                {lead.lead_number}
              </code>
            )}
            {formData.contact_name || formData.company_name || "-"}
          </p>
        </div>
        <Link href={`/crm/leads/${id}`}>
          <Button variant="outline" size="sm" className="border-border gap-1.5">
            <Eye className="w-4 h-4" /> Lihat
          </Button>
        </Link>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500" /> Informasi Lead</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nama Kontak <span className="text-red-400">*</span></Label><Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Nama Perusahaan</Label><Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Telepon</Label><Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Jabatan Kontak</Label><Input value={formData.contact_position} onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Sumber Lead</Label>
                <Select value={formData.lead_source} onValueChange={(value) => setFormData({ ...formData, lead_source: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="walk_in">Walk In</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Estimasi Nilai (Rp)</Label><Input type="number" value={formData.estimated_value} onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })} className="bg-background border-border text-foreground" /></div>
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
                  <SelectContent>
                    <SelectItem value="new">Baru</SelectItem>
                    <SelectItem value="contacted">Dihubungi</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negosiasi</SelectItem>
                    <SelectItem value="closed_won">Won</SelectItem>
                    <SelectItem value="closed_lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe Proyek</Label>
                <Select value={formData.project_type_id} onValueChange={(value) => setFormData({ ...formData, project_type_id: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Pilih tipe proyek..." /></SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">BANT Qualification</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between"><Label className="text-foreground text-sm">Budget</Label><Switch checked={formData.budget_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, budget_confirmed: checked })} /></div>
                <div className="flex items-center justify-between"><Label className="text-foreground text-sm">Authority</Label><Switch checked={formData.authority_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, authority_confirmed: checked })} /></div>
                <div className="flex items-center justify-between"><Label className="text-foreground text-sm">Need</Label><Switch checked={formData.need_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, need_confirmed: checked })} /></div>
                <div className="flex items-center justify-between"><Label className="text-foreground text-sm">Timeline</Label><Switch checked={formData.timeline_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, timeline_confirmed: checked })} /></div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Hapus
              </Button>
              <div className="flex items-center gap-3">
                <Link href="/crm/pipeline"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
                <Button type="submit" disabled={saving || deleting} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
