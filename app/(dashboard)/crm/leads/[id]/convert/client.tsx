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
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-400">Lead tidak ditemukan</p>
          <Link href="/crm/pipeline"><Button variant="outline" className="mt-4 border-slate-700">Kembali</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/crm/pipeline"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Konversi Lead</h1>
          <p className="text-slate-400">Ubah lead menjadi opportunity</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
            Data Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-slate-500">Nama Kontak</span><span className="text-slate-200">{lead.contact_name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Perusahaan</span><span className="text-slate-200">{lead.company_name || "-"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-200">{lead.contact_email || "-"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Estimasi Nilai</span><span className="text-slate-200">{lead.estimated_value ? `Rp ${Number(lead.estimated_value).toLocaleString('id-ID')}` : '-'}</span></div>
        </CardContent>
      </Card>

      <form onSubmit={handleConvert}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100">Data Opportunity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label className="text-slate-200">Judul Opportunity <span className="text-red-400">*</span></Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="space-y-2"><Label className="text-slate-200">Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-slate-200">Nilai Deal (Rp)</Label><Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Estimasi Close Date</Label><Input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/crm/pipeline"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
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
