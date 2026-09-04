import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { actionLabel } from "@/lib/activity/labels"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ActivityPage() {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from("audit_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-muted-foreground">Your most recent actions across the app.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(activity ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          )}
          {(activity ?? []).map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">{actionLabel(entry.action)}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
