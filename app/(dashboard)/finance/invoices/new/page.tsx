"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useInvoices } from "@/hooks/useInvoices"
import Link from "next/link"

export default function NewInvoicePage() {
  const router = useRouter()
  const { createInvoice } = useInvoices()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    invoice_number: "",
    customer_name: "",
    customer_email: "",
    issue_date: "",
    due_date: "",
    subtotal: "",
    tax_percent: "11",
    discount: "",
    status: "draft",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createInvoice({
        invoice_number: formData.invoice_number,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        status: formData.status,
        invoice_date: formData.issue_date || null,
        due_date: formData.due_date || null,
        subtotal,
        tax_percent: parseFloat(formData.tax_percent) || 0,
        tax_amount: tax,
        discount_amount: discount,
        total_amount: total,
        notes: formData.notes || null,
      })
      router.push("/finance/invoices")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice")
    } finally {
      setLoading(false)
    }
  }

  const subtotal = parseFloat(formData.subtotal) || 0
  const tax = subtotal * (parseFloat(formData.tax_percent) || 0) / 100
  const discount = parseFloat(formData.discount) || 0
  const total = subtotal + tax - discount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/invoices"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Invoice Baru</h1><p className="text-muted-foreground text-sm">Buat invoice baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /> Informasi Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nomor Invoice <span className="text-red-400">*</span></Label><Input value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} placeholder="INV-2026-0001" required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Nama Pelanggan <span className="text-red-400">*</span></Label><Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Tanggal Issue</Label><Input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Tanggal Jatuh Tempo</Label><Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Perhitungan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2"><Label>Subtotal (Rp)</Label><Input type="number" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label>PPN (%)</Label><Input type="number" value={formData.tax_percent} onChange={(e) => setFormData({ ...formData, tax_percent: e.target.value })} className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label>Diskon (Rp)</Label><Input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="bg-background border-border text-foreground" /></div>
              </div>
              <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">PPN ({formData.tax_percent}%)</span><span>Rp {tax.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">Diskon</span><span>-Rp {discount.toLocaleString('id-ID')}</span></div>
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-emerald-400">Rp {total.toLocaleString('id-ID')}</span></div>
              </div>
            </div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/finance/invoices"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Invoice"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
