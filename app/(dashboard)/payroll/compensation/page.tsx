"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  TrendingUp,
  DollarSign,
  Award,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEmployees } from "@/hooks/useEmployees"
import { useDepartments } from "@/hooks/useDepartments"

function GradeBadge({ name }: { name?: string }) {
  const n = (name || "").toLowerCase()
  let cls = "bg-muted text-foreground border-border"
  if (n.includes("6") || n.includes("senior") || n.includes("vii") || n.includes("vi"))
    cls = "bg-purple-500/20 text-purple-700 border-purple-500/30"
  else if (n.includes("5") || n.includes("v"))
    cls = "bg-amber-500/20 text-amber-700 border-amber-500/30"
  else if (n.includes("4") || n.includes("iv"))
    cls = "bg-blue-500/20 text-blue-700 border-blue-500/30"
  else if (n.includes("3") || n.includes("iii"))
    cls = "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"

  return name ? (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>{name}</span>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )
}

export default function CompensationPage() {
  const { employees, loading, error } = useEmployees()
  const { departments } = useDepartments()

  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [filterGrade, setFilterGrade] = useState("all")

  const grades = useMemo(() => {
    const set = new Set<string>()
    employees.forEach((e: any) => {
      const g = e.hr_job_grades?.name
      if (g) set.add(g)
    })
    return Array.from(set).sort()
  }, [employees])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return employees.filter((e: any) => {
      if (q && !(e.full_name?.toLowerCase().includes(q) || e.employee_number?.toLowerCase().includes(q))) return false
      if (filterDept !== "all" && e.department_id !== filterDept) return false
      if (filterGrade !== "all" && e.hr_job_grades?.name !== filterGrade) return false
      return true
    })
  }, [employees, search, filterDept, filterGrade])

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e: any) => e.status === "active").length,
  }), [employees])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kompensasi Karyawan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola data kompensasi dan riwayat gaji karyawan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Total Karyawan</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Karyawan Aktif</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Rata-rata Gaji</p>
            </div>
            <p className="text-sm font-medium text-foreground">Lihat Detail</p>
            <p className="text-xs text-muted-foreground">Per karyawan</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Kenaikan Gaji (YTD)</p>
            </div>
            <p className="text-2xl font-bold text-foreground">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama / NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Departemen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Departemen</SelectItem>
            {departments.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterGrade} onValueChange={setFilterGrade}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Grade</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Memuat data karyawan...
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Karyawan</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Departemen</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Jabatan</TableHead>
                <TableHead className="text-muted-foreground">Grade</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Tgl Bergabung</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Tidak ada karyawan ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp: any) => (
                  <TableRow key={emp.id} className="border-border hover:bg-muted/40 cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                          {(emp.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employee_number}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {emp.departments?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                      {emp.hr_positions?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <GradeBadge name={emp.hr_job_grades?.name} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {emp.join_date
                        ? new Date(emp.join_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                        emp.status === "active"
                          ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {emp.status === "active" ? "Aktif" : (emp.status ?? "—")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/payroll/compensation/${emp.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
