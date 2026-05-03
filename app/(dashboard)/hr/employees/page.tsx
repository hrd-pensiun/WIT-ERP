"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Users, Plus, Search, Filter, Download, 
  Mail, Phone, Building2, MoreHorizontal,
  UserCheck, UserX, Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useEmployees } from "@/hooks/useEmployees"
import { useDepartments } from "@/hooks/useDepartments"

export default function EmployeesPage() {
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployees()
  const { departments } = useDepartments()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")

  useEffect(() => {
    fetchEmployees({
      search: search || undefined,
      status: statusFilter || undefined,
      department_id: deptFilter || undefined
    })
  }, [search, statusFilter, deptFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      resigned: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      terminated: "bg-red-500/20 text-red-400 border-red-500/30"
    }
    return variants[status] || variants.inactive
  }

  const getEmploymentBadge = (type: string) => {
    const labels: Record<string, string> = {
      permanent: "Tetap",
      contract: "Kontrak",
      freelance: "Freelance",
      intern: "Magang"
    }
    return labels[type] || type
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Karyawan
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola data karyawan dan informasi SDM
          </p>
        </div>
        <Link href="/hr/employees/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Karyawan
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Total Karyawan</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {employees.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Aktif</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {employees.filter(e => e.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Baru (30 hari)</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {employees.filter(e => {
                const joinDate = new Date(e.join_date)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                return joinDate >= thirtyDaysAgo
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Keluar</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {employees.filter(e => e.status === 'resigned').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari nama, nomor karyawan, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                <SelectItem value="resigned">Resign</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[200px] bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Filter Departemen" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Daftar Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Belum ada data karyawan
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {employees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="py-4 flex items-center justify-between hover:bg-slate-800/50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <span className="text-emerald-500 font-medium">
                        {emp.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{emp.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{emp.employee_number}</span>
                        <span>•</span>
                        <span>{getEmploymentBadge(emp.employment_type)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-slate-400">
                      <p className="text-slate-500">Departemen</p>
                      <p className="text-slate-200">
                        {(emp as any).department?.name || '-'}
                      </p>
                    </div>
                    <div className="text-slate-400">
                      <p className="text-slate-500">Jabatan</p>
                      <p className="text-slate-200">
                        {(emp as any).position?.name || '-'}
                      </p>
                    </div>
                    <div className="text-slate-400">
                      <p className="text-slate-500">Bergabung</p>
                      <p className="text-slate-200">
                        {new Date(emp.join_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadge(emp.status)}>
                      {emp.status.toUpperCase()}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        <Link href={`/hr/employees/${emp.id}`}>
                          <DropdownMenuItem className="text-slate-200">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/hr/employees/${emp.id}/edit`}>
                          <DropdownMenuItem className="text-slate-200">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          className="text-red-400"
                          onClick={() => deleteEmployee(emp.id)}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Nonaktifkan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
