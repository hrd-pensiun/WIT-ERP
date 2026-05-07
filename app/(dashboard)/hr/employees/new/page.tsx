"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users, ArrowLeft, Upload, Calendar, Building2,
  Briefcase, Wallet, Mail, Phone, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployees } from "@/hooks/useEmployees"
import { useDepartments } from "@/hooks/useDepartments"
import { useDivisions } from "@/hooks/useDivisions"
import { usePositions } from "@/hooks/usePositions"
import { useJobGrades } from "@/hooks/useJobGrades"

const DEPARTMENT_OPTIONAL_MIN_LEVEL = 9

export default function NewEmployeePage() {
  const router = useRouter()
  const { createEmployee, generateEmployeeNumber, loading, employees } = useEmployees()
  const { departments } = useDepartments()
  const { divisions } = useDivisions()
  const { positions } = usePositions()
  const { jobGrades } = useJobGrades()
  
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    employee_number: "",
    email: "",
    phone: "",
    department_id: "",
    reports_to_profile_id: "",
    division_id: "",
    position_id: "",
    job_grade_id: "",
    employment_type: "permanent",
    app_role: "employee",
    join_date: new Date().toISOString().split('T')[0],
    status: "active",
    address: "",
    city: "",
    date_of_birth: "",
    gender: "",
    religion: "",
    marital_status: "",
    npwp: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    emergency_contact_name: "",
    emergency_contact_phone: ""
  })

  const selectedGradeLevel = useMemo(() => {
    const byGrade = jobGrades.find((g) => String(g.id) === formData.job_grade_id)
    if (byGrade?.level != null && Number.isFinite(Number(byGrade.level))) {
      return Number(byGrade.level)
    }
    const byPosition = positions.find((p) => String(p.id) === formData.position_id) as
      | (Record<string, unknown> & { hr_job_grades?: { level?: number | null } | null })
      | undefined
    const lvl = byPosition?.hr_job_grades?.level
    return lvl != null && Number.isFinite(Number(lvl)) ? Number(lvl) : null
  }, [formData.job_grade_id, formData.position_id, jobGrades, positions])

  const eligibleManagers = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.status !== "active") return false
      const managerLevel = (emp as any)?.hr_job_grades?.level
      if (managerLevel == null || selectedGradeLevel == null) return false
      return Number(managerLevel) > selectedGradeLevel
    })
  }, [employees, selectedGradeLevel])

  useEffect(() => {
    if (!formData.reports_to_profile_id) return
    const stillEligible = eligibleManagers.some((emp) => emp.id === formData.reports_to_profile_id)
    if (!stillEligible) {
      setFormData((prev) => ({ ...prev, reports_to_profile_id: "" }))
    }
  }, [eligibleManagers, formData.reports_to_profile_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Generate employee number if empty
    let empNumber = formData.employee_number
    if (!empNumber) {
      empNumber = await generateEmployeeNumber()
    }

    const allowNoDepartment =
      selectedGradeLevel != null && selectedGradeLevel >= DEPARTMENT_OPTIONAL_MIN_LEVEL

    const deptId = formData.department_id?.trim() ? formData.department_id : null
    if (!deptId && !allowNoDepartment) {
      setError(
        `Departemen wajib diisi untuk job level di bawah ${DEPARTMENT_OPTIONAL_MIN_LEVEL}.`
      )
      return
    }

    let employee: any = null
    try {
      employee = await createEmployee({
        ...formData,
        // Postgres UUID tidak menerima "" -> pakai null kalau kosong
        department_id: deptId,
        reports_to_profile_id: formData.reports_to_profile_id || null,
        employee_number: empNumber,
        status: "active",
        user_id: null,
        entity_id: null,
        work_shift_id: null,
      } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee")
      return
    }

    if (employee) {
      try {
        await fetch("/api/auth/sync-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: (employee as any).id ?? null,
            userId: (employee as any).user_id ?? null,
            email: (employee as any).email ?? null,
            fullName: (employee as any).full_name ?? formData.full_name ?? null,
            role: (employee as any).app_role ?? formData.app_role,
            password: "wit12345",
          }),
        })
      } catch {
        // Keep employee save successful even if metadata sync is unavailable.
      }
      router.push('/hr/employees')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/hr/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Tambah Karyawan
          </h1>
          <p className="text-muted-foreground">Isi data karyawan baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList>
            <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
            <TabsTrigger value="employment">Kepegawaian</TabsTrigger>
            <TabsTrigger value="bank">Bank & Dokumen</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="bg-background border-border"
                    placeholder="Nama lengkap karyawan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nomor Karyawan</Label>
                  <Input
                    value={formData.employee_number}
                    onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                    className="bg-background border-border"
                    placeholder="Auto-generate jika kosong"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-background border-border"
                    placeholder="email@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-background border-border"
                    placeholder="0812xxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Laki-laki</SelectItem>
                      <SelectItem value="female">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Pernikahan</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => setFormData({...formData, marital_status: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Belum Menikah</SelectItem>
                      <SelectItem value="married">Menikah</SelectItem>
                      <SelectItem value="divorced">Cerai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Alamat</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="bg-background border-border"
                    placeholder="Alamat lengkap"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departemen</Label>
                  <Select
                    value={formData.department_id || "__none__"}
                    onValueChange={(v) => setFormData({ ...formData, department_id: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Divisi</Label>
                  <Select value={formData.division_id} onValueChange={(v) => setFormData({...formData, division_id: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih divisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Atasan (Reports To)</Label>
                  <Select
                    value={formData.reports_to_profile_id || "__none__"}
                    disabled={selectedGradeLevel == null}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        reports_to_profile_id: v === "__none__" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih atasan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-</SelectItem>
                      {eligibleManagers
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                            {emp.employee_number ? ` (${emp.employee_number})` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedGradeLevel == null ? (
                    <p className="text-xs text-muted-foreground">Pilih jabatan/grade dulu agar daftar atasan akurat.</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Posisi/Jabatan</Label>
                  <Select
                    value={formData.position_id}
                    onValueChange={(v) => {
                      const selectedPosition = positions.find((p) => p.id === v)
                      setFormData({
                        ...formData,
                        position_id: v,
                        job_grade_id:
                          (selectedPosition as any)?.job_grade_id
                            ? String((selectedPosition as any).job_grade_id)
                            : formData.job_grade_id,
                      })
                    }}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                          {(p as any).hr_job_grades?.level
                            ? ` (Level ${(p as any).hr_job_grades.level})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={formData.job_grade_id} onValueChange={(v) => setFormData({...formData, job_grade_id: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobGrades.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name} (Level {g.level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipe Pekerjaan</Label>
                  <Select value={formData.employment_type} onValueChange={(v) => setFormData({...formData, employment_type: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Karyawan Tetap</SelectItem>
                      <SelectItem value="contract">Kontrak</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="intern">Magang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Role Aplikasi</Label>
                  <Select value={formData.app_role} onValueChange={(v) => setFormData({...formData, app_role: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr_admin">HR Admin</SelectItem>
                      <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Bergabung *</Label>
                  <Input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    className="bg-background border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input
                    value={formData.npwp}
                    onChange={(e) => setFormData({...formData, npwp: e.target.value})}
                    className="bg-background border-border"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Bank</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="bg-background border-border"
                    placeholder="BCA, Mandiri, BNI, dll"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nomor Rekening</Label>
                  <Input
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    className="bg-background border-border"
                    placeholder="xxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Pemilik Rekening</Label>
                  <Input
                    value={formData.bank_account_name}
                    onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
                    className="bg-background border-border"
                    placeholder="Nama sesuai rekening"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kontak Darurat (Nama)</Label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    className="bg-background border-border"
                    placeholder="Nama kontak darurat"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kontak Darurat (No. HP)</Label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    className="bg-background border-border"
                    placeholder="0812xxxxxxx"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/hr/employees">
            <Button type="button" variant="outline" className="border-border">
              Batal
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Karyawan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
