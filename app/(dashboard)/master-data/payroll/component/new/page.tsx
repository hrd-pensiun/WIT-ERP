"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSalaryComponents } from "@/hooks/useSalaryComponents"
import Link from "next/link"

export default function NewSalaryComponentPage() {
  const router = useRouter()
  const { createComponent, loading } = useSalaryComponents()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "earning",
    is_taxable: true,
    is_fixed: true,
    default_amount: "0",
    calculation_type: "fixed",
    affects_thp: true,
    affects_topp: false,
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await createComponent({
        tenant_id: "00000000-0000-0000-0000-000000000000",
        code: formData.code.toUpperCase(),
        name: formData.name,
        type: formData.type as "earning" | "deduction",
        is_taxable: formData.is_taxable,
        is_fixed: formData.is_fixed,
        default_amount: parseFloat(formData.default_amount) || 0,
        calculation_type: formData.calculation_type as "fixed" | "percentage" | "formula",
        affects_thp: formData.affects_thp,
        affects_topp: formData.affects_topp,
        description: formData.description || null,
        status: "active",
      })

      router.push("/master-data/payroll")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create salary component")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/payroll">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tambah Komponen Gaji</h1>
          <p className="text-muted-foreground text-sm">Setup template komponen penggajian</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              Detail Komponen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Kode <span className="text-red-400">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., TUNJ_TRANSPORT"
                  required
                  className="bg-background border-border text-foreground uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama <span className="text-red-400">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tunjangan Transportasi"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipe <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Penghasilan (Earning)</SelectItem>
                    <SelectItem value="deduction">Potongan (Deduction)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calculation">Cara Hitung <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.calculation_type}
                  onValueChange={(value) => setFormData({ ...formData, calculation_type: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="formula">Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default">Default Amount (Rp)</Label>
              <Input
                id="default"
                type="number"
                value={formData.default_amount}
                onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                placeholder="0"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Penjelasan komponen ini..."
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="taxable">Kena Pajak</Label>
                <Switch
                  id="taxable"
                  checked={formData.is_taxable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_taxable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="fixed">Fixed Amount</Label>
                <Switch
                  id="fixed"
                  checked={formData.is_fixed}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_fixed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="thp">Masuk THP</Label>
                <Switch
                  id="thp"
                  checked={formData.affects_thp}
                  onCheckedChange={(checked) => setFormData({ ...formData, affects_thp: checked })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/master-data/payroll">
                <Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button>
              </Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Menyimpan..." : "Simpan Komponen"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
