"use client"

import { useState } from "react"
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

export default function NewEmployeePage() {
  const router = useRouter()
  const { createEmployee, generateEmployeeNumber, loading } = useEmployees()
  const { departments } = useDepartments()
  const { divisions } = useDivisions()
  const { positions } = usePositions()
  const { jobGrades } = useJobGrades()
  
  const [formData, setFormData] = useState({
    full_name: "",
    employee_number: "",
    email: "",
    phone: "",
    department_id: "",
    division_id: "",
    position_id: "",
    job_grade_id: "",
    employment_type: "permanent",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generate employee number if empty
    let empNumber = formData.employee_number
    if (!empNumber) {
      empNumber = await generateEmployeeNumber()
    }

    const employee = await createEmployee({
      ...formData,
      employee_number: empNumber,
      status: 'active',
      user_id: null,
      entity_id: null,
      work_shift_id: null
    } as any)

    if (employee) {
      router.push('/hr/employees')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/hr/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Tambah Karyawan
          </h1>
          <p className="text-slate-400">Isi data karyawan baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
            <TabsTrigger value="employment">Kepegawaian</TabsTrigger>
            <TabsTrigger value="bank">Bank & Dokumen</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Data Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="Nama lengkap karyawan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nomor Karyawan</Label>
                  <Input
                    value={formData.employee_number}
                    onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="Auto-generate jika kosong"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="email@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="0812xxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="male">Laki-laki</SelectItem>
                      <SelectItem value="female">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Pernikahan</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => setFormData({...formData, marital_status: v})}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
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
                    className="bg-slate-950 border-slate-800"
                    placeholder="Alamat lengkap"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Data Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departemen</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih departemen" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Divisi</Label>
                  <Select value={formData.division_id} onValueChange={(v) => setFormData({...formData, division_id: v})}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih divisi" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {divisions.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih posisi" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
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
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {jobGrades.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name} (Level {g.level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipe Pekerjaan</Label>
                  <Select value={formData.employment_type} onValueChange={(v) => setFormData({...formData, employment_type: v})}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="permanent">Karyawan Tetap</SelectItem>
                      <SelectItem value="contract">Kontrak</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="intern">Magang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Bergabung *</Label>
                  <Input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input
                    value={formData.npwp}
                    onChange={(e) => setFormData({...formData, npwp: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Informasi Bank</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="BCA, Mandiri, BNI, dll"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nomor Rekening</Label>
                  <Input
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="xxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Pemilik Rekening</Label>
                  <Input
                    value={formData.bank_account_name}
                    onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="Nama sesuai rekening"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kontak Darurat (Nama)</Label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="Nama kontak darurat"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kontak Darurat (No. HP)</Label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    className="bg-slate-950 border-slate-800"
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
            <Button type="button" variant="outline" className="border-slate-700">
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
