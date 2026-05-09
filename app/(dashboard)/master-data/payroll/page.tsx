"use client"

import { useState, useRef, useMemo } from "react"
import { Plus, Wallet, Calculator, Percent, Pencil, Trash2, Loader2, CheckCircle2, X, Building2, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSalaryComponents } from "@/hooks/useSalaryComponents"
import { useJobGrades } from "@/hooks/useJobGrades"
import { useAllowanceMatrix } from "@/hooks/useAllowanceMatrix"
import { usePositionAllowanceEligibility } from "@/hooks/usePositionAllowanceEligibility"
import { usePositions } from "@/hooks/usePositions"
import { useEntities } from "@/hooks/useEntities"
import { useDivisions } from "@/hooks/useDivisions"
import { getTenantId } from "@/lib/tenant"

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
