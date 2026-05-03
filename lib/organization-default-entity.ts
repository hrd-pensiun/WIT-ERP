/**
 * Default instansi (entity) scope untuk halaman master-data organization / SuperAdmin.
 * Disimpan di localStorage agar tetap dipakai untuk CRUD selanjutnya.
 */
export const ORGANIZATION_DEFAULT_ENTITY_STORAGE_KEY =
  "wit-erp:organization-default-entity-id"

/** Variasi role SuperAdmin yang mungkin dipakai di metadata InsForge */
export const SUPERADMIN_ROLE_ALIASES: string[] = [
  "SuperAdmin",
  "super_admin",
  "Super Admin",
]

export function getDefaultOrganizationEntityId(): string | null {
  if (typeof window === "undefined") return null
  const v = window.localStorage.getItem(ORGANIZATION_DEFAULT_ENTITY_STORAGE_KEY)
  return v && v.trim().length > 0 ? v.trim() : null
}

export function setDefaultOrganizationEntityId(entityId: string): void {
  window.localStorage.setItem(ORGANIZATION_DEFAULT_ENTITY_STORAGE_KEY, entityId)
}

export function clearDefaultOrganizationEntityId(): void {
  window.localStorage.removeItem(ORGANIZATION_DEFAULT_ENTITY_STORAGE_KEY)
}
