import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type SyncRolePayload = {
  employeeId?: string | null
  userId?: string | null
  email?: string | null
  fullName?: string | null
  role?: string | null
  password?: string | null
  bulk?: boolean
}

const ALLOWED_ROLES = new Set(["employee", "manager", "hr_admin", "SuperAdmin"])
const DEFAULT_PASSWORD = "wit12345"

function getAdminClient() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || process.env.INSFORGE_URL
  const serviceRoleKey = process.env.INSFORGE_SERVICE_ROLE_KEY
  if (!baseUrl || !serviceRoleKey) return null
  return createClient(baseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function resolveUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const { data, error } = await admin.schema("auth").from("users").select("id").eq("email", email).maybeSingle()
  if (error || !data) return null
  return (data as { id: string }).id
}

async function setProfileUserId(admin: ReturnType<typeof createClient>, employeeId: string, userId: string) {
  const { error } = await admin.from("user_profiles").update({ user_id: userId }).eq("id", employeeId)
  if (error) {
    throw new Error(error.message || "Failed to update user_profiles.user_id")
  }
}

async function ensureAuthUser(params: {
  admin: ReturnType<typeof createClient>
  userId?: string | null
  email?: string | null
  role: string
  fullName?: string | null
  password?: string | null
}) {
  const { admin, role, fullName } = params
  const email = params.email?.trim() || null
  let targetUserId = params.userId?.trim() || null
  const password = params.password?.trim() || DEFAULT_PASSWORD

  if (!targetUserId && email) {
    targetUserId = await resolveUserIdByEmail(admin, email)
  }

  if (!targetUserId && email) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName || undefined,
      },
    })
    if (createError || !created.user?.id) {
      throw new Error(createError?.message || "Failed to create auth user.")
    }
    targetUserId = created.user.id
  }

  if (!targetUserId) {
    return { ok: false as const, message: "No target auth user found from user_id/email." }
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
    ...(password ? { password } : {}),
    user_metadata: {
      role,
      ...(fullName ? { full_name: fullName } : {}),
    },
  })
  if (updateError) {
    throw new Error(updateError.message || "Failed to update auth user metadata/password.")
  }

  return { ok: true as const, userId: targetUserId }
}

async function syncAllEmployees(admin: ReturnType<typeof createClient>) {
  const { data: employees, error } = await admin
    .from("user_profiles")
    .select("id,user_id,email,full_name,app_role")
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message || "Failed to read employee profiles.")
  }

  const rows = (employees || []) as Array<{
    id: string
    user_id?: string | null
    email?: string | null
    full_name?: string | null
    app_role?: string | null
  }>

  const result = {
    total: rows.length,
    processed: 0,
    skipped: 0,
    failed: 0,
  }

  for (const row of rows) {
    const role = row.app_role && ALLOWED_ROLES.has(row.app_role) ? row.app_role : "employee"
    if (!row.email && !row.user_id) {
      result.skipped += 1
      continue
    }
    try {
      const syncResult = await ensureAuthUser({
        admin,
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        role,
        password: DEFAULT_PASSWORD,
      })
      if (!syncResult.ok) {
        result.skipped += 1
        continue
      }
      result.processed += 1
      if (!row.user_id) {
        await setProfileUserId(admin, row.id, syncResult.userId)
      }
    } catch {
      result.failed += 1
    }
  }

  return result
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SyncRolePayload | null
  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Service role key not configured. Skipped metadata sync." },
      { status: 200 }
    )
  }

  if (payload?.bulk) {
    try {
      const report = await syncAllEmployees(admin)
      return NextResponse.json({ ok: true, report })
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Bulk sync failed.",
        },
        { status: 500 }
      )
    }
  }

  if (!payload?.role || !ALLOWED_ROLES.has(payload.role)) {
    return NextResponse.json({ ok: false, message: "Invalid role payload." }, { status: 400 })
  }

  try {
    const syncResult = await ensureAuthUser({
      admin,
      userId: payload.userId,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      password: payload.password,
    })
    if (!syncResult.ok) {
      return NextResponse.json(
        { ok: false, message: `${syncResult.message} Skipped metadata sync.` },
        { status: 200 }
      )
    }
    if (payload.employeeId?.trim()) {
      await setProfileUserId(admin, payload.employeeId.trim(), syncResult.userId)
    }
    return NextResponse.json({ ok: true, userId: syncResult.userId })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to sync auth role metadata.",
      },
      { status: 500 }
    )
  }
}
