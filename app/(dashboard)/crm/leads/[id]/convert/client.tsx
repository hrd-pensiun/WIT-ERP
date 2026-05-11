"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRightLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLeads } from "@/hooks/useLeads"
import { useOpportunities } from "@/hooks/useOpportunities"

export default function ConvertLeadClient({ id }: { id: string }) {
  const router = useRouter()
  const { leads, loading: leadsLoading } = useLeads()
  const { createOpportunity } = useOpportunities()
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
    expected_close_date: "",
  })

  const lead = leads.find(l => l.id === id)

  useEffect(() => {
    if (lead) {
      setFormData({
        title: `${lead.company_name || lead.contact_name} - Opportunity`,
        description: lead.notes || "",
        value: lead.estimated_value ? String(lead.estimated_value) : "",
        expected_close_date: "",
      })
    }
  }, [lead])

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setConverting(true)
    try {
      await createOpportunity({
        tenant_id: "00000000-0000-0000-0000-000000000000",
        lead_id: id,
        title: formData.title,
        description: formData.description || null,
        value: formData.value ? parseFloat(formData.value) : 0,
        currency: "IDR",
        stage: "discovery",
        probability: 20,
        expected_close_date: formData.expected_close_date || null,
      })
      router.push("/crm/pipeline")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert lead")
    } finally {
      setConverting(false)
    }
  }

  if (leadsLoading && !lead) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  if (!lead) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lead tidak ditemukan</p>
          <Link href="/crm/pipeline"><Button variant="outline" className="mt-4 border-border">Kembali</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/pipeline"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Konversi Lead</h1>
          <p className="text-muted-foreground">Ubah lead menjadi opportunity</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
            Data Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">Nama Kontak</span><span>{lead.contact_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Perusahaan</span><span>{lead.company_name || "-"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{lead.contact_email || "-"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Estimasi Nilai</span><span>{lead.estimated_value ? `Rp ${Number(lead.estimated_value).toLocaleString('id-ID')}` : '-'}</span></div>
        </CardContent>
      </Card>

      <form onSubmit={handleConvert}>
        <Card>
          <CardHeader><CardTitle>Data Opportunity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label>Judul Opportunity <span className="text-red-400">*</span></Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-background border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nilai Deal (Rp)</Label><Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Estimasi Close Date</Label><Input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/crm/pipeline"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={converting} className="bg-emerald-600 hover:bg-emerald-700">
                {converting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengkonversi...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Konversi ke Opportunity</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
