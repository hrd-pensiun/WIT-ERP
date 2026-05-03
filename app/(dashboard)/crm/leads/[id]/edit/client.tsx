"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useLeads } from "@/hooks/useLeads"

export default function LeadEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { leads, updateLead, loading: hookLoading } = useLeads()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  })

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
      })
      router.push("/crm/pipeline")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead")
    } finally {
      setSaving(false)
    }
  }

  const lead = leads.find(l => l.id === id)
  if (hookLoading && !lead) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/pipeline"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Edit Lead</h1><p className="text-xs text-slate-500">EDIT-LEAD : {formData.contact_name || formData.company_name || "-"}</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500" /> Informasi Lead</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-slate-200">Nama Kontak <span className="text-red-400">*</span></Label><Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Nama Perusahaan</Label><Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Email</Label><Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Telepon</Label><Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Jabatan Kontak</Label><Input value={formData.contact_position} onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2">
                <Label className="text-slate-200">Sumber Lead</Label>
                <Select value={formData.lead_source} onValueChange={(value) => setFormData({ ...formData, lead_source: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
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
              <div className="space-y-2"><Label className="text-slate-200">Estimasi Nilai (Rp)</Label><Input type="number" value={formData.estimated_value} onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
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
                  <SelectContent className="bg-slate-900 border-slate-800">
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
            </div>
            <div className="space-y-2"><Label className="text-slate-200">Catatan</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">BANT Qualification</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between"><Label className="text-slate-200 text-sm">Budget</Label><Switch checked={formData.budget_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, budget_confirmed: checked })} /></div>
                <div className="flex items-center justify-between"><Label className="text-slate-200 text-sm">Authority</Label><Switch checked={formData.authority_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, authority_confirmed: checked })} /></div>
                <div className="flex items-center justify-between"><Label className="text-slate-200 text-sm">Need</Label><Switch checked={formData.need_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, need_confirmed: checked })} /></div>
                <div className="flex items-center justify-between"><Label className="text-slate-200 text-sm">Timeline</Label><Switch checked={formData.timeline_confirmed} onCheckedChange={(checked) => setFormData({ ...formData, timeline_confirmed: checked })} /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/crm/pipeline"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
