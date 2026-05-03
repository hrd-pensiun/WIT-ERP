"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Receipt, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExpenses } from "@/hooks/useExpenses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const getCategoryLabel = (cat: string) => {
  const labels: Record<string, string> = {
    operational: "Operasional", marketing: "Marketing", salary: "Gaji",
    rent: "Sewa", utilities: "Utilities", travel: "Perjalanan", other: "Lainnya",
    TRAVEL: "Perjalanan Dinas", OFFICE: "Keperluan Kantor", SOFTWARE: "Software & Tools",
    MEETING: "Meeting & Entertainment", TRAINING: "Training & Development",
    EQUIPMENT: "Equipment", MARKETING: "Marketing",
  }
  return labels[cat] || cat
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: "Cash", transfer: "Transfer Bank", credit_card: "Kartu Kredit",
    debit_card: "Kartu Debit", e_wallet: "E-Wallet", bank_transfer: "Transfer Bank",
  }
  return labels[method] || method
}

export default function ExpenseDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { getExpense, updateExpense, deleteExpense } = useExpenses()
  const [expense, setExpense] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getExpense(id)
      .then((data) => setExpense(data))
      .catch(() => setExpense(null))
      .finally(() => setLoading(false))
  }, [id, getExpense])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/finance/expenses"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Pengeluaran tidak ditemukan</h1>
          </div>
        </div>
      </div>
    )
  }

  const totalAmount = expense.total_amount || expense.amount + (expense.tax_amount || 0)

  const handleUpdateStatus = async (status: string) => {
    setSaving(true)
    try {
      const updated = await updateExpense(id, { payment_status: status })
      setExpense(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Hapus pengeluaran ini?")) return
    await deleteExpense(id)
    router.push("/finance/expenses")
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/expenses"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Detail Pengeluaran</h1>
            <p className="text-slate-400">{expense.expense_number || expense.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-700"><FileText className="w-4 h-4 mr-2" />Lampiran</Button>
          <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100">{expense.description}</h2>
                <p className="text-sm text-slate-400">{expense.vendor_name || '-'}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-400">{getCategoryLabel(expense.category)}</Badge>
          </div>

          <div className="border-t border-slate-800 pt-4 grid grid-cols-2 gap-4">
            <div><p className="text-sm text-slate-500">Tanggal</p><p className="text-slate-200">{expense.expense_date}</p></div>
            <div><p className="text-sm text-slate-500">Metode Pembayaran</p><p className="text-slate-200">{getPaymentMethodLabel(expense.payment_method)}</p></div>
            <div><p className="text-sm text-slate-500">Nomor Pengeluaran</p><p className="text-slate-200">{expense.expense_number || expense.id.slice(0, 8)}</p></div>
            <div><p className="text-sm text-slate-500">Jumlah</p><p className="text-2xl font-bold text-emerald-400">Rp {totalAmount.toLocaleString('id-ID')}</p></div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Payment Status</p>
              <Select value={expense.payment_status || "unpaid"} onValueChange={handleUpdateStatus} disabled={saving}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {expense.notes && (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-sm text-slate-500 mb-1">Catatan</p>
              <p className="text-slate-300">{expense.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
