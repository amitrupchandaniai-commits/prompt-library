import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { createOAuthClient } from "./oauth-client"
import { encryptToken, decryptToken } from "./crypto"

const EXPIRY_BUFFER_MS = 5 * 60 * 1000

/**
 * Returns a valid access token for the given user, refreshing and persisting
 * a new one if the cached token is within 5 minutes of expiry. This is the
 * single choke point both the session-client path (Server Actions) and the
 * service-role cron path (trigger/prompt-scout.ts) call through — same
 * "inject the client" pattern lib/scout/pipeline.ts's runPromptScout uses —
 * so the unattended weekly run never gets stuck on a stale token.
 */
export async function getValidAccessToken(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string> {
  const { data: row } = await supabase
    .from("google_integrations")
    .select("access_token_encrypted, refresh_token_encrypted, token_expiry")
    .eq("user_id", userId)
    .maybeSingle()

  if (!row) throw new Error("Google is not connected for this user")

  const expiresInMs = new Date(row.token_expiry).getTime() - Date.now()
  if (expiresInMs > EXPIRY_BUFFER_MS) {
    return decryptToken(row.access_token_encrypted)
  }

  const client = createOAuthClient()
  client.setCredentials({ refresh_token: decryptToken(row.refresh_token_encrypted) })
  const { credentials } = await client.refreshAccessToken()

  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("Google token refresh failed")
  }

  await supabase
    .from("google_integrations")
    .update({
      access_token_encrypted: encryptToken(credentials.access_token),
      token_expiry: new Date(credentials.expiry_date).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  return credentials.access_token
}
