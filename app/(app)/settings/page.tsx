import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { DisconnectGoogleButton } from "@/components/settings/DisconnectGoogleButton"
import { GoogleReviewSyncToggle } from "@/components/settings/GoogleReviewSyncToggle"

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "The connection request expired or was tampered with. Please try again.",
  no_refresh_token:
    "Google didn't grant a refresh token, so the weekly sync couldn't be set up. Try disconnecting any prior access at myaccount.google.com/permissions and reconnecting.",
  storage_failed: "Google connected, but we couldn't save the connection. Please try again.",
  exchange_failed: "Could not complete the Google connection. Please try again.",
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google_error?: string; google_connected?: string }>
}) {
  const user = await requireSession()
  const supabase = await createClient()
  const params = await searchParams

  const [{ data: profile }, { data: googleIntegration }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("google_integrations")
      .select("spreadsheet_id, sheets_review_sync_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const googleError = params.google_error ? GOOGLE_ERROR_MESSAGES[params.google_error] : null

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            {profile?.display_name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {user.email}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Google Integration
            <Badge variant={googleIntegration ? "default" : "outline"}>
              {googleIntegration ? "Connected" : "Not connected"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Sync Prompt Scout candidates to Google Sheets and weekly reports to Google Drive.
            See docs/GOOGLE_INTEGRATION.md.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleError && <p className="text-sm text-destructive">{googleError}</p>}

          {googleIntegration ? (
            <>
              {googleIntegration.spreadsheet_id && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${googleIntegration.spreadsheet_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-primary underline underline-offset-4"
                >
                  Open &quot;Prompt Library — AI Research&quot; spreadsheet
                </a>
              )}
              <GoogleReviewSyncToggle
                defaultChecked={googleIntegration.sheets_review_sync_enabled}
              />
              <DisconnectGoogleButton />
            </>
          ) : (
            <a href="/api/google/connect" className={buttonVariants({ variant: "default" })}>
              Connect Google
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Prompt Scout
            <Badge variant="outline">Not configured</Badge>
          </CardTitle>
          <CardDescription>
            Weekly research schedule, quality thresholds, and AI budget. Ships in Phase 4 — see
            docs/AGENT_ARCHITECTURE.md.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
