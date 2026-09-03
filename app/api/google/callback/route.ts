import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { createOAuthClient, GOOGLE_SCOPES } from "@/lib/google/oauth-client"
import { encryptToken } from "@/lib/google/crypto"
import { GOOGLE_OAUTH_STATE_COOKIE } from "../connect/route"

export async function GET(request: Request) {
  const user = await requireSession()
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value
  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE)

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/settings?google_error=invalid_state`)
  }

  try {
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)

    // Without a refresh_token, the weekly cron (trigger/prompt-scout.ts) can't
    // stay connected unattended past the ~1hr access-token lifetime — reject
    // rather than silently store a token that will strand the integration.
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      return NextResponse.redirect(`${origin}/settings?google_error=no_refresh_token`)
    }

    const supabase = await createClient()
    const { error } = await supabase.from("google_integrations").upsert(
      {
        user_id: user.id,
        access_token_encrypted: encryptToken(tokens.access_token),
        refresh_token_encrypted: encryptToken(tokens.refresh_token),
        token_expiry: new Date(tokens.expiry_date).toISOString(),
        scopes: [...GOOGLE_SCOPES],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      return NextResponse.redirect(`${origin}/settings?google_error=storage_failed`)
    }

    return NextResponse.redirect(`${origin}/settings?google_connected=1`)
  } catch {
    return NextResponse.redirect(`${origin}/settings?google_error=exchange_failed`)
  }
}
