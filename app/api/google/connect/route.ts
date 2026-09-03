import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireSession } from "@/lib/dal"
import { buildAuthUrl } from "@/lib/google/oauth-client"

export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state"

export async function GET() {
  await requireSession()

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return NextResponse.redirect(buildAuthUrl(state))
}
