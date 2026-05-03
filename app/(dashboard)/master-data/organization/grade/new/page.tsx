"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useJobGrades } from "@/hooks/useJobGrades"
import Link from "next/link"
import { getTenantId } from "@/lib/tenant"

export default function NewJobGradePage() {
  const router = useRouter()
  const { createJobGrade, loading } = useJobGrades()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    level: "1",
    min_salary: "",
    max_salary: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await createJobGrade({
        tenant_id: getTenantId(),
        code: formData.code.toUpperCase(),
        name: formData.name,
        level: parseInt(formData.level),
        description: formData.description || null,
        min_salary: formData.min_salary ? parseFloat(formData.min_salary) : null,
        max_salary: formData.max_salary ? parseFloat(formData.max_salary) : null,
        status: "active",
      })

      router.push("/master-data/organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job grade")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master-data/organization">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tambah Job Grade</h1>
          <p className="text-slate-400 text-sm">Buat grade/jenjang karir baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Informasi Job Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">Kode <span className="text-red-400">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., JG1"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100 uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Nama <span className="text-red-400">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Staff Junior"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-slate-200">Level <span className="text-red-400">*</span> (1-10)</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="min_salary" className="text-slate-200">Gaji Minimum</Label>
                <Input
                  id="min_salary"
                  type="number"
                  value={formData.min_salary}
                  onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                  placeholder="5000000"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_salary" className="text-slate-200">Gaji Maksimum</Label>
                <Input
                  id="max_salary"
                  type="number"
                  value={formData.max_salary}
                  onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                  placeholder="8000000"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi grade..."
                rows={3}
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/master-data/organization">
                <Button type="button" variant="ghost" className="text-slate-400">Batal</Button>
              </Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
