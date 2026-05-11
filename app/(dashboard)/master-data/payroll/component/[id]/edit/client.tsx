"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, DollarSign, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSalaryComponents } from "@/hooks/useSalaryComponents"

export default function ComponentEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { salaryComponents, update, loading: hookLoading } = useSalaryComponents()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "earning",
    is_taxable: true,
    status: "active",
  })

  useEffect(() => {
    const comp = salaryComponents.find(c => c.id === id)
    if (comp) {
      setFormData({
        code: comp.code || "",
        name: comp.name || "",
        description: comp.description || "",
        type: comp.type || "earning",
        is_taxable: comp.is_taxable ?? true,
        status: comp.status ?? "active",
      })
    }
  }, [salaryComponents, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await update(id, formData)
      router.push("/master-data/payroll")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update component")
    } finally {
      setSaving(false)
    }
  }

  const comp = salaryComponents.find(c => c.id === id)
  if (hookLoading && !comp) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/payroll"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Edit Salary Component</h1><p className="text-xs text-muted-foreground">EDIT-SALARY COMPONENT : {formData.name || formData.code || "-"}</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Informasi Komponen</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Kode <span className="text-red-400">*</span></Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Nama <span className="text-red-400">*</span></Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-background border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={formData.is_taxable} onCheckedChange={(checked) => setFormData({ ...formData, is_taxable: checked })} /><Label>Kena Pajak</Label></div>
              <div className="flex items-center gap-2"><Switch checked={formData.status === "active"} onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })} /><Label>Aktif</Label></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/master-data/payroll"><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
