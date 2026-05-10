"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { Plus, Wallet, Calculator, Percent, Pencil, Trash2, Loader2, CheckCircle2, X, Building2, Users, CalendarDays, Edit2, Save, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useSalaryComponents } from "@/hooks/useSalaryComponents"
import { useJobGrades } from "@/hooks/useJobGrades"
import { useAllowanceMatrix } from "@/hooks/useAllowanceMatrix"
import { usePositionAllowanceEligibility } from "@/hooks/usePositionAllowanceEligibility"
import { usePositions } from "@/hooks/usePositions"
import { useEntities } from "@/hooks/useEntities"
import { useDivisions } from "@/hooks/useDivisions"
import { usePayrollCutoffConfig, PayrollCutoffConfig, PayrollPeriodOverride } from "@/hooks/usePayrollCutoffConfig"
import { getTenantId } from "@/lib/tenant"
import { computeCutoffDates, cutoffLabel, lastDayOfMonth } from "@/lib/payroll-cutoff-utils"

export default function PayrollConfigPage() {
  const [activeTab, setActiveTab] = useState("components")
  const [actionError, setActionError] = useState<string | null>(null)
  const { components, loading: compLoading, deleteComponent, fetchComponents } = useSalaryComponents()
  const { jobGrades, loading: gradeLoading } = useJobGrades()
  const { matrix, loading: matrixLoading, upsertEntry } = useAllowanceMatrix()
  const { entities } = useEntities()
  const { positions, loading: posLoading } = usePositions()
  const { divisions } = useDivisions()
  const { eligibility, loading: eligLoading, toggleEligibility, isEligible } = usePositionAllowanceEligibility()

  const handleDeleteComponent = async (id: string) => {
    if (!confirm("Hapus komponen gaji ini?")) return
    setActionError(null)
    try {
      await deleteComponent(id)
      await fetchComponents()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus komponen")
    }
  }

  const earnings = components.filter((c) => c.type === "earning")
  const deductions = components.filter((c) => c.type === "deduction")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Konfigurasi Payroll</h1>
        <p className="text-muted-foreground mt-1">Setup komponen gaji dan matrix</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {actionError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {actionError}
          </div>
        )}
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="components" className="data-[state=active]:bg-emerald-600">
            Komponen Gaji
          </TabsTrigger>
          <TabsTrigger value="allowance-matrix" className="data-[state=active]:bg-emerald-600">
            Pengaturan Tunjangan
          </TabsTrigger>
          <TabsTrigger value="position-matrix" className="data-[state=active]:bg-emerald-600">
            Matrix Jabatan
          </TabsTrigger>
          <TabsTrigger value="matrix" className="data-[state=active]:bg-emerald-600">
            Pengaturan Gaji
          </TabsTrigger>
          <TabsTrigger value="bopp" className="data-[state=active]:bg-emerald-600">
            BOPP Formula
          </TabsTrigger>
          <TabsTrigger value="cutoff" className="data-[state=active]:bg-emerald-600">
            Cut-off &amp; Periode
          </TabsTrigger>
        </TabsList>

        {/* Salary Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Earnings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  Penghasilan
                </CardTitle>
                <Link href="/master-data/payroll/component/new">
                  <Button size="sm" variant="ghost" className="text-emerald-400">
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {compLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : earnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Belum ada komponen</div>
                ) : (
                  earnings.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded flex items-center justify-center">
                          <span className="text-emerald-500 text-sm font-medium">{comp.code}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{comp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {comp.calculation_type} • {comp.is_taxable ? "Taxable" : "Non-taxable"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            comp.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted"
                          }
                        >
                          {comp.status}
                        </Badge>
                        <Link href={`/master-data/payroll/component/${comp.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-400"
                          onClick={() => handleDeleteComponent(comp.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Percent className="w-5 h-5 text-red-400" />
                  Potongan
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-emerald-400">
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {compLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : deductions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Belum ada komponen</div>
                ) : (
                  deductions.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center">
                          <span className="text-red-400 text-sm font-medium">{comp.code}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{comp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {comp.calculation_type} • {comp.is_taxable ? "Taxable" : "Non-taxable"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            comp.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted"
                          }
                        >
                          {comp.status}
                        </Badge>
                        <Link href={`/master-data/payroll/component/${comp.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-400"
                          onClick={() => handleDeleteComponent(comp.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Allowance Matrix Tab */}
        <TabsContent value="allowance-matrix">
          <AllowanceMatrixTab
            jobGrades={jobGrades}
            components={components.filter((c) => c.type === "earning")}
            matrix={matrix}
            loading={matrixLoading || gradeLoading || compLoading}
            upsertEntry={upsertEntry}
          />
        </TabsContent>

        {/* Position Matrix Tab */}
        <TabsContent value="position-matrix">
          <PositionMatrixTab
            entities={entities}
            divisions={divisions}
            positions={positions}
            components={components.filter(
              (c) => c.type === "earning" &&
                !["BASIC","GAPOK","GAJI_POKOK"].includes((c.code ?? "").toUpperCase()) &&
                !c.name?.toLowerCase().includes("gaji pokok")
            )}
            loading={posLoading || compLoading || eligLoading}
            isEligible={isEligible}
            toggleEligibility={toggleEligibility}
          />
        </TabsContent>

        {/* Salary Matrix Tab */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Gaji per Grade</CardTitle>
            </CardHeader>
            <CardContent>
              {gradeLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : jobGrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Buat Job Grade terlebih dahulu</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Grade</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Step 1</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Step 2</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Step 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobGrades.map((grade) => (
                        <tr key={grade.id} className="border-b border-border/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-foreground">{grade.name}</p>
                              <p className="text-xs text-muted-foreground">{grade.code}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-foreground">
                            {grade.min_salary
                              ? `Rp ${Number(grade.min_salary).toLocaleString("id-ID")}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-center text-foreground">-</td>
                          <td className="py-3 px-4 text-center text-foreground">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOPP Formula Tab */}
        <TabsContent value="bopp">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              BOPP Formula configuration coming soon...
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cut-off & Periode Tab */}
        <TabsContent value="cutoff" className="mt-4">
          <CutoffTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Position Matrix ──────────────────────────────────────────────────────────

const GRADE_COLORS: Record<number, string> = {
  1: "bg-red-500/10 text-red-600",
  2: "bg-red-500/10 text-red-600",
  3: "bg-orange-500/10 text-orange-600",
  4: "bg-amber-500/10 text-amber-600",
  5: "bg-yellow-500/10 text-yellow-700",
  6: "bg-emerald-500/10 text-emerald-600",
  7: "bg-blue-500/10 text-blue-600",
  8: "bg-indigo-500/10 text-indigo-600",
  9: "bg-purple-500/10 text-purple-600",
  10: "bg-slate-500/10 text-slate-500",
}

function PositionMatrixTab({
  entities,
  divisions,
  positions,
  components,
  loading,
  isEligible,
  toggleEligibility,
}: {
  entities: any[]
  divisions: any[]
  positions: any[]
  components: any[]
  loading: boolean
  isEligible: (positionId: string, componentId: string) => boolean
  toggleEligibility: (positionId: string, componentId: string, eligible: boolean) => Promise<void>
}) {
  const [filterEntity, setFilterEntity] = useState("__all__")
  const [filterDivision, setFilterDivision] = useState("__all__")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  // localChecked: "posId_compId" → boolean (draft state saat edit mode)
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({})
  const [snapshot, setSnapshot] = useState<Record<string, boolean>>({})

  const filteredDivisions = useMemo(() => {
    if (filterEntity === "__all__") return divisions
    return divisions.filter((d) => {
      const dept = Array.isArray(d.departments) ? d.departments[0] : d.departments
      return String(dept?.entity_id) === filterEntity
    })
  }, [divisions, filterEntity])

  const filteredPositions = useMemo(() => {
    let result = positions
    if (filterEntity !== "__all__") {
      result = result.filter((p) => String(p.entity_id) === filterEntity)
    }
    return [...result].sort((a, b) => {
      const la = a.hr_job_grades?.level ?? a.level ?? 99
      const lb = b.hr_job_grades?.level ?? b.level ?? 99
      return la - lb
    })
  }, [positions, filterEntity])

  const handleEdit = () => {
    const draft: Record<string, boolean> = {}
    filteredPositions.forEach((pos) => {
      components.forEach((comp) => {
        draft[`${pos.id}_${comp.id}`] = isEligible(pos.id, comp.id)
      })
    })
    setLocalChecked(draft)
    setSnapshot({ ...draft })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setLocalChecked(snapshot)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const promises: Promise<void>[] = []
      Object.entries(localChecked).forEach(([key, val]) => {
        const [posId, compId] = key.split("_")
        const current = isEligible(posId, compId)
        if (val !== current) {
          promises.push(toggleEligibility(posId, compId, val))
        }
      })
      await Promise.all(promises)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const getChecked = (posId: string, compId: string) =>
    isEditing ? (localChecked[`${posId}_${compId}`] ?? false) : isEligible(posId, compId)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Memuat matrix jabatan...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Matrix Jabatan &amp; Tunjangan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Centang tunjangan yang berlaku untuk setiap jabatan. Jika tidak dicentang, jabatan tersebut tidak mendapat tunjangan tersebut saat generate payroll.
              </p>
            </div>

            {/* Action buttons — top right */}
            <div className="flex items-center gap-2 shrink-0">
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  className="gap-1.5 border-border text-foreground hover:bg-muted"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={saving}
                    className="text-muted-foreground"
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {saving
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menyimpan...</>
                      : <><CheckCircle2 className="w-3.5 h-3.5" />Simpan</>
                    }
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setFilterDivision("__all__") }}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Semua Entitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Entitas</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.code} — {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={filterDivision} onValueChange={setFilterDivision}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Semua Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Divisi</SelectItem>
                  {filteredDivisions.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterEntity !== "__all__" || filterDivision !== "__all__") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground gap-1"
                onClick={() => { setFilterEntity("__all__"); setFilterDivision("__all__") }}
              >
                <X className="w-3 h-3" />Reset
              </Button>
            )}

            <span className="text-xs text-muted-foreground ml-auto">
              {filteredPositions.length} jabatan
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredPositions.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Tidak ada jabatan ditemukan</p>
          </div>
        ) : components.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Belum ada komponen tunjangan. Tambahkan di tab <strong>Komponen Gaji</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/40 z-10 min-w-[220px]">
                    Jabatan
                  </th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground whitespace-nowrap w-20">
                    Level
                  </th>
                  {components.map((comp) => (
                    <th key={comp.id} className="text-center py-3 px-3 font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">
                      <div className="text-xs">{comp.name}</div>
                      <div className="text-[10px] font-normal text-muted-foreground/60 font-mono">{comp.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((pos) => {
                  const grade = pos.hr_job_grades
                  const gradeLevel = grade?.level ?? pos.level ?? null
                  const gradeColor = GRADE_COLORS[gradeLevel] ?? "bg-muted text-muted-foreground"

                  return (
                    <tr key={pos.id} className="border-b border-border/50 hover:bg-muted/20">
                      {/* Jabatan */}
                      <td className="py-3 px-4 sticky left-0 bg-background z-10">
                        <div>
                          <p className="font-medium text-foreground leading-tight">{pos.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{pos.code}</p>
                        </div>
                      </td>

                      {/* Grade/Level badge */}
                      <td className="py-3 px-3 text-center">
                        {grade ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${gradeColor}`}>
                            {grade.code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </td>

                      {/* Checkbox per komponen */}
                      {components.map((comp) => {
                        const key = `${pos.id}_${comp.id}`
                        const checked = getChecked(pos.id, comp.id)

                        return (
                          <td key={comp.id} className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                if (!isEditing) return
                                setLocalChecked((prev) => ({ ...prev, [key]: !prev[key] }))
                              }}
                              disabled={saving}
                              className={[
                                "w-5 h-5 rounded border-2 transition-all mx-auto flex items-center justify-center",
                                checked
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-border bg-background",
                                isEditing && !saving
                                  ? "cursor-pointer hover:border-emerald-400"
                                  : "cursor-default",
                                saving ? "opacity-50" : "",
                              ].join(" ")}
                              title={isEditing ? (checked ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan") : undefined}
                            >
                              {checked && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 bg-emerald-500 border-emerald-500 inline-block" />
            Mendapat tunjangan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-border inline-block" />
            Tidak mendapat tunjangan
          </span>
          <span className="ml-auto">
            {isEditing
              ? "✏️ Mode edit — centang/hapus centang, lalu klik Simpan"
              : "Klik Edit untuk mengubah eligibilitas tunjangan"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Allowance Matrix Grid ────────────────────────────────────────────────────

/** Parse raw number string → integer (strip non-digits) */
function parseAmount(raw: string): number {
  const n = parseInt(raw.replace(/\D/g, ""), 10)
  return isNaN(n) ? 0 : n
}

/** Format number as "Rp 1.000.000" */
function displayIDR(val: number): string {
  if (!val) return "—"
  return "Rp " + new Intl.NumberFormat("id-ID").format(val)
}

/** Format input string (digits only) as "1.000.000" while typing */
function formatInput(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  return new Intl.NumberFormat("id-ID").format(parseInt(digits, 10))
}

function AllowanceMatrixTab({
  jobGrades,
  components,
  matrix,
  loading,
  upsertEntry,
}: {
  jobGrades: any[]
  components: any[]
  matrix: any[]
  loading: boolean
  upsertEntry: (gradeId: string, componentId: string, amount: number) => Promise<any>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  // cellValues: "gradeId_componentId" → formatted display string (digits + separators)
  const [cellValues, setCellValues] = useState<Record<string, string>>({})
  // snapshot when edit mode starts, for cancel
  const [snapshot, setSnapshot] = useState<Record<string, string>>({})

  const initialized = useRef(false)

  // Build initial cell values from DB matrix
  const buildValues = () => {
    const init: Record<string, string> = {}
    matrix.forEach((e) => {
      const key = `${e.job_grade_id}_${e.salary_component_id}`
      if (e.amount > 0) init[key] = formatInput(String(Math.round(e.amount)))
    })
    return init
  }

  if (!loading && !initialized.current) {
    initialized.current = true
    setCellValues(buildValues())
  }

  // Exclude "Gaji Pokok" — salary is managed in Salary Matrix tab
  const allowanceComponents = components.filter(
    (c) => !["BASIC", "GAPOK", "GAJI_POKOK"].includes((c.code ?? "").toUpperCase()) &&
            !c.name?.toLowerCase().includes("gaji pokok")
  )

  const sortedGrades = [...jobGrades].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))

  const handleEdit = () => {
    const vals = buildValues()
    setCellValues(vals)
    setSnapshot(vals)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setCellValues(snapshot)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const promises: Promise<any>[] = []
      sortedGrades.forEach((grade) => {
        allowanceComponents.forEach((comp) => {
          const key = `${grade.id}_${comp.id}`
          const amount = parseAmount(cellValues[key] ?? "")
          const existing = matrix.find(
            (e) => e.job_grade_id === grade.id && e.salary_component_id === comp.id
          )
          const existingAmount = existing ? Math.round(existing.amount) : 0
          // Only upsert if changed
          if (amount !== existingAmount) {
            promises.push(upsertEntry(grade.id, comp.id, amount))
          }
        })
      })
      await Promise.all(promises)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Memuat matriks tunjangan...
        </CardContent>
      </Card>
    )
  }

  if (sortedGrades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Buat Job Grade terlebih dahulu di Master Data → Organization → Grade.
        </CardContent>
      </Card>
    )
  }

  if (allowanceComponents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Belum ada komponen tunjangan. Tambahkan di tab <strong>Komponen Gaji</strong> terlebih dahulu.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Matriks Tunjangan per Job Grade
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal default tunjangan per grade. Nilai ini menjadi acuan saat generate payroll dan bisa di-override per karyawan.
            </p>
          </div>

          {/* Action buttons — top right */}
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="gap-1.5 border-border text-foreground hover:bg-muted"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={saving}
                  className="text-muted-foreground"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menyimpan...</>
                    : <><CheckCircle2 className="w-3.5 h-3.5" />Simpan</>
                  }
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/40 z-10">
                  Job Grade
                </th>
                {allowanceComponents.map((comp) => (
                  <th
                    key={comp.id}
                    className="text-right py-3 px-4 font-medium text-muted-foreground whitespace-nowrap min-w-[160px]"
                  >
                    <div className="text-xs">{comp.name}</div>
                    <div className="text-[10px] font-normal text-muted-foreground/60 font-mono">{comp.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedGrades.map((grade) => (
                <tr key={grade.id} className="border-b border-border/50 hover:bg-muted/20">
                  {/* Grade label */}
                  <td className="py-3 px-4 sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {grade.level}
                      </span>
                      <div>
                        <p className="font-medium text-foreground leading-tight">{grade.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{grade.code}</p>
                      </div>
                    </div>
                  </td>

                  {/* Component cells */}
                  {allowanceComponents.map((comp) => {
                    const key = `${grade.id}_${comp.id}`
                    const val = cellValues[key] ?? ""
                    const amount = parseAmount(val)

                    return (
                      <td key={comp.id} className="py-2 px-4 text-right">
                        {isEditing ? (
                          /* Edit mode: formatted input */
                          <input
                            type="text"
                            inputMode="numeric"
                            value={val}
                            placeholder="0"
                            disabled={saving}
                            onChange={(e) => {
                              const formatted = formatInput(e.target.value)
                              setCellValues((prev) => ({ ...prev, [key]: formatted }))
                            }}
                            className={[
                              "w-full text-right text-sm rounded px-2 py-1.5 border transition-colors outline-none",
                              "bg-background text-foreground placeholder:text-muted-foreground/40",
                              "border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30",
                              saving ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}
                          />
                        ) : (
                          /* Read mode: formatted display */
                          <span className={amount > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}>
                            {displayIDR(amount)}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isEditing && (
          <p className="text-[11px] text-muted-foreground px-4 py-2.5 border-t border-border bg-amber-500/5">
            ✏️ Mode edit aktif — isi nominal dalam Rupiah, kosongkan untuk tidak memberikan tunjangan. Klik <strong>Simpan</strong> saat selesai.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Cut-off & Periode Tab ───────────────────────────────────────────────────

const CURRENT_YEAR  = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

interface CutoffFormState {
  paygroup_name: string
  att_cutoff_start_day: string
  att_cutoff_start_prev_month: boolean
  att_cutoff_end_day: string
  pay_cutoff_start_day: string
  pay_cutoff_start_prev_month: boolean
  pay_cutoff_end_day: string
  enable_prorata: boolean
  prorata_divisor: string
  notes: string
}

function emptyCutoffForm(): CutoffFormState {
  return {
    paygroup_name: "",
    att_cutoff_start_day: "21",
    att_cutoff_start_prev_month: true,
    att_cutoff_end_day: "20",
    pay_cutoff_start_day: "1",
    pay_cutoff_start_prev_month: false,
    pay_cutoff_end_day: "31",
    enable_prorata: true,
    prorata_divisor: "30",
    notes: "",
  }
}

function configToForm(c: PayrollCutoffConfig): CutoffFormState {
  return {
    paygroup_name: c.paygroup_name ?? "",
    att_cutoff_start_day: String(c.att_cutoff_start_day),
    att_cutoff_start_prev_month: c.att_cutoff_start_prev_month,
    att_cutoff_end_day: String(c.att_cutoff_end_day),
    pay_cutoff_start_day: String(c.pay_cutoff_start_day),
    pay_cutoff_start_prev_month: c.pay_cutoff_start_prev_month,
    pay_cutoff_end_day: String(c.pay_cutoff_end_day),
    enable_prorata: c.enable_prorata,
    prorata_divisor: String(c.prorata_divisor),
    notes: c.notes ?? "",
  }
}

function previewDates(form: CutoffFormState, year = CURRENT_YEAR, month = CURRENT_MONTH) {
  try {
    return computeCutoffDates({
      att_cutoff_start_day: Number(form.att_cutoff_start_day) || 21,
      att_cutoff_start_prev_month: form.att_cutoff_start_prev_month,
      att_cutoff_end_day: Number(form.att_cutoff_end_day) || 20,
      pay_cutoff_start_day: Number(form.pay_cutoff_start_day) || 1,
      pay_cutoff_start_prev_month: form.pay_cutoff_start_prev_month,
      pay_cutoff_end_day: Number(form.pay_cutoff_end_day) || 31,
    }, year, month)
  } catch { return null }
}

function CutoffConfigDialog({
  open, onClose, onSave, entityId, initialForm,
}: {
  open: boolean; onClose: () => void; onSave: (form: CutoffFormState) => Promise<void>
  entityId: string; initialForm: CutoffFormState
}) {
  const [form, setForm] = useState<CutoffFormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { setForm(initialForm); setErr(null) }, [open, initialForm])

  const p = (k: keyof CutoffFormState, v: any) => setForm((prev) => ({ ...prev, [k]: v }))
  const preview = previewDates(form)

  const handleSave = async () => {
    setSaving(true); setErr(null)
    try { await onSave(form); onClose() }
    catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Konfigurasi Cut-off</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {err && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{err}</p>}

          <div className="space-y-1.5">
            <Label>Nama Kelompok (Paygroup)</Label>
            <Input value={form.paygroup_name} onChange={(e) => p("paygroup_name", e.target.value)}
              placeholder="Kosongkan untuk berlaku ke semua karyawan" />
            <p className="text-xs text-muted-foreground">Contoh: Staff, Operator, Kasir</p>
          </div>

          {/* Attendance cut-off */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Periode Absensi</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mulai — hari ke-</Label>
                <Input type="number" min={1} max={31} value={form.att_cutoff_start_day}
                  onChange={(e) => p("att_cutoff_start_day", e.target.value)} />
                <div className="flex items-center gap-2">
                  <Switch size="sm" checked={form.att_cutoff_start_prev_month}
                    onCheckedChange={(v) => p("att_cutoff_start_prev_month", v)} />
                  <span className="text-xs text-muted-foreground">Bulan sebelumnya</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Selesai — hari ke-</Label>
                <Input type="number" min={1} max={31} value={form.att_cutoff_end_day}
                  onChange={(e) => p("att_cutoff_end_day", e.target.value)} />
                <p className="text-xs text-muted-foreground">Bulan ini</p>
              </div>
            </div>
          </div>

          {/* Payroll cut-off */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Periode Gaji</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mulai — hari ke-</Label>
                <Input type="number" min={1} max={31} value={form.pay_cutoff_start_day}
                  onChange={(e) => p("pay_cutoff_start_day", e.target.value)} />
                <div className="flex items-center gap-2">
                  <Switch size="sm" checked={form.pay_cutoff_start_prev_month}
                    onCheckedChange={(v) => p("pay_cutoff_start_prev_month", v)} />
                  <span className="text-xs text-muted-foreground">Bulan sebelumnya</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Selesai — hari ke- (31 = akhir bulan)</Label>
                <Input type="number" min={1} max={31} value={form.pay_cutoff_end_day}
                  onChange={(e) => p("pay_cutoff_end_day", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <p className="font-semibold text-emerald-400">Preview bulan ini ({CURRENT_YEAR}/{String(CURRENT_MONTH).padStart(2,"0")})</p>
              <p className="text-muted-foreground">Absensi: <strong className="text-foreground">{preview.attStart}</strong> s/d <strong className="text-foreground">{preview.attEnd}</strong></p>
              <p className="text-muted-foreground">Gaji: <strong className="text-foreground">{preview.payStart}</strong> s/d <strong className="text-foreground">{preview.payEnd}</strong></p>
            </div>
          )}

          {/* Prorata */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Prorata Karyawan Baru</p>
              <p className="text-xs text-muted-foreground">Gaji dihitung proporsional sesuai tanggal bergabung</p>
            </div>
            <Switch checked={form.enable_prorata} onCheckedChange={(v) => p("enable_prorata", v)} />
          </div>
          {form.enable_prorata && (
            <div className="space-y-1.5">
              <Label className="text-xs">Pembagi Prorata (hari)</Label>
              <Input type="number" min={1} max={31} value={form.prorata_divisor}
                onChange={(e) => p("prorata_divisor", e.target.value)} className="max-w-[120px]" />
              <p className="text-xs text-muted-foreground">Standard: 30 hari. Formula: Gaji ÷ {form.prorata_divisor || 30} × Hari Kerja dalam Periode</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OverrideDialog({
  open, onClose, onSave, entityId, year, month,
}: {
  open: boolean; onClose: () => void
  onSave: (data: Omit<PayrollPeriodOverride, "id" | "tenant_id">) => Promise<void>
  entityId: string; year: number; month: number
}) {
  const monthStart = `${year}-${String(month).padStart(2,"0")}-01`
  const monthEnd   = `${year}-${String(month).padStart(2,"0")}-${lastDayOfMonth(year, month)}`
  const [form, setForm] = useState({ attStart: monthStart, attEnd: monthEnd, payStart: monthStart, payEnd: monthEnd, reason: "" })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)
  useEffect(() => { setForm({ attStart: monthStart, attEnd: monthEnd, payStart: monthStart, payEnd: monthEnd, reason: "" }); setErr(null) }, [open])

  const handleSave = async () => {
    setSaving(true); setErr(null)
    try {
      await onSave({ entity_id: entityId, period_year: year, period_month: month, paygroup_name: null,
        attendance_start_date: form.attStart, attendance_end_date: form.attEnd,
        payroll_start_date: form.payStart, payroll_end_date: form.payEnd, reason: form.reason || null })
      onClose()
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Override Cut-off Bulan Ini</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {err && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Absensi Mulai</Label><Input type="date" value={form.attStart} onChange={(e) => setForm((p) => ({ ...p, attStart: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Absensi Selesai</Label><Input type="date" value={form.attEnd} onChange={(e) => setForm((p) => ({ ...p, attEnd: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Gaji Mulai</Label><Input type="date" value={form.payStart} onChange={(e) => setForm((p) => ({ ...p, payStart: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Gaji Selesai</Label><Input type="date" value={form.payEnd} onChange={(e) => setForm((p) => ({ ...p, payEnd: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Alasan Override</Label><Input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Contoh: Penyesuaian Lebaran" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CutoffTab() {
  const { entities } = useEntities()
  const { configs, overrides, loading, fetchConfigs, upsertConfig, deleteConfig, fetchOverrides, upsertOverride, deleteOverride } = usePayrollCutoffConfig()

  const [entityId, setEntityId] = useState<string>("")
  const [overrideYear, setOverrideYear]   = useState(CURRENT_YEAR)
  const [overrideMonth, setOverrideMonth] = useState(CURRENT_MONTH)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PayrollCutoffConfig | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  useEffect(() => {
    if (!entityId) return
    fetchConfigs(entityId)
  }, [entityId]) // eslint-disable-line

  useEffect(() => {
    if (!entityId) return
    fetchOverrides(entityId, overrideYear, overrideMonth)
  }, [entityId, overrideYear, overrideMonth]) // eslint-disable-line

  const entityConfigs = configs.filter((c) => c.entity_id === entityId)
  const monthOverrides = overrides.filter(
    (o) => o.entity_id === entityId && o.period_year === overrideYear && o.period_month === overrideMonth
  )

  const handleSaveConfig = async (form: CutoffFormState) => {
    await upsertConfig({
      entity_id: entityId,
      paygroup_name: form.paygroup_name || null,
      att_cutoff_start_day: Number(form.att_cutoff_start_day),
      att_cutoff_start_prev_month: form.att_cutoff_start_prev_month,
      att_cutoff_end_day: Number(form.att_cutoff_end_day),
      pay_cutoff_start_day: Number(form.pay_cutoff_start_day),
      pay_cutoff_start_prev_month: form.pay_cutoff_start_prev_month,
      pay_cutoff_end_day: Number(form.pay_cutoff_end_day),
      enable_prorata: form.enable_prorata,
      prorata_divisor: Number(form.prorata_divisor) || 30,
      is_default: true,
      status: "active",
      notes: form.notes || null,
    })
    setEditingConfig(null)
  }

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]

  return (
    <div className="space-y-6">
      {actionErr && <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{actionErr}</div>}

      {/* Entity selector */}
      <div className="max-w-sm space-y-1.5">
        <Label>Entitas</Label>
        <Select value={entityId || undefined} onValueChange={setEntityId}>
          <SelectTrigger><SelectValue placeholder="Pilih entitas..." /></SelectTrigger>
          <SelectContent>{entities.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {entityId && (
        <>
          {/* ── Recurring Config ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-500" /> Konfigurasi Cut-off Berulang
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Berlaku setiap bulan kecuali ada override</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditingConfig(null); setConfigDialogOpen(true) }}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Memuat...</span>
                </div>
              ) : entityConfigs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                  Belum ada konfigurasi — klik <strong>Tambah</strong> untuk membuat aturan cut-off
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-3 font-semibold text-foreground">Kelompok</th>
                      <th className="py-2 px-3 font-semibold text-foreground">Absensi</th>
                      <th className="py-2 px-3 font-semibold text-foreground">Gaji</th>
                      <th className="py-2 px-3 font-semibold text-foreground text-center">Prorata</th>
                      <th className="py-2 px-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {entityConfigs.map((cfg) => {
                      const preview = computeCutoffDates(cfg, CURRENT_YEAR, CURRENT_MONTH)
                      return (
                        <tr key={cfg.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-3 px-3">
                            <span className="font-medium text-foreground">{cfg.paygroup_name ?? "Semua"}</span>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">
                            <div>{cutoffLabel(cfg.att_cutoff_start_day, cfg.att_cutoff_start_prev_month, cfg.att_cutoff_end_day)}</div>
                            <div className="text-foreground/60">{preview.attStart} – {preview.attEnd}</div>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">
                            <div>{cutoffLabel(cfg.pay_cutoff_start_day, cfg.pay_cutoff_start_prev_month, cfg.pay_cutoff_end_day)}</div>
                            <div className="text-foreground/60">{preview.payStart} – {preview.payEnd}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {cfg.enable_prorata
                              ? <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">÷{cfg.prorata_divisor} hari</Badge>
                              : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => { setEditingConfig(cfg); setConfigDialogOpen(true) }}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400"
                                onClick={async () => { try { await deleteConfig(cfg.id) } catch(e: any) { setActionErr(e.message) } }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* ── Override Per Bulan ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Override Per Bulan</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Untuk penyesuaian khusus (Lebaran, dll.)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={String(overrideMonth)} onValueChange={(v) => setOverrideMonth(Number(v))}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTH_LABELS.map((l,i) => <SelectItem key={i+1} value={String(i+1)}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" value={overrideYear} onChange={(e) => setOverrideYear(Number(e.target.value))} className="w-20 h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={() => setOverrideDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Override
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthOverrides.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Tidak ada override untuk bulan ini</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-3 font-semibold text-foreground">Kelompok</th>
                      <th className="py-2 px-3 font-semibold text-foreground">Absensi Override</th>
                      <th className="py-2 px-3 font-semibold text-foreground">Gaji Override</th>
                      <th className="py-2 px-3 font-semibold text-foreground">Alasan</th>
                      <th className="py-2 px-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {monthOverrides.map((ovr) => (
                      <tr key={ovr.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-3 px-3 text-foreground">{ovr.paygroup_name ?? "Semua"}</td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">{ovr.attendance_start_date} – {ovr.attendance_end_date}</td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">{ovr.payroll_start_date} – {ovr.payroll_end_date}</td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">{ovr.reason ?? "—"}</td>
                        <td className="py-3 px-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            onClick={async () => { try { await deleteOverride(ovr.id) } catch(e: any) { setActionErr((e as any).message) } }}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!entityId && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
          Pilih entitas untuk mengatur konfigurasi cut-off
        </div>
      )}

      <CutoffConfigDialog
        open={configDialogOpen}
        onClose={() => { setConfigDialogOpen(false); setEditingConfig(null) }}
        onSave={handleSaveConfig}
        entityId={entityId}
        initialForm={editingConfig ? configToForm(editingConfig) : emptyCutoffForm()}
      />
      <OverrideDialog
        open={overrideDialogOpen}
        onClose={() => setOverrideDialogOpen(false)}
        onSave={async (data) => { await upsertOverride(data) }}
        entityId={entityId}
        year={overrideYear}
        month={overrideMonth}
      />
    </div>
  )
}
