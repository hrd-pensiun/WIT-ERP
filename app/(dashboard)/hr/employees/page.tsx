"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Users,
  Plus,
  Download,
  Loader2,
  MoreHorizontal,
  UserCheck,
  UserX,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterBar, FilterBarSearch, FilterBarSeparator, FilterBarActions } from "@/components/ui/filter-bar"
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
  app_role?: string | null
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
  const [syncingAuth, setSyncingAuth] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

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
      inactive: "bg-muted/50 text-muted-foreground border-border/30",
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

  const handleBulkSyncAuth = async () => {
    setSyncingAuth(true)
    setSyncMessage(null)
    try {
      const response = await fetch("/api/auth/sync-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true }),
      })
      const result = (await response.json().catch(() => null)) as
        | {
            ok?: boolean
            message?: string
            report?: { total?: number; processed?: number; skipped?: number; failed?: number }
          }
        | null

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Gagal sinkronkan login karyawan.")
      }

      const report = result.report
      setSyncMessage(
        `Sinkron selesai. Total ${report?.total ?? 0}, berhasil ${report?.processed ?? 0}, skip ${report?.skipped ?? 0}, gagal ${report?.failed ?? 0}.`
      )
      await fetchEmployees({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        department_id: deptFilter !== "all" ? deptFilter : undefined,
      })
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Gagal sinkronkan login karyawan.")
    } finally {
      setSyncingAuth(false)
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header — padding halaman dari layout parent (main) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Karyawan
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data karyawan dan informasi SDM
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-border text-foreground"
            onClick={handleBulkSyncAuth}
            disabled={syncingAuth}
          >
            {syncingAuth ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sinkronisasi...
              </>
            ) : (
              "Set Password Default Semua Karyawan"
            )}
          </Button>
          <Link href="/hr/employees/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Karyawan
            </Button>
          </Link>
        </div>
      </div>
      {syncMessage ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">{syncMessage}</div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Karyawan</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {employees.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aktif</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {employees.filter(e => e.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Baru (30 hari)</p>
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
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Keluar</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {employees.filter(e => e.status === 'resigned').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <FilterBar>
        <FilterBarSearch
          placeholder="Cari nama, nomor karyawan, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterBarSeparator />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak aktif</SelectItem>
            <SelectItem value="resigned">Resign</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[180px]">
            <SelectValue placeholder="Filter departemen" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            <SelectItem value="all">Semua departemen</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FilterBarActions>
          <Button variant="outline" size="sm" className="shrink-0">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </FilterBarActions>
      </FilterBar>

      {/* Employee table — tepi lurus kartu, scroll horizontal di layar kecil */}
      <Card className="overflow-hidden bg-card border-border">
        <CardHeader className="border-b border-border py-4 space-y-0 px-4 sm:px-6">
          <CardTitle className="text-lg text-foreground">Daftar Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-14 text-center text-muted-foreground">Memuat...</div>
          ) : employees.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              Belum ada data karyawan
            </div>
          ) : (
            <Table className="min-w-[900px] table-fixed">
              <TableHeader>
                <TableRow className="border-border bg-background/50 hover:bg-background/50">
                  <TableHead className="pl-4 sm:pl-6 w-[24%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Karyawan
                  </TableHead>
                  <TableHead className="w-[16%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Departemen
                  </TableHead>
                  <TableHead className="w-[16%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Divisi
                  </TableHead>
                  <TableHead className="hidden lg:table-cell w-[14%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Jabatan
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-[14%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Bergabung
                  </TableHead>
                  <TableHead className="w-[12%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="w-[12%] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-12 pr-4 sm:pr-6 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                    className="border-border hover:bg-muted/40"
                  >
                    <TableCell className="pl-4 py-4 align-middle sm:pl-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-medium text-emerald-500">
                          {emp.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {emp.full_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {emp.employee_number} •{" "}
                            {getEmploymentBadge(emp.employment_type)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground lg:hidden">
                            <span className="text-muted-foreground">Dept:</span> {dept}
                            {divName !== "—" ? (
                              <>
                                <span className="text-muted-foreground"> · Div:</span> {divName}
                              </>
                            ) : null}
                            {pos !== "—" ? ` · ${pos}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[10rem] py-4 align-middle whitespace-normal text-foreground lg:max-w-none">
                      <span className="line-clamp-2 break-words" title={dept}>
                        {dept}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[10rem] py-4 align-middle whitespace-normal text-foreground lg:max-w-none">
                      <span className="line-clamp-2 break-words" title={divName}>
                        {divName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-[9rem] py-4 align-middle whitespace-normal text-foreground lg:table-cell">
                      <span className="line-clamp-2 break-words">{pos}</span>
                    </TableCell>
                    <TableCell className="hidden py-4 align-middle text-sm text-muted-foreground sm:table-cell">
                      {emp.join_date
                        ? new Date(emp.join_date).toLocaleDateString("id-ID")
                        : "—"}
                    </TableCell>
                    <TableCell className="py-4 align-middle text-foreground">
                      {(emp as EmployeeRow).app_role || "employee"}
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
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label="Menu aksi"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-border bg-card"
                        >
                          <Link href={`/hr/employees/${emp.id}`}>
                            <DropdownMenuItem className="text-foreground focus:bg-muted focus:text-foreground">
                              <UserCheck className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/hr/employees/${emp.id}/edit`}>
                            <DropdownMenuItem className="text-foreground focus:bg-muted focus:text-foreground">
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
