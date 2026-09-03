import { requireAdmin } from "@/lib/dal"
import { createServiceClient } from "@/lib/supabase/service"
import { buildUserStats, type AuthUserSummary } from "@/lib/admin/stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminPage() {
  await requireAdmin()

  // Bypasses RLS: aggregating stats across every user isn't expressible as a
  // per-row RLS policy, same justification lib/audit.ts uses for its writes.
  const supabase = createServiceClient()

  const [
    { data: authData, error: authError },
    { data: prompts },
    { data: scoutEvents },
    { data: activity },
  ] = await Promise.all([
    // Single page is fine at this app's scale (a small personal/friends
    // userbase) — paginate if the userbase grows meaningfully.
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("prompts").select("user_id"),
    supabase
      .from("audit_log")
      .select("user_id, action")
      .in("action", ["scout_candidate.approved", "scout_candidate.rejected"]),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50),
  ])

  if (authError) {
    console.error("admin.listUsers failed", authError)
  }

  const authUsers: AuthUserSummary[] = (authData?.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "(no email)",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  }))

  const promptCounts = new Map<string, number>()
  for (const row of prompts ?? []) {
    promptCounts.set(row.user_id, (promptCounts.get(row.user_id) ?? 0) + 1)
  }

  const scoutApproved = new Map<string, number>()
  const scoutRejected = new Map<string, number>()
  for (const row of scoutEvents ?? []) {
    const target = row.action === "scout_candidate.approved" ? scoutApproved : scoutRejected
    target.set(row.user_id, (target.get(row.user_id) ?? 0) + 1)
  }

  const userStats = buildUserStats(authUsers, promptCounts, scoutApproved, scoutRejected)
  const emailById = new Map(authUsers.map((u) => [u.id, u.email]))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-muted-foreground">Users and recent activity across the app.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total users
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{userStats.length}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {userStats.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(user.createdAt).toLocaleDateString()} · Last sign-in{" "}
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "never"}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{user.promptCount} prompts</span>
                <span>{user.scoutApproved} approved</span>
                <span>{user.scoutRejected} rejected</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
                <Badge variant="outline">{entry.action}</Badge>
                <span className="text-muted-foreground">
                  {emailById.get(entry.user_id) ?? entry.user_id}
                </span>
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
