"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Users,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  UserCheck,
  UserX,
  Briefcase,
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
import { useDivisions } from "@/hooks/useDivisions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type EmployeeRow = {
  id: string
  full_name?: string
  employee_number?: string
  employment_type?: string
  status?: string
  join_date?: string
  department_id?: string | null
  division_id?: string | null
  departments?: { name?: string | null } | null
  divisions?: { name?: string | null } | null
  hr_positions?: { name?: string | null } | null
}

export default function EmployeesPage() {
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployees()
  const { departments } = useDepartments()
  const { divisions } = useDivisions()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deptFilter, setDeptFilter] = useState("all")

  const deptNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments]
  )

  const divisionNameById = useMemo(
    () => new Map(divisions.map((d: { id: string; name?: string }) => [d.id, d.name])),
    [divisions]
  )

  const departmentLabel = useCallback(
    (emp: EmployeeRow) => {
      const embedded = emp.departments?.name?.trim()
      if (embedded) return embedded
      if (emp.department_id && deptNameById.has(emp.department_id)) {
        return deptNameById.get(emp.department_id) as string
      }
      return "—"
    },
    [deptNameById]
  )

  const divisionLabel = useCallback(
    (emp: EmployeeRow) => {
      const embedded = emp.divisions?.name?.trim()
      if (embedded) return embedded
      if (emp.division_id && divisionNameById.has(emp.division_id)) {
        return divisionNameById.get(emp.division_id) as string
      }
      return "—"
    },
    [divisionNameById]
  )

  useEffect(() => {
    void fetchEmployees({
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      department_id: deptFilter !== "all" ? deptFilter : undefined,
    })
  }, [search, statusFilter, deptFilter, fetchEmployees])

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
    <div className="w-full min-w-0 space-y-6">
      {/* Header — padding halaman dari layout parent (main) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
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
              <SelectTrigger className="w-full md:w-[180px] bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak aktif</SelectItem>
                <SelectItem value="resigned">Resign</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Filter departemen" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 max-h-56">
                <SelectItem value="all">Semua departemen</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full shrink-0 border-slate-700 text-slate-300 md:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee table — tepi lurus kartu, scroll horizontal di layar kecil */}
      <Card className="overflow-hidden bg-slate-900 border-slate-800">
        <CardHeader className="border-b border-slate-800 py-4 space-y-0 px-4 sm:px-6">
          <CardTitle className="text-lg text-slate-100">Daftar Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-14 text-center text-slate-400">Memuat...</div>
          ) : employees.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              Belum ada data karyawan
            </div>
          ) : (
            <Table className="min-w-[900px] table-fixed">
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-950/50 hover:bg-slate-950/50">
                  <TableHead className="pl-4 sm:pl-6 w-[24%] text-xs font-medium uppercase tracking-wide text-slate-500">
                    Karyawan
                  </TableHead>
                  <TableHead className="w-[16%] text-xs font-medium uppercase tracking-wide text-slate-500">
                    Departemen
                  </TableHead>
                  <TableHead className="w-[16%] text-xs font-medium uppercase tracking-wide text-slate-500">
                    Divisi
                  </TableHead>
                  <TableHead className="hidden lg:table-cell w-[14%] text-xs font-medium uppercase tracking-wide text-slate-500">
                    Jabatan
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-[14%] text-xs font-medium uppercase tracking-wide text-slate-500">
                    Bergabung
                  </TableHead>
                  <TableHead className="w-[12%] text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="w-12 pr-4 sm:pr-6 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    {/* aksi */}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const row = emp as EmployeeRow
                  const dept = departmentLabel(row)
                  const divName = divisionLabel(row)
                  const pos = row.hr_positions?.name?.trim() || "—"
                  return (
                  <TableRow
                    key={emp.id}
                    className="border-slate-800 hover:bg-slate-800/40"
                  >
                    <TableCell className="pl-4 py-4 align-middle sm:pl-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-medium text-emerald-500">
                          {emp.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">
                            {emp.full_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {emp.employee_number} •{" "}
                            {getEmploymentBadge(emp.employment_type)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400 lg:hidden">
                            <span className="text-slate-500">Dept:</span> {dept}
                            {divName !== "—" ? (
                              <>
                                <span className="text-slate-500"> · Div:</span> {divName}
                              </>
                            ) : null}
                            {pos !== "—" ? ` · ${pos}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[10rem] py-4 align-middle whitespace-normal text-slate-300 lg:max-w-none">
                      <span className="line-clamp-2 break-words" title={dept}>
                        {dept}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[10rem] py-4 align-middle whitespace-normal text-slate-300 lg:max-w-none">
                      <span className="line-clamp-2 break-words" title={divName}>
                        {divName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-[9rem] py-4 align-middle whitespace-normal text-slate-300 lg:table-cell">
                      <span className="line-clamp-2 break-words">{pos}</span>
                    </TableCell>
                    <TableCell className="hidden py-4 align-middle text-sm text-slate-400 sm:table-cell">
                      {emp.join_date
                        ? new Date(emp.join_date).toLocaleDateString("id-ID")
                        : "—"}
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      <Badge
                        className={`${getStatusBadge(emp.status)} text-[10px] font-semibold`}
                      >
                        {(emp.status || "—").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 py-4 text-right align-middle sm:pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-100"
                            aria-label="Menu aksi"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-slate-800 bg-slate-900"
                        >
                          <Link href={`/hr/employees/${emp.id}`}>
                            <DropdownMenuItem className="text-slate-200 focus:bg-slate-800 focus:text-slate-100">
                              <UserCheck className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/hr/employees/${emp.id}/edit`}>
                            <DropdownMenuItem className="text-slate-200 focus:bg-slate-800 focus:text-slate-100">
                              <Briefcase className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
                            onClick={() => deleteEmployee(emp.id)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Nonaktifkan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
