"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Briefcase,
  ChevronDown,
  Layers,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDepartments } from "@/hooks/useDepartments"
import { useDivisions } from "@/hooks/useDivisions"
import { useJobGrades } from "@/hooks/useJobGrades"
import { usePositions } from "@/hooks/usePositions"
import { useEntities } from "@/hooks/useEntities"
import { useAuth } from "@/hooks/useAuth"
import { getTenantId } from "@/lib/tenant"
import {
  getDefaultOrganizationEntityId,
  setDefaultOrganizationEntityId,
  SUPERADMIN_ROLE_ALIASES,
} from "@/lib/organization-default-entity"
import { OrganizationInstansiDialog } from "@/components/master-data/organization-instansi-dialog"

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState("departments")
  const [actionError, setActionError] = useState<string | null>(null)
  const [departmentEntityFilter, setDepartmentEntityFilter] =
    useState("__all__")

  const { hasRole, loading: authLoading } = useAuth()
  const isSuperAdmin = hasRole(SUPERADMIN_ROLE_ALIASES)

  const [hydrated, setHydrated] = useState(false)
  const [defaultEntityId, setDefaultEntityId] = useState<string | null>(null)
  const [instansiDialogOpen, setInstansiDialogOpen] = useState(false)
  const [draftInstansiId, setDraftInstansiId] = useState("")

  useEffect(() => {
    setDefaultEntityId(getDefaultOrganizationEntityId())
    setHydrated(true)
  }, [])

  const { entities, loading: entitiesLoading } = useEntities()

  const skipOrgScopeFetch = Boolean(
    isSuperAdmin && hydrated && !defaultEntityId
  )
  const deptEntityFilter =
    isSuperAdmin && defaultEntityId ? defaultEntityId : undefined

  const {
    departments,
    loading: deptLoading,
    deleteDepartment,
    fetchDepartments,
  } = useDepartments(getTenantId(), {
    entityId: deptEntityFilter,
    skipFetch: skipOrgScopeFetch,
  })

  const {
    divisions,
    loading: divLoading,
    deleteDivision,
    fetchDivisions,
  } = useDivisions(getTenantId(), {
    departmentEntityId: deptEntityFilter,
    skipFetch: skipOrgScopeFetch,
  })

  const {
    positions,
    loading: posLoading,
    deletePosition,
    fetchPositions,
  } = usePositions(getTenantId(), {
    entityId: deptEntityFilter,
    skipFetch: skipOrgScopeFetch,
  })

  const { jobGrades, loading: gradeLoading, deleteJobGrade, fetchJobGrades } =
    useJobGrades()

  /** SuperAdmin tanpa instansi tersimpan: dialog wajib setelah daftar entity selesai dimuat */
  useEffect(() => {
    if (!hydrated || authLoading || !isSuperAdmin) return
    if (defaultEntityId) return
    if (entitiesLoading) return
    setDraftInstansiId((prev) => {
      if (prev) return prev
      return entities[0] ? String(entities[0].id) : ""
    })
    setInstansiDialogOpen(true)
  }, [hydrated, authLoading, isSuperAdmin, defaultEntityId, entitiesLoading, entities])

  const activeEntityLabel = defaultEntityId
    ? entities.find((e) => String(e.id) === defaultEntityId)
    : undefined

  const handleConfirmInstansi = () => {
    if (!draftInstansiId) return
    setDefaultOrganizationEntityId(draftInstansiId)
    setDefaultEntityId(draftInstansiId)
    setInstansiDialogOpen(false)
  }

  const handleOpenChangeInstansi = (open: boolean) => {
    const mandatory = Boolean(isSuperAdmin && !defaultEntityId)
    if (!open && mandatory) return
    setInstansiDialogOpen(open)
    if (open && defaultEntityId) {
      setDraftInstansiId(defaultEntityId)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Hapus departemen ini?")) return
    setActionError(null)
    try {
      await deleteDepartment(id)
      await fetchDepartments()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus departemen")
    }
  }

  const handleDeleteGrade = async (id: string) => {
    if (!confirm("Hapus grade ini?")) return
    setActionError(null)
    try {
      await deleteJobGrade(id)
      await fetchJobGrades()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus grade")
    }
  }

  const handleDeleteDivision = async (id: string) => {
    if (!confirm("Hapus divisi ini?")) return
    setActionError(null)
    try {
      await deleteDivision(id)
      await fetchDivisions()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus divisi")
    }
  }

  const handleDeletePosition = async (id: string) => {
    if (!confirm("Hapus job title / jabatan ini?")) return
    setActionError(null)
    try {
      await deletePosition(id)
      await fetchPositions()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Gagal menghapus jabatan"
      )
    }
  }

  const deptRow = (div: (typeof divisions)[0]) => {
    const d = div.departments
    return Array.isArray(d) ? d[0] : d
  }

  const filteredDepartments = departments.filter((dept) => {
    if (departmentEntityFilter === "__all__") return true
    if (departmentEntityFilter === "__global__") return !dept.entity_id
    return String(dept.entity_id) === departmentEntityFilter
  })

  const showInstansiBanner = isSuperAdmin && Boolean(defaultEntityId)

  return (
    <div className="space-y-6">
      <OrganizationInstansiDialog
        open={instansiDialogOpen}
        onOpenChange={handleOpenChangeInstansi}
        entities={entities}
        entitiesLoading={entitiesLoading}
        value={draftInstansiId}
        onValueChange={setDraftInstansiId}
        onConfirm={handleConfirmInstansi}
        mandatory={Boolean(isSuperAdmin && !defaultEntityId)}
      />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Struktur Organisasi</h1>
        <p className="text-muted-foreground mt-1">
          Kelola departemen, divisi, jabatan, dan grade
        </p>
      </div>

      {showInstansiBanner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <div className="text-sm text-foreground">
            <span className="text-muted-foreground">Instansi aktif: </span>
            <span className="font-medium text-emerald-300">
              {activeEntityLabel
                ? `${activeEntityLabel.code} — ${activeEntityLabel.name}`
                : defaultEntityId}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border bg-card text-foreground hover:bg-muted"
            onClick={() => {
              setDraftInstansiId(defaultEntityId ?? "")
              setInstansiDialogOpen(true)
            }}
          >
            <ChevronDown className="mr-1 h-4 w-4" />
            Ubah instansi
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {actionError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {actionError}
          </div>
        )}
        <TabsList className="flex flex-wrap gap-1 bg-card border border-border h-auto p-1">
          <TabsTrigger value="departments" className="data-[state=active]:bg-emerald-600">
            Departemen
          </TabsTrigger>
          <TabsTrigger value="divisions" className="data-[state=active]:bg-emerald-600">
            Divisi
          </TabsTrigger>
          <TabsTrigger value="positions" className="data-[state=active]:bg-emerald-600">
            Job title
          </TabsTrigger>
          <TabsTrigger value="grades" className="data-[state=active]:bg-emerald-600">
            Grade
          </TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                Departemen
              </CardTitle>
              <Link href="/master-data/organization/department/new">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSuperAdmin && !defaultEntityId}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Filter daftar departemen berdasarkan entitas
                </div>
                <Select
                  value={departmentEntityFilter}
                  onValueChange={setDepartmentEntityFilter}
                >
                  <SelectTrigger className="w-full sm:w-72 bg-background border-border text-foreground">
                    <SelectValue placeholder="Pilih entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Semua entitas</SelectItem>
                    <SelectItem value="__global__">Global (tanpa entitas)</SelectItem>
                    {entities.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>
                        {ent.code} — {ent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {skipOrgScopeFetch || deptLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredDepartments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada departemen
                  {isSuperAdmin && defaultEntityId && (
                    <span className="block text-xs mt-2 text-muted-foreground">
                      untuk instansi yang dipilih
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDepartments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <span className="text-emerald-500 font-medium">
                            {dept.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{dept.name}</p>
                          <p className="text-sm text-muted-foreground">{dept.code}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {entitiesLoading
                              ? "Loading entity..."
                              : dept.entity_id
                                ? entities.find((e) => e.id === dept.entity_id)?.name ??
                                  "Unknown entity"
                                : "Global"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            dept.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {dept.status}
                        </Badge>
                        <Link href={`/master-data/organization/department/${dept.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-400"
                          onClick={() => handleDeleteDepartment(dept.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Divisions Tab */}
        <TabsContent value="divisions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                Divisi
              </CardTitle>
              <Link href="/master-data/organization/division/new">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSuperAdmin && !defaultEntityId}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {skipOrgScopeFetch || divLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : divisions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada divisi
                  {isSuperAdmin && defaultEntityId && (
                    <span className="block text-xs mt-2 text-muted-foreground">
                      untuk instansi yang dipilih
                    </span>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Kode
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Nama
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Departemen
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Instansi
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {divisions.map((div) => {
                        const d = deptRow(div)
                        const entId = d?.entity_id
                        const entLabel = entId
                          ? entities.find((e) => e.id === entId)
                          : null
                        return (
                          <tr
                            key={div.id}
                            className="border-b border-border/50 hover:bg-muted/30"
                          >
                            <td className="py-3 px-4 font-medium text-foreground">
                              {div.code}
                            </td>
                            <td className="py-3 px-4 text-foreground">{div.name}</td>
                            <td className="py-3 px-4 text-foreground">
                              {d ? `${d.code} — ${d.name}` : "—"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {entitiesLoading
                                ? "…"
                                : entLabel
                                  ? `${entLabel.code} — ${entLabel.name}`
                                  : entId
                                    ? "Unknown"
                                    : "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={
                                  div.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-muted text-muted-foreground"
                                }
                              >
                                {div.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Link
                                  href={`/master-data/organization/division/${div.id}/edit`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-400"
                                  onClick={() => handleDeleteDivision(div.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job titles (hr_positions) */}
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                Job title
              </CardTitle>
              <Link href="/master-data/organization/position/new">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSuperAdmin && !defaultEntityId}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {skipOrgScopeFetch || posLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada job title
                  {isSuperAdmin && defaultEntityId && (
                    <span className="block text-xs mt-2 text-muted-foreground">
                      untuk instansi yang dipilih
                    </span>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Kode
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Nama
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Level
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Instansi
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => {
                        const entLabel = pos.entity_id
                          ? entities.find((e) => e.id === pos.entity_id)
                          : null
                        return (
                          <tr
                            key={pos.id}
                            className="border-b border-border/50 hover:bg-muted/30"
                          >
                            <td className="py-3 px-4 font-medium text-foreground">
                              {pos.code}
                            </td>
                            <td className="py-3 px-4 text-foreground">{pos.name}</td>
                            <td className="py-3 px-4 text-center text-muted-foreground">
                              {(pos as any).hr_job_grades?.level ?? pos.level ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {entitiesLoading
                                ? "…"
                                : entLabel
                                  ? `${entLabel.code} — ${entLabel.name}`
                                  : pos.entity_id
                                    ? "Unknown"
                                    : "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={
                                  pos.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-muted text-muted-foreground"
                                }
                              >
                                {pos.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Link
                                  href={`/master-data/organization/position/${pos.id}/edit`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-400"
                                  onClick={() => handleDeletePosition(pos.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Job Grades</CardTitle>
              <Link href="/master-data/organization/grade/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Grade
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {gradeLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : jobGrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada job grade
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Kode
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Nama
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Level
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Gaji Min
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Gaji Max
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobGrades.map((grade) => (
                        <tr
                          key={grade.id}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <td className="py-3 px-4 text-foreground font-medium">{grade.code}</td>
                          <td className="py-3 px-4 text-foreground">{grade.name}</td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground">Level {grade.level}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-foreground">
                            {grade.min_salary
                              ? `Rp ${Number(grade.min_salary).toLocaleString("id-ID")}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-right text-foreground">
                            {grade.max_salary
                              ? `Rp ${Number(grade.max_salary).toLocaleString("id-ID")}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              className={
                                grade.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {grade.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/master-data/organization/grade/${grade.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-400"
                                onClick={() => handleDeleteGrade(grade.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
