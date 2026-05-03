const FALLBACK_TENANT_ID = "00000000-0000-0000-0000-000000000000"

export function getTenantId() {
  const envTenantId = process.env.NEXT_PUBLIC_TENANT_ID
  return envTenantId && envTenantId.trim().length > 0 ? envTenantId : FALLBACK_TENANT_ID
}

export { FALLBACK_TENANT_ID }
