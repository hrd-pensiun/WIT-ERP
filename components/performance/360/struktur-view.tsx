"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, Loader2, User } from "lucide-react"
import { ORG_SCOPE_FILTER_ALL, useOrgScopeFilters } from "@/components/performance/360/org-scope-filters"
import { FilterBar } from "@/components/ui/filter-bar"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployees } from "@/hooks/useEmployees"
import { usePerformance360RaterSettings } from "@/hooks/usePerformance360RaterSettings"
import { displayName, suggestPeerRaters, suggestSubordinateRaters } from "@/lib/performance360-raters"
import { getTenantId } from "@/lib/tenant"
import { cn } from "@/lib/utils"

type OrgNodeType = "department" | "division" | "employee"

export type OrgNodeData = {
  id: string
  name: string
  role: string
  nodeType: OrgNodeType
  profileId?: string
  children?: OrgNodeData[]
}

function positionLabel(e: { hr_positions?: { name?: string } | null }) {
  return e.hr_positions?.name?.trim() || "—"
}

/** Entitas: dari kolom profil atau dari departemen (jika entity_id pegawai kosong). */
function matchesOrgEntityFilter(
  e: {
    entity_id?: string | null
    departments?: { entity_id?: string | null } | null
  },
  entityId: string
) {
  if (e.entity_id && e.entity_id === entityId) return true
  const fromDept = e.departments?.entity_id
  return fromDept != null && fromDept === entityId
}

/** Hierarki dari data aktual: Departemen → Divisi → Karyawan (user_profiles + relasi master). */
function buildOrgTreeFromEmployees(employees: any[]): OrgNodeData[] {
  if (!employees.length) return []

  const byDept = new Map<string, any[]>()
  for (const e of employees) {
    const dk = e.department_id ?? "__none__"
    if (!byDept.has(dk)) byDept.set(dk, [])
    byDept.get(dk)!.push(e)
  }

  const deptKeys = [...byDept.keys()].sort((a, b) => {
    const nameA = byDept.get(a)![0]?.departments?.name ?? ""
    const nameB = byDept.get(b)![0]?.departments?.name ?? ""
    return String(nameA).localeCompare(String(nameB), "id")
  })

  const roots: OrgNodeData[] = []

  for (const dk of deptKeys) {
    const list = byDept.get(dk)!
    const deptName =
      list[0]?.departments?.name?.trim() ||
      (dk === "__none__" ? "Tanpa departemen" : "Departemen")

    const byDiv = new Map<string, typeof list>()
    for (const e of list) {
      const vk = e.division_id ?? "__none__"
      if (!byDiv.has(vk)) byDiv.set(vk, [])
      byDiv.get(vk)!.push(e)
    }

    const divKeys = [...byDiv.keys()].sort((a, b) => {
      const nameA = byDiv.get(a)![0]?.divisions?.name ?? ""
      const nameB = byDiv.get(b)![0]?.divisions?.name ?? ""
      return String(nameA).localeCompare(String(nameB), "id")
    })

    const divChildren: OrgNodeData[] = []

    for (const vk of divKeys) {
      const divList = byDiv.get(vk)!
      const divName =
        divList[0]?.divisions?.name?.trim() ||
        (vk === "__none__" ? "Tanpa divisi" : "Divisi")

      const empNodes: OrgNodeData[] = [...divList]
        .sort((a, b) =>
          String(a.full_name ?? "").localeCompare(String(b.full_name ?? ""), "id")
        )
        .map((e) => ({
          id: `emp-${e.id}`,
          name: String(e.full_name ?? "—"),
          role: positionLabel(e),
          nodeType: "employee" as const,
          profileId: e.id as string,
          children: [],
        }))

      divChildren.push({
        id: `div-${dk}-${vk}`,
        name: divName,
        role: "Divisi",
        nodeType: "division",
        children: empNodes,
      })
    }

    roots.push({
      id: `dept-${dk}`,
      name: deptName,
      role: "Departemen",
      nodeType: "department",
      children: divChildren,
    })
  }

  return roots
}

function OrgTreeNode({
  node,
  depth,
  expanded,
  toggle,
  onAssignEmployee,
}: {
  node: OrgNodeData
  depth: number
  expanded: Set<string>
  toggle: (id: string) => void
  onAssignEmployee: (profileId: string, name: string, role: string) => void
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isOpen = expanded.has(node.id)
  const isEmployee = node.nodeType === "employee"

  return (
    <li className="list-none">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-lg border /80 px-3 py-2.5",
          depth > 0 && "ml-2 border-l-2 border-l-emerald-500/30 pl-4",
          isEmployee && "bg-background/50"
        )}
      >
        <div className="flex items-start gap-2 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-expanded={isOpen}
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", !isOpen && "-rotate-90")} />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <User
            className={cn(
              "w-4 h-4 shrink-0 mt-0.5",
              node.nodeType === "department"
                ? "text-amber-400"
                : node.nodeType === "division"
                  ? "text-violet-400"
                  : "text-cyan-400"
            )}
          />
          <div className="min-w-0">
            <div className="text-foreground font-medium truncate">{node.name}</div>
            <div className="text-xs text-muted-foreground">{node.role}</div>
          </div>
        </div>
        {isEmployee && node.profileId ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-emerald-500/40 text-emerald-400 shrink-0"
            onClick={() => onAssignEmployee(node.profileId!, node.name, node.role)}
          >
            Atur penilai
          </Button>
        ) : null}
      </div>
      {hasChildren && isOpen ? (
        <ul className="mt-2 space-y-2 pl-2">
          {node.children!.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              onAssignEmployee={onAssignEmployee}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function collectExpandableIds(nodes: OrgNodeData[]): Set<string> {
  const ids = new Set<string>()
  const walk = (list: OrgNodeData[]) => {
    for (const n of list) {
      if (n.nodeType !== "employee") ids.add(n.id)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return ids
}

export function Struktur360View() {
  const tenantId = getTenantId()
  const scope = useOrgScopeFilters()
  const { employees, loading, error, fetchEmployees } = useEmployees(tenantId, {
    pollInterval: 30_000,
  })
  const {
    loading: settingsLoading,
    error: settingsError,
    getByRatee,
    upsert: upsertRaterSettings,
    clearError: clearSettingsError,
  } = usePerformance360RaterSettings(tenantId)

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [perms, setPerms] = useState({
    self: true,
    manager: true,
    peer: true,
    subordinate: true,
  })
  const [managerId, setManagerId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (scope.departmentId) {
      void fetchEmployees({ status: "active", department_id: scope.departmentId })
    } else {
      void fetchEmployees({ status: "active" })
    }
  }, [scope.departmentId, fetchEmployees])

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (scope.entityId && !matchesOrgEntityFilter(e, scope.entityId)) return false
      if (scope.departmentId && e.department_id !== scope.departmentId) return false
      if (scope.divisionId && e.division_id !== scope.divisionId) return false
      return true
    })
  }, [employees, scope.entityId, scope.departmentId, scope.divisionId])

  const orgTree = useMemo(
    () => buildOrgTreeFromEmployees(filteredEmployees),
    [filteredEmployees]
  )

  useEffect(() => {
    setExpanded(collectExpandableIds(orgTree))
  }, [orgTree])

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onAssignEmployee = useCallback((profileId: string, name: string, role: string) => {
    setSelectedProfileId(profileId)
    setSelectedName(name)
    setSelectedRole(role)
    setPerms({ self: true, manager: true, peer: true, subordinate: true })
    setManagerId("")
    clearSettingsError()
    setDialogOpen(true)
  }, [clearSettingsError])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setSelectedProfileId(null)
    setSelectedName("")
    setSelectedRole("")
    setManagerId("")
    clearSettingsError()
  }, [clearSettingsError])

  const ratee = useMemo(
    () => (selectedProfileId ? filteredEmployees.find((e) => e.id === selectedProfileId) : undefined),
    [filteredEmployees, selectedProfileId]
  )

  const managerCandidates = useMemo(() => {
    return filteredEmployees.filter((e) => e.id !== selectedProfileId)
  }, [filteredEmployees, selectedProfileId])

  const resolvedManager = useMemo(() => {
    if (!managerId) return null
    return filteredEmployees.find((e) => e.id === managerId) ?? employees.find((e) => e.id === managerId) ?? null
  }, [managerId, filteredEmployees, employees])

  const peerPreview = useMemo(() => {
    if (!ratee) return []
    return suggestPeerRaters(ratee, filteredEmployees)
  }, [ratee, filteredEmployees])

  const subPreview = useMemo(() => {
    if (!ratee) return { list: [] as Record<string, unknown>[], source: "heuristic" as const }
    return suggestSubordinateRaters(
      ratee as Record<string, unknown> & { reports_to_profile_id?: string | null },
      filteredEmployees
    )
  }, [ratee, filteredEmployees])

  useEffect(() => {
    if (!dialogOpen || !selectedProfileId) return
    let cancelled = false
    ;(async () => {
      const row = await getByRatee(selectedProfileId)
      if (cancelled) return
      if (row) {
        setPerms({
          self: row.allow_self,
          manager: row.allow_manager,
          peer: row.allow_peer,
          subordinate: row.allow_subordinate,
        })
        setManagerId(row.direct_manager_user_profile_id ?? "")
      } else {
        setPerms({ self: true, manager: true, peer: true, subordinate: true })
        setManagerId("")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dialogOpen, selectedProfileId, getByRatee])

  const handleSave = useCallback(async () => {
    if (!selectedProfileId) return
    setSaving(true)
    clearSettingsError()
    try {
      await upsertRaterSettings({
        ratee_user_profile_id: selectedProfileId,
        direct_manager_user_profile_id: managerId || null,
        allow_self: perms.self,
        allow_manager: perms.manager,
        allow_peer: perms.peer,
        allow_subordinate: perms.subordinate,
      })
      closeDialog()
    } catch {
      // error surfaced via settingsError from hook
    } finally {
      setSaving(false)
    }
  }, [
    selectedProfileId,
    managerId,
    perms,
    upsertRaterSettings,
    closeDialog,
    clearSettingsError,
  ])

  return (
    <Performance360Shell
      title="Mapping Penilaian"
      subtitle={`${scope.summaryLine} — Hierarki dari departemen, divisi, dan karyawan (user_profiles).`}
    >
      <FilterBar>
        <Select
          value={scope.entityId || ORG_SCOPE_FILTER_ALL}
          onValueChange={(v) => scope.setEntityId(v === ORG_SCOPE_FILTER_ALL ? "" : v)}
          disabled={scope.loadingEntities}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder="Entitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE_FILTER_ALL}>Semua entitas</SelectItem>
            {scope.entities.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={scope.departmentId || ORG_SCOPE_FILTER_ALL}
          onValueChange={(v) => scope.setDepartmentId(v === ORG_SCOPE_FILTER_ALL ? "" : v)}
          disabled={scope.loadingDepts}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder="Departemen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE_FILTER_ALL}>Semua departemen</SelectItem>
            {scope.departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={scope.divisionId || ORG_SCOPE_FILTER_ALL}
          onValueChange={(v) => scope.setDivisionId(v === ORG_SCOPE_FILTER_ALL ? "" : v)}
          disabled={scope.loadingDivs}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder={scope.divisionsFiltered.length ? "Divisi" : "Tidak ada divisi"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE_FILTER_ALL}>Semua divisi</SelectItem>
            {scope.divisionsFiltered.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.departments?.name ? `${d.name} (${d.departments.name})` : d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {scope.filtersLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" aria-hidden />
        )}
      </FilterBar>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">Hierarki organisasi</CardTitle>
          <CardDescription className="text-muted-foreground">
            Susunan mengikuti master departemen dan divisi serta penempatan karyawan di database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              Memuat data karyawan…
            </div>
          ) : orgTree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12 border border-dashed border-border rounded-lg">
              Tidak ada karyawan aktif untuk filter ini. Sesuaikan entitas / departemen / divisi atau pastikan data HR
              sudah ada.
            </p>
          ) : (
            <ul className="space-y-3">
              {orgTree.map((n) => (
                <OrgTreeNode
                  key={n.id}
                  node={n}
                  depth={0}
                  expanded={expanded}
                  toggle={toggle}
                  onAssignEmployee={onAssignEmployee}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        key={selectedProfileId ?? "closed"}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent
          showCloseButton
          className="text-foreground sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Pengaturan penilai
              {selectedName ? (
                <span className="block text-sm font-normal text-muted-foreground mt-1">{selectedName}</span>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedRole || "Scope filter yang aktif menentukan kandidat penilai."}
            </DialogDescription>
          </DialogHeader>

          {settingsLoading && dialogOpen ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              Memuat pengaturan…
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {settingsError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {settingsError}
                </div>
              ) : null}

              <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
                <Label className="text-foreground text-sm">Atasan untuk 360 (override)</Label>
                <p className="text-xs text-muted-foreground">
                  Hanya dipakai modul Performance 360; tidak mengubah master HR. Kosongkan jika belum ditetapkan.
                </p>
                <Select
                  value={managerId || "__none__"}
                  onValueChange={(v) => setManagerId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih atasan…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="__none__">— Belum dipilih —</SelectItem>
                    {managerCandidates.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {displayName(e)} · {e.hr_positions?.name ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                Centang peran penilai yang diaktifkan; pratinjau daftar mengikuti filter organisasi di atas.
              </p>

              <PermissionRow
                checked={perms.self}
                onCheckedChange={(v) => setPerms((p) => ({ ...p, self: !!v }))}
                title="Self assessment"
                desc="Karyawan dapat menilai diri sendiri"
                badge="Self"
                badgeClass="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                detail={
                  perms.self ? (
                    <p className="text-xs text-muted-foreground mt-2 pl-1 border-l-2 border-emerald-500/40">
                      Dinilai sendiri dalam siklus 360.
                    </p>
                  ) : null
                }
              />
              <PermissionRow
                checked={perms.manager}
                onCheckedChange={(v) => setPerms((p) => ({ ...p, manager: !!v }))}
                title="Atasan langsung (manager)"
                desc="Penilai: atasan yang dipilih di atas (khusus 360)"
                badge="Manager"
                badgeClass="bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30"
                detail={
                  perms.manager ? (
                    <div className="mt-2 space-y-1 pl-1 border-l-2 border-fuchsia-500/40">
                      {resolvedManager ? (
                        <p className="text-xs text-foreground">
                          <span className="text-muted-foreground">Penilai: </span>
                          {displayName(resolvedManager)} ({resolvedManager.hr_positions?.name ?? "—"})
                        </p>
                      ) : (
                        <p className="text-xs text-amber-400/90">
                          Pilih atasan di dropdown agar penilai manager terdefinisi.
                        </p>
                      )}
                    </div>
                  ) : null
                }
              />
              <PermissionRow
                checked={perms.peer}
                onCheckedChange={(v) => setPerms((p) => ({ ...p, peer: !!v }))}
                title="Rekan kerja (peer)"
                desc="Heuristik: level sama. Untuk level 7-9, lintas departemen/divisi diizinkan; selain itu harus departemen sama."
                badge="Peer"
                badgeClass="bg-sky-500/15 text-sky-400 border-sky-500/30"
                detail={
                  perms.peer ? (
                    <RaterNameList
                      people={peerPreview}
                      emptyHint="Tidak ada rekan sesuai aturan peer (level sama; level 7-9 bisa lintas departemen/divisi)."
                    />
                  ) : null
                }
              />
              <PermissionRow
                checked={perms.subordinate}
                onCheckedChange={(v) => setPerms((p) => ({ ...p, subordinate: !!v }))}
                title="Bawahan (subordinate)"
                desc={
                  subPreview.source === "reports_to"
                    ? "Berdasarkan kolom atasan (reports_to) di profil karyawan"
                    : "Perkiraan: grade lebih rendah & departemen sama (isi reports_to di HR untuk akurasi)"
                }
                badge="Subordinate"
                badgeClass="bg-amber-500/15 text-amber-400 border-amber-500/30"
                detail={
                  perms.subordinate ? (
                    <div className="space-y-1">
                      {subPreview.source === "heuristic" && subPreview.list.length > 0 ? (
                        <p className="text-[11px] text-muted-foreground italic">
                          Daftar perkiraan — setelah migrasi, isi atasan formal di data HR.
                        </p>
                      ) : null}
                      <RaterNameList
                        people={subPreview.list}
                        emptyHint="Tidak ada bawahan terdeteksi untuk scope ini."
                      />
                    </div>
                  ) : null
                }
              />
            </div>
          )}

          <DialogFooter className="border-t /90 sm:justify-end gap-2">
            <Button type="button" variant="ghost" className="text-muted-foreground" onClick={closeDialog} disabled={saving}>
              Tutup
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleSave()}
              disabled={saving || settingsLoading}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Menyimpan…
                </>
              ) : (
                "Simpan pengaturan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Performance360Shell>
  )
}

function RaterNameList({
  people,
  emptyHint,
}: {
  people: Record<string, unknown>[]
  emptyHint: string
}) {
  if (!people.length) {
    return (
      <p className="text-xs text-muted-foreground mt-2 pl-1 border-l-2 border-border italic">{emptyHint}</p>
    )
  }
  return (
    <ul className="mt-2 space-y-1 pl-1 border-l-2 border-sky-500/40 max-h-32 overflow-y-auto">
      {people.map((e) => (
        <li key={String(e.id)} className="text-xs text-foreground truncate">
          {displayName(e as { full_name?: string; employee_number?: string })}{" "}
          <span className="text-muted-foreground">
            · L{getJobGradeLevelDisplay(e as { hr_job_grades?: { level?: number } })}
          </span>
        </li>
      ))}
    </ul>
  )
}

function getJobGradeLevelDisplay(e: { hr_job_grades?: { level?: number } }) {
  const l = e.hr_job_grades?.level
  return typeof l === "number" ? String(l) : "—"
}

function PermissionRow({
  checked,
  onCheckedChange,
  title,
  desc,
  badge,
  badgeClass,
  detail,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  title: string
  desc: string
  badge: string
  badgeClass: string
  detail?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-1 border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
        <div className="flex-1 min-w-0">
          <Label className="text-foreground font-medium cursor-pointer">{title}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <Badge variant="outline" className={cn("shrink-0", badgeClass)}>
          {badge}
        </Badge>
      </div>
      {detail ? <div className="mt-2">{detail}</div> : null}
    </div>
  )
}
