import Link from "next/link"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { RunScoutButton } from "@/components/scout/RunScoutButton"
import { DEFAULT_SCOUT_CONFIG } from "@/lib/scout/pipeline"

// Governs the "Run now" Server Action too (Next.js ties Server Action duration
// to the route it's invoked from, not the "use server" file that defines it).
export const maxDuration = 60

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  partial: "secondary",
  failed: "destructive",
  running: "outline",
}

export default async function PromptScoutPage() {
  await requireSession()
  const supabase = await createClient()

  const [{ data: runs }, { count: pendingCount }, { count: sourceCount }] = await Promise.all([
    supabase
      .from("research_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("research_candidates")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "pending"),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("enabled", true),
  ])

  const lastRun = runs?.[0]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prompt Scout</h1>
          <p className="mt-1 text-muted-foreground">
            Discovers prompting techniques from your approved sources. Runs manually for
            now — a real weekly schedule (Trigger.dev) is a fast-follow once this pipeline
            is proven out.
          </p>
        </div>
        <RunScoutButton />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enabled sources
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{sourceCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending review
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pendingCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last run</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {lastRun ? new Date(lastRun.started_at).toLocaleString() : "Never"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Per-run limits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {DEFAULT_SCOUT_CONFIG.maxSources} sources · {DEFAULT_SCOUT_CONFIG.maxItemsPerSource}{" "}
            items each · min score {DEFAULT_SCOUT_CONFIG.minQualityScore}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Link href="/prompt-scout/queue" className={buttonVariants({ variant: "outline" })}>
          Review queue{pendingCount ? ` (${pendingCount})` : ""}
        </Link>
        <Link href="/sources" className={buttonVariants({ variant: "outline" })}>
          Manage sources
        </Link>
        <Link href="/prompt-scout/trends" className={buttonVariants({ variant: "outline" })}>
          Trends
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(runs ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No runs yet — click &quot;Run now&quot; to start the first one.
            </p>
          )}
          {(runs ?? []).map((run) => (
            <div
              key={run.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>{run.status}</Badge>
                {(run.sheets_sync_status === "failed" || run.drive_report_status === "failed") && (
                  <Badge variant="destructive">Google sync failed</Badge>
                )}
                <span className="text-muted-foreground">
                  {new Date(run.started_at).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{run.sources_scanned} sources</span>
                <span>{run.items_discovered} discovered</span>
                <span>{run.items_analyzed} analyzed</span>
                <span>{run.duplicates_found} duplicates</span>
                <span>{run.pending_review_count} queued</span>
                <span>${run.ai_cost_usd.toFixed(4)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
