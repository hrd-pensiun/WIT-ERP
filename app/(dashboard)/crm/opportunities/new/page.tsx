"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOpportunities } from "@/hooks/useOpportunities"
import Link from "next/link"

export default function NewOpportunityPage() {
  const router = useRouter()
  const { createOpportunity, loading } = useOpportunities()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
    stage: "discovery",
    probability: "20",
    expected_close_date: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createOpportunity({
        tenant_id: "00000000-0000-0000-0000-000000000000",
        title: formData.title,
        description: formData.description || null,
        value: formData.value ? parseFloat(formData.value) : 0,
        currency: "IDR",
        stage: formData.stage,
        probability: parseInt(formData.probability),
        expected_close_date: formData.expected_close_date || null,
      })
      router.push("/crm/pipeline")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create opportunity")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/pipeline"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Tambah Opportunity</h1><p className="text-slate-400 text-sm">Buat opportunity baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-500" /> Informasi Opportunity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label className="text-slate-200">Judul <span className="text-red-400">*</span></Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="space-y-2"><Label className="text-slate-200">Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-slate-200">Nilai (Rp)</Label><Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2">
                <Label className="text-slate-200">Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-slate-200">Probabilitas (%)</Label><Input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Estimasi Close Date</Label><Input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/crm/pipeline"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Opportunity"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
