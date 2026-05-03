"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Download, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInvoices } from "@/hooks/useInvoices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { getInvoice, updateInvoice, deleteInvoice } = useInvoices()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getInvoice(id)
      .then((data) => setInvoice(data))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false))
  }, [id, getInvoice])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      overdue: "bg-red-500/20 text-red-400 border-red-500/30",
      cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    }
    return variants[status] || variants.draft
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/finance/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Invoice tidak ditemukan</h1>
          </div>
        </div>
      </div>
    )
  }

  const taxPercent = invoice.tax_percent || 11
  const taxAmount = invoice.tax_amount || Math.round(invoice.subtotal * taxPercent / 100)
  const discount = invoice.discount_amount || 0
  const total = invoice.total_amount || invoice.subtotal + taxAmount - discount

  const handleUpdateStatus = async (status: string) => {
    setSaving(true)
    try {
      const updated = await updateInvoice(id, { status })
      setInvoice(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Hapus invoice ini?")) return
    await deleteInvoice(id)
    router.push("/finance/invoices")
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Detail Invoice</h1>
            <p className="text-slate-400">{invoice.invoice_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700"><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button variant="outline" className="border-slate-700"><Download className="w-4 h-4 mr-2" />Download</Button>
          <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-100">WIT.ID</h2>
              <p className="text-sm text-slate-400">ERP Solutions</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-slate-100">INVOICE</h3>
              <p className="text-sm text-slate-400">{invoice.invoice_number}</p>
              <Badge className={`mt-2 ${getStatusBadge(invoice.status)}`}>{invoice.status.toUpperCase()}</Badge>
              <div className="mt-2">
                <Select value={invoice.status} onValueChange={handleUpdateStatus} disabled={saving}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Ditagihkan Kepada</p>
              <p className="font-medium text-slate-200">{invoice.customer_name}</p>
              <p className="text-sm text-slate-400">{invoice.customer_email}</p>
            </div>
            <div className="text-right">
              <div className="mb-2"><p className="text-sm text-slate-400">Tanggal Issue</p><p className="text-slate-200">{invoice.invoice_date}</p></div>
              <div><p className="text-sm text-slate-400">Jatuh Tempo</p><p className="text-slate-200">{invoice.due_date}</p></div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 text-sm font-medium text-slate-400">Deskripsi</th>
                  <th className="text-right py-3 text-sm font-medium text-slate-400">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 text-slate-200">{invoice.notes || 'Invoice item'}</td>
                  <td className="py-4 text-right text-slate-200">Rp {(invoice.subtotal || 0).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-slate-200">Rp {(invoice.subtotal || 0).toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">PPN ({taxPercent}%)</span><span className="text-slate-200">Rp {taxAmount.toLocaleString('id-ID')}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Diskon</span><span className="text-slate-200">-Rp {discount.toLocaleString('id-ID')}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-800"><span className="text-slate-200">Total</span><span className="text-emerald-400">Rp {total.toLocaleString('id-ID')}</span></div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-sm text-slate-400">Catatan</p>
              <p className="text-slate-300 mt-1">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
