import { insForge } from "@/lib/insforge"

/** Pastikan hanya satu entity per tenant dengan is_headquarters=true (yang baru menang). */
export async function ensureSingleHeadquarters(
  tenantId: string,
  headquartersEntityId: string
): Promise<void> {
  if (!insForge) return

  const { data: others, error } = await insForge
    .from("entities")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_headquarters", true)
    .neq("id", headquartersEntityId)

  if (error || !others?.length) return

  for (const row of others) {
    await insForge
      .from("entities")
      .update({ is_headquarters: false })
      .eq("id", row.id)
      .eq("tenant_id", tenantId)
  }
}
