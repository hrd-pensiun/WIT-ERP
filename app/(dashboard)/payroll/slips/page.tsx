"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  AlertCircle,
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
import { usePayroll } from "@/hooks/usePayroll"
import { formatIDR, periodLabel } from "@/lib/mock-payroll-data"

export default function SlipsPage() {
  const { periods, details, loading, error, fetchDetails } = usePayroll()

  const [selectedPeriod, setSelectedPeriod] = useState<string>("__latest__")
  const [search, setSearch] = useState("")
  const [paidOverrides, setPaidOverrides] = useState<Set<string>>(new Set())

  const resolvedPeriodId = useMemo(() => {
    if (selectedPeriod === "__latest__") return periods[0]?.id ?? ""
    return selectedPeriod
  }, [selectedPeriod, periods])

  useEffect(() => {
    if (resolvedPeriodId) fetchDetails(resolvedPeriodId)
  }, [resolvedPeriodId, fetchDetails])

  const filtered = useMemo(() => {
    if (!search) return details
    const q = search.toLowerCase()
    return details.filter((d: any) =>
      d.user_profiles?.full_name?.toLowerCase().includes(q) ||
      d.user_profiles?.employee_number?.toLowerCase().includes(q)
    )
  }, [details, search])

  const stats = useMemo(() => {
    const total = details.length
    const paid = details.filter((d: any) => d.status === "paid" || paidOverrides.has(d.id)).length
    return { total, paid, pending: total - paid }
  }, [details, paidOverrides])

  const isDetailPaid = (d: any) => d.status === "paid" || paidOverrides.has(d.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Slip Gaji & Pembayaran</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate, kirim, dan konfirmasi pembayaran slip gaji karyawan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Slip Digenerate</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Menunggu Konfirmasi</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Pilih Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__latest__">Periode Terbaru</SelectItem>
            {periods.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {periodLabel(p.period_year, p.period_month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Memuat slip gaji...
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Karyawan</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Gaji Bruto</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Total Potongan</TableHead>
                <TableHead className="text-muted-foreground">Gaji Bersih</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada slip gaji untuk periode ini</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((detail: any) => {
                  const paid = isDetailPaid(detail)
                  return (
                    <TableRow key={detail.id} className="border-border hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                            {(detail.user_profiles?.full_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{detail.user_profiles?.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{detail.user_profiles?.employee_number ?? ""}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground hidden md:table-cell">
                        {formatIDR(detail.gross_salary ?? 0)}
                      </TableCell>
                      <TableCell className="text-sm text-red-600 hidden md:table-cell">
                        {formatIDR(detail.total_deductions ?? 0)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-emerald-600">
                        {formatIDR(detail.net_salary ?? 0)}
                      </TableCell>
                      <TableCell>
                        {paid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Dibayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            Menunggu
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/payroll/slips/${resolvedPeriodId}/${detail.user_profile_id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2" title="Lihat Slip">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {!paid && (
                            <Button
                              size="sm"
                              onClick={() => setPaidOverrides((prev) => new Set([...prev, detail.id]))}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                            >
                              Konfirmasi
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2" title="Unduh PDF">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
