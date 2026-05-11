"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Download,
  Loader2,
  AlertCircle,
  TrendingDown,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePayroll } from "@/hooks/usePayroll"
import { formatIDR, MOCK_MONTHLY_TREND, PTKP_TABLE, periodLabel } from "@/lib/mock-payroll-data"

export default function TaxPage() {
  const { periods, details, loading, error, fetchDetails } = usePayroll()

  const [selectedPeriod, setSelectedPeriod] = useState<string>("__latest__")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("per-employee")

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

  const stats = useMemo(() => ({
    totalPph21: details.reduce((s: number, d: any) => s + Number(d.pph21_amount || 0), 0),
    totalBpjsTk: details.reduce((s: number, d: any) => s + Number(d.bpjs_tk_amount || 0), 0),
    totalBpjsKes: details.reduce((s: number, d: any) => s + Number(d.bpjs_kes_amount || 0), 0),
  }), [details])

  const totals = useMemo(() => ({
    gross: filtered.reduce((s: number, d: any) => s + Number(d.gross_salary || 0), 0),
    bpjsTk: filtered.reduce((s: number, d: any) => s + Number(d.bpjs_tk_amount || 0), 0),
    bpjsKes: filtered.reduce((s: number, d: any) => s + Number(d.bpjs_kes_amount || 0), 0),
    pph21: filtered.reduce((s: number, d: any) => s + Number(d.pph21_amount || 0), 0),
    deductions: filtered.reduce((s: number, d: any) => s + Number(d.total_deductions || 0), 0),
    net: filtered.reduce((s: number, d: any) => s + Number(d.net_salary || 0), 0),
  }), [filtered])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manajemen Pajak & Potongan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rincian PPh21, BPJS Ketenagakerjaan, dan BPJS Kesehatan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total PPh21 (Periode Ini)", value: stats.totalPph21 },
          { label: "Total BPJS TK (Karyawan)", value: stats.totalBpjsTk },
          { label: "Total BPJS Kesehatan (Karyawan)", value: stats.totalBpjsKes },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatIDR(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="per-employee">Rincian Per Karyawan</TabsTrigger>
          <TabsTrigger value="monthly">Rekap Bulanan</TabsTrigger>
          <TabsTrigger value="simulation">Simulasi PPh21</TabsTrigger>
        </TabsList>

        {/* Tab 1 */}
        <TabsContent value="per-employee" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__latest__">Periode Terbaru</SelectItem>
                {periods.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{periodLabel(p.period_year, p.period_month)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari karyawan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />Memuat data...
            </div>
          ) : (
            <Card className="bg-card border-border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-muted-foreground">Karyawan</TableHead>
                      <TableHead className="text-muted-foreground text-right">Gaji Bruto</TableHead>
                      <TableHead className="text-muted-foreground text-right">BPJS TK</TableHead>
                      <TableHead className="text-muted-foreground text-right">BPJS Kes</TableHead>
                      <TableHead className="text-muted-foreground text-right">PPh21</TableHead>
                      <TableHead className="text-muted-foreground text-right">Total Potongan</TableHead>
                      <TableHead className="text-muted-foreground text-right">Gaji Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
                    ) : (
                      filtered.map((d: any) => (
                        <TableRow key={d.id} className="border-border hover:bg-muted/40">
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{d.user_profiles?.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{d.user_profiles?.employee_number ?? ""}</p>
                          </TableCell>
                          <TableCell className="text-right text-sm text-foreground">{formatIDR(d.gross_salary ?? 0)}</TableCell>
                          <TableCell className="text-right text-sm text-red-600">{formatIDR(d.bpjs_tk_amount ?? 0)}</TableCell>
                          <TableCell className="text-right text-sm text-red-600">{formatIDR(d.bpjs_kes_amount ?? 0)}</TableCell>
                          <TableCell className="text-right text-sm text-red-600">{formatIDR(d.pph21_amount ?? 0)}</TableCell>
                          <TableCell className="text-right text-sm text-red-600 font-medium">{formatIDR(d.total_deductions ?? 0)}</TableCell>
                          <TableCell className="text-right text-sm text-emerald-600 font-semibold">{formatIDR(d.net_salary ?? 0)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {filtered.length > 0 && (
                    <tfoot>
                      <TableRow className="border-border bg-muted/40 font-semibold">
                        <TableCell className="text-foreground text-sm">Total ({filtered.length} karyawan)</TableCell>
                        <TableCell className="text-right text-sm text-foreground">{formatIDR(totals.gross)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{formatIDR(totals.bpjsTk)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{formatIDR(totals.bpjsKes)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{formatIDR(totals.pph21)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{formatIDR(totals.deductions)}</TableCell>
                        <TableCell className="text-right text-sm text-emerald-600">{formatIDR(totals.net)}</TableCell>
                      </TableRow>
                    </tfoot>
                  )}
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2 */}
        <TabsContent value="monthly" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" />Export CSV
            </Button>
          </div>
          <Card className="bg-card border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Periode</TableHead>
                  <TableHead className="text-muted-foreground text-right">Karyawan</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total PPh21</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total BPJS TK</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total BPJS Kes</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total Potongan</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_MONTHLY_TREND.slice().reverse().map((row) => (
                  <TableRow key={row.period_label} className="border-border hover:bg-muted/40">
                    <TableCell className="font-medium text-foreground">{row.period_label}</TableCell>
                    <TableCell className="text-right text-foreground">{row.employee_count}</TableCell>
                    <TableCell className="text-right text-red-600">{formatIDR(row.pph21)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatIDR(row.bpjs_total * 0.4)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatIDR(row.bpjs_total * 0.6)}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">{formatIDR(row.gross - row.net)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-semibold">{formatIDR(row.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 3 */}
        <TabsContent value="simulation" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Simulasi PPh21 Pasal 21</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fitur simulasi PPh21 berdasarkan PTKP dan tarif progresif akan tersedia pada versi mendatang.
                    Saat ini PPh21 dihitung berdasarkan persentase flat yang dikonfigurasi pada Entity Payroll Config.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Tabel PTKP (Penghasilan Tidak Kena Pajak) 2024
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs text-muted-foreground py-2 font-medium">Status</th>
                        <th className="text-left text-xs text-muted-foreground py-2 font-medium">Keterangan</th>
                        <th className="text-right text-xs text-muted-foreground py-2 font-medium">PTKP / Tahun</th>
                        <th className="text-right text-xs text-muted-foreground py-2 font-medium">PTKP / Bulan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PTKP_TABLE.map((row) => (
                        <tr key={row.status} className="border-b border-border/50 hover:bg-muted/40">
                          <td className="py-2 font-mono text-blue-600 text-xs font-bold">{row.status}</td>
                          <td className="py-2 text-foreground">{row.label}</td>
                          <td className="py-2 text-right text-foreground">{formatIDR(row.annual)}</td>
                          <td className="py-2 text-right text-muted-foreground">{formatIDR(row.annual / 12)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-700">
                  <strong>Tarif PPh21 Progresif:</strong> 5% (s.d. Rp 60 jt/tahun) · 15% (Rp 60–250 jt) · 25% (Rp 250–500 jt) · 30% (Rp 500 jt–5 M) · 35% (di atas Rp 5 M)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
