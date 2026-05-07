"use client"

import Link from "next/link"
import { useState } from "react"
import { FileText, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInvoices } from "@/hooks/useInvoices"

export default function InvoicesPage() {
  const { invoices, loading, deleteInvoice, fetchInvoices } = useInvoices()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus invoice ini?")) return
    setActionError(null)
    try {
      await deleteInvoice(id)
      await fetchInvoices()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus invoice")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm">Kelola data invoice pelanggan</p>
        </div>
        <Link href="/finance/invoices/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Invoice Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Daftar Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Belum ada invoice</div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <Link href={`/finance/invoices/${invoice.id}`}>
                    <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{invoice.customer_name}</p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-foreground">{invoice.status}</Badge>
                    <p className="text-sm text-emerald-400">Rp {Number(invoice.total_amount || 0).toLocaleString("id-ID")}</p>
                    <Link href={`/finance/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => handleDelete(invoice.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
