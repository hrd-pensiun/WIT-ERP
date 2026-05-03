"use client"

import Link from "next/link"
import { useState } from "react"
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExpenses } from "@/hooks/useExpenses"

export default function ExpensesPage() {
  const { expenses, loading, deleteExpense, fetchExpenses } = useExpenses()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return
    setActionError(null)
    try {
      await deleteExpense(id)
      await fetchExpenses()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus pengeluaran")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
          <p className="text-slate-400 text-sm">Kelola data pengeluaran</p>
        </div>
        <Link href="/finance/expenses/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Pengeluaran Baru
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            Daftar Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Belum ada pengeluaran</div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <Link href={`/finance/expenses/${expense.id}`}>
                    <p className="font-medium text-slate-100">{expense.description}</p>
                    <p className="text-xs text-slate-500">{expense.expense_date}</p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-700 text-slate-200">{expense.category}</Badge>
                    <p className="text-sm text-emerald-400">Rp {Number(expense.total_amount || expense.amount || 0).toLocaleString("id-ID")}</p>
                    <Link href={`/finance/expenses/${expense.id}`}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400" onClick={() => handleDelete(expense.id)}>
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
