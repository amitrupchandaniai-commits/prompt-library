import "server-only"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/types/database.types"

/**
 * Audit log writes bypass RLS by design (see docs/DATABASE.md) so a client can
 * never forge or erase its own trail. This client is never exposed to the browser.
 */
function serviceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return null
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )
}

export async function logAuditEvent(entry: {
  userId: string
  action: string
  objectType: string
  objectId?: string
  previousValue?: Json
  newValue?: Json
}) {
  const client = serviceClient()
  // SUPABASE_SERVICE_ROLE_KEY is intentionally optional in local dev (see .env.example);
  // without it, audit logging is skipped rather than failing the mutation it's attached to.
  if (!client) return

  try {
    const { error } = await client.from("audit_log").insert({
      user_id: entry.userId,
      action: entry.action,
      object_type: entry.objectType,
      object_id: entry.objectId,
      previous_value: entry.previousValue ?? null,
      new_value: entry.newValue ?? null,
    })
    if (error) console.error("logAuditEvent: insert failed", error)
  } catch (err) {
    // Audit logging must never take down the mutation it's attached to.
    console.error("logAuditEvent: unexpected error", err)
  }
}
