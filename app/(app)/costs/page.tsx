import Link from "next/link"
import { DollarSign, Hash, Calculator, CalendarClock } from "lucide-react"
import { requireSession } from "@/lib/dal"
import { getUsageRows, getCostByResearchRun } from "@/lib/queries/costs"
import { summarize, byPeriod, byFeature, byModel } from "@/lib/costs/aggregate"
import type { Granularity } from "@/lib/costs/format"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { BarChart } from "@/components/charts/BarChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  partial: "secondary",
  failed: "destructive",
  running: "outline",
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ granularity?: string }>
}) {
  const user = await requireSession()
  const { granularity: granularityParam } = await searchParams
  const granularity: Granularity =
    granularityParam === "week" || granularityParam === "month" ? granularityParam : "day"

  const rows = await getUsageRows(user.id)
  const summary = summarize(rows)
  const periodBars = byPeriod(rows, granularity)
  const featureBars = byFeature(rows)
  const modelBars = byModel(rows)
  const researchRunCosts = await getCostByResearchRun(rows)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Costs</h1>
        <p className="mt-1 text-muted-foreground">
          What your own AI usage across the app has cost, derived from every logged call.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total cost" value={`$${summary.totalCost.toFixed(4)}`} icon={DollarSign} />
        <KpiCard label="Total calls" value={summary.totalCalls} icon={Hash} />
        <KpiCard
          label="Avg cost / call"
          value={`$${summary.avgCostPerCall.toFixed(4)}`}
          icon={Calculator}
        />
        <KpiCard label="This week" value={`$${summary.thisWeekCost.toFixed(4)}`} icon={CalendarClock} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cost over time</CardTitle>
          <div className="flex gap-1">
            {GRANULARITIES.map((g) => (
              <Link
                key={g.value}
                href={`/costs?granularity=${g.value}`}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  granularity === g.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {g.label}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <BarChart bars={periodBars} color="chart-1" emptyMessage="No AI usage logged yet." />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost by feature</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart bars={featureBars} color="chart-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost by model</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart bars={modelBars} color="chart-3" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost by research run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {researchRunCosts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No Prompt Scout runs with AI usage yet.
            </p>
          )}
          {researchRunCosts.map((run) => (
            <div
              key={run.runId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>{run.status}</Badge>
                <span className="text-muted-foreground">
                  {run.startedAt ? new Date(run.startedAt).toLocaleString() : "Unknown run"}
                </span>
              </div>
              <span className="font-medium tabular-nums">${run.cost.toFixed(4)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
