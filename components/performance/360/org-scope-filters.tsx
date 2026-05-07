"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDepartments } from "@/hooks/useDepartments"
import { useDivisions } from "@/hooks/useDivisions"
import { useEntities } from "@/hooks/useEntities"
import { getTenantId } from "@/lib/tenant"

export const ORG_SCOPE_FILTER_ALL = "__all__"

export type OrgScopeFilterState = {
  entityId: string
  setEntityId: (v: string) => void
  departmentId: string
  setDepartmentId: (v: string) => void
  divisionId: string
  setDivisionId: (v: string) => void
  entities: { id: string; name: string }[]
  departments: { id: string; name: string }[]
  divisionsFiltered: {
    id: string
    name: string
    department_id?: string
    departments?: { name?: string }
  }[]
  loadingEntities: boolean
  loadingDepts: boolean
  loadingDivs: boolean
  filtersLoading: boolean
  entityLabel: string
  deptLabel: string
  divLabel: string
  /** Satu baris ringkas untuk subtitle: `Entitas · Dept · Divisi` */
  summaryLine: string
}

export function useOrgScopeFilters(): OrgScopeFilterState {
  const tenantId = getTenantId()
  const { entities: entitiesRaw, loading: loadingEntities } = useEntities(tenantId, { pollInterval: 30_000 })
  const [entityId, setEntityId] = useState<string>("")
  const [departmentId, setDepartmentId] = useState<string>("")
  const [divisionId, setDivisionId] = useState<string>("")

  const { departments, loading: loadingDepts } = useDepartments(tenantId, {
    entityId: entityId || undefined,
    pollInterval: 30_000,
  })
  const { divisions: divisionsScoped, loading: loadingDivs } = useDivisions(tenantId, {
    departmentEntityId: entityId || null,
    pollInterval: 30_000,
  })

  const divisionsFiltered = useMemo(() => {
    if (!departmentId) return divisionsScoped
    return divisionsScoped.filter((d: { department_id?: string }) => d.department_id === departmentId)
  }, [divisionsScoped, departmentId])

  useEffect(() => {
    setDepartmentId("")
    setDivisionId("")
  }, [entityId])

  useEffect(() => {
    setDivisionId("")
  }, [departmentId])

  const entities = (entitiesRaw ?? []) as { id: string; name: string }[]
  const entityLabel =
    entityId && entities.length
      ? entities.find((e) => e.id === entityId)?.name ?? "—"
      : "Semua entitas"
  const deptLabel =
    departmentId && departments.length
      ? (departments as { id: string; name: string }[]).find((d) => d.id === departmentId)?.name ?? "—"
      : "Semua departemen"
  const divLabel =
    divisionId && divisionsFiltered.length
      ? divisionsFiltered.find((d) => d.id === divisionId)?.name ?? "—"
      : "Semua divisi"

  const filtersLoading = loadingEntities || loadingDepts || loadingDivs

  return {
    entityId,
    setEntityId,
    departmentId,
    setDepartmentId,
    divisionId,
    setDivisionId,
    entities,
    departments: departments as { id: string; name: string }[],
    divisionsFiltered,
    loadingEntities,
    loadingDepts,
    loadingDivs,
    filtersLoading,
    entityLabel,
    deptLabel,
    divLabel,
    summaryLine: `${entityLabel} · ${deptLabel} · ${divLabel}`,
  }
}

export function OrgScopeFilterFields({
  scope,
  trailing,
  title = "Filter organisasi",
  hideEntity = false,
  hideHeader = false,
}: {
  scope: OrgScopeFilterState
  /** Sisipkan kontrol lain di baris/kolom yang sama (mis. karyawan, periode). */
  trailing?: ReactNode
  /** Judul blok filter */
  title?: string
  /** Sembunyikan filter entitas (mis. dashboard 360: hanya dept + divisi). */
  hideEntity?: boolean
  /** Sembunyikan baris judul + indikator loading (mis. judul ada di Accordion trigger). */
  hideHeader?: boolean
}) {
  const F = ORG_SCOPE_FILTER_ALL
  const {
    entityId,
    setEntityId,
    departmentId,
    setDepartmentId,
    divisionId,
    setDivisionId,
    entities,
    departments,
    divisionsFiltered,
    loadingEntities,
    loadingDepts,
    loadingDivs,
    filtersLoading,
  } = scope

  return (
    <div>
      {!hideHeader ? (
        <div className="flex items-center justify-between gap-2 mb-3 pb-0.5">
          <h3 className="text-foreground font-medium">{title}</h3>
          {filtersLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" aria-hidden />
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "w-full items-end",
          trailing
            ? hideEntity
              ? "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-none xl:[grid-template-columns:repeat(4,minmax(0,1fr))] xl:gap-x-3"
              : "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-none xl:[grid-template-columns:repeat(5,minmax(0,1fr))] xl:gap-x-3"
            : hideEntity
              ? "grid grid-cols-1 gap-4 md:grid-cols-none md:[grid-template-columns:repeat(2,minmax(0,1fr))]"
              : "grid grid-cols-1 gap-4 md:grid-cols-none md:[grid-template-columns:repeat(3,minmax(0,1fr))]"
        )}
      >
        {!hideEntity ? (
          <div className="min-w-0 space-y-2">
            <Label className="text-muted-foreground text-xs">Entitas</Label>
            <Select
              value={entityId || F}
              onValueChange={(v) => setEntityId(v === F ? "" : v)}
              disabled={loadingEntities}
            >
              <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden">
                <SelectValue placeholder="Pilih entitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={F}>Semua entitas</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="min-w-0 space-y-2">
          <Label className="text-muted-foreground text-xs">Departemen</Label>
          <Select
            value={departmentId || F}
            onValueChange={(v) => setDepartmentId(v === F ? "" : v)}
            disabled={loadingDepts}
          >
            <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden">
              <SelectValue placeholder="Pilih departemen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={F}>Semua departemen</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label className="text-muted-foreground text-xs">Divisi</Label>
          <Select
            value={divisionId || F}
            onValueChange={(v) => setDivisionId(v === F ? "" : v)}
            disabled={loadingDivs}
          >
            <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden">
              <SelectValue placeholder={divisionsFiltered.length ? "Pilih divisi" : "Tidak ada divisi"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={F}>Semua divisi</SelectItem>
              {divisionsFiltered.map((d) => {
                const sub = d.departments?.name
                return (
                  <SelectItem key={d.id} value={d.id}>
                    {sub ? `${d.name} (${sub})` : d.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        {trailing}
      </div>
    </div>
  )
}
