import { insForge } from "@/lib/insforge"

export async function uploadAttendanceSelfie(
  blob: Blob,
  tenantId: string,
  userProfileId: string,
  type: "checkin" | "checkout"
): Promise<string> {
  if (!insForge) throw new Error("Database not connected")
  const date = new Date().toISOString().split("T")[0]
  const ts   = Date.now()
  const path = `${tenantId}/${userProfileId}/${date}-${type}-${ts}.jpg`
  const { data, error } = await (insForge as any).storage
    .from("attendance-photos")
    .upload(path, blob)
  if (error) throw error
  if (!data?.url) throw new Error("Upload gagal — URL tidak dikembalikan")
  return data.url as string
}
