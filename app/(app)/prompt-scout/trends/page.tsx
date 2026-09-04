import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DetectTrendsButton } from "@/components/scout/DetectTrendsButton"

const SIGNAL_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
}

export default async function TrendsPage() {
  await requireSession()
  const supabase = await createClient()

  const { data: trends } = await supabase
    .from("trends")
    .select("*")
    .order("week_start", { ascending: false })
    .order("created_at", { ascending: false })

  const weeks = new Map<string, typeof trends>()
  for (const trend of trends ?? []) {
    const existing = weeks.get(trend.week_start) ?? []
    existing.push(trend)
    weeks.set(trend.week_start, existing)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trends</h1>
          <p className="mt-1 text-muted-foreground">
            AI-generated weekly summaries of what Prompt Scout is discovering. Weeks with too
            little data to spot a genuine pattern show nothing, on purpose.
          </p>
        </div>
        <DetectTrendsButton />
      </div>

      {weeks.size === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No trends detected yet — click &quot;Detect trends now&quot; to analyze this week&apos;s
            candidates, or wait for the weekly run.
          </CardContent>
        </Card>
      )}

      {[...weeks.entries()].map(([weekStart, weekTrends]) => (
        <Card key={weekStart}>
          <CardHeader>
            <CardTitle className="text-base">Week of {weekStart}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(weekTrends ?? []).map((trend) => (
              <div key={trend.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={SIGNAL_VARIANT[trend.signal_strength] ?? "outline"}>
                    {trend.signal_strength}
                  </Badge>
                  <span className="font-medium">{trend.trend}</span>
                </div>
                <p className="mt-1.5 text-muted-foreground">{trend.notes}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
