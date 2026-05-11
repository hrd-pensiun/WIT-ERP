"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Receipt, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExpenses } from "@/hooks/useExpenses"
import Link from "next/link"

export default function NewExpensePage() {
  const router = useRouter()
  const { createExpense } = useExpenses()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    expense_number: "",
    expense_date: "",
    category: "operational",
    description: "",
    amount: "",
    vendor_name: "",
    payment_method: "transfer",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createExpense({
        expense_number: formData.expense_number,
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description || null,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        vendor_name: formData.vendor_name || null,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
      })
      router.push("/finance/expenses")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/expenses"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Pengeluaran Baru</h1><p className="text-muted-foreground text-sm">Catat pengeluaran baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-500" /> Informasi Pengeluaran</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nomor Pengeluaran <span className="text-red-400">*</span></Label><Input value={formData.expense_number} onChange={(e) => setFormData({ ...formData, expense_number: e.target.value })} placeholder="EXP-2026-0001" required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Tanggal <span className="text-red-400">*</span></Label><Input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="operational">Operasional</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="salary">Gaji</SelectItem><SelectItem value="rent">Sewa</SelectItem><SelectItem value="utilities">Utilities</SelectItem><SelectItem value="travel">Perjalanan</SelectItem><SelectItem value="other">Lainnya</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Jumlah (Rp) <span className="text-red-400">*</span></Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Vendor/Nama Toko</Label><Input value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="transfer">Transfer Bank</SelectItem><SelectItem value="credit_card">Kartu Kredit</SelectItem><SelectItem value="debit_card">Kartu Debit</SelectItem><SelectItem value="e_wallet">E-Wallet</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/finance/expenses"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Pengeluaran"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
