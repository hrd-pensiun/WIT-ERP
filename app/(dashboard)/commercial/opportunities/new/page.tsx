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
      router.push("/commercial/leads")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create opportunity")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/commercial/leads"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Tambah Opportunity</h1><p className="text-muted-foreground text-sm">Buat opportunity baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-500" /> Informasi Opportunity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label>Judul <span className="text-red-400">*</span></Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-background border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nilai (Rp)</Label><Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Probabilitas (%)</Label><Input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Estimasi Close Date</Label><Input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/commercial/leads"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Opportunity"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
