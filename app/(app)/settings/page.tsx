import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function SettingsPage() {
  const user = await requireSession()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

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
            <Badge variant="outline">Not configured</Badge>
          </CardTitle>
          <CardDescription>
            Connect Google Sheets and Google Drive for Prompt Scout&apos;s review layer and
            weekly reports. Ships in Phase 5 — see docs/GOOGLE_INTEGRATION.md.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Connect Google</Button>
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
