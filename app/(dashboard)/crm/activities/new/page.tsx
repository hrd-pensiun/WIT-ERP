"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Activity, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLeads } from "@/hooks/useLeads"
import { useActivities } from "@/hooks/useActivities"
import Link from "next/link"

export default function NewActivityPage() {
  const router = useRouter()
  const { leads } = useLeads()
  const { createActivity } = useActivities()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    lead_id: "",
    activity_type: "call",
    subject: "",
    description: "",
    scheduled_at: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createActivity({
        lead_id: formData.lead_id || null,
        activity_type: formData.activity_type,
        subject: formData.subject,
        description: formData.description || null,
        scheduled_at: formData.scheduled_at || null,
      })
      router.push("/crm/activities")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log activity")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/activities"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Log Aktivitas</h1><p className="text-muted-foreground text-sm">Catat aktivitas CRM</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" /> Informasi Aktivitas</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Lead</Label>
                <Select value={formData.lead_id} onValueChange={(value) => setFormData({ ...formData, lead_id: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Pilih lead (opsional)" /></SelectTrigger>
                  <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.contact_name} - {l.company_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe Aktivitas <span className="text-red-400">*</span></Label>
                <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Telepon</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="visit">Visit</SelectItem>
                    <SelectItem value="note">Catatan</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Subjek <span className="text-red-400">*</span></Label><Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required className="bg-background border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Jadwal</Label><Input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/crm/activities"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Aktivitas"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
