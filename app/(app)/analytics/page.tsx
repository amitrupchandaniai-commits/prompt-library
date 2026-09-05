import Link from "next/link"
import { FileText, Star, FolderOpen, Tags } from "lucide-react"
import { requireSession } from "@/lib/dal"
import { getAnalyticsPrompts, getTagNames, getFavoriteCounts } from "@/lib/queries/analytics"
import { byCategory, bySource, byCreatedPeriod, averageRating, topTags, topFavorited } from "@/lib/analytics/aggregate"
import type { Granularity } from "@/lib/costs/format"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { BarChart } from "@/components/charts/BarChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
]

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ granularity?: string }>
}) {
  const user = await requireSession()
  const { granularity: granularityParam } = await searchParams
  const granularity: Granularity =
    granularityParam === "week" || granularityParam === "month" ? granularityParam : "day"

  const [prompts, tagNames, favoriteCounts] = await Promise.all([
    getAnalyticsPrompts(user.id),
    getTagNames(user.id),
    getFavoriteCounts(user.id),
  ])

  const categoryBars = byCategory(prompts)
  const sourceBars = bySource(prompts)
  const growthBars = byCreatedPeriod(prompts, granularity)
  const tagBars = topTags(tagNames)
  const favoritedList = topFavorited(favoriteCounts)
  const avgRating = averageRating(prompts)
  const mostActiveCategory = categoryBars[0]?.label ?? "—"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          A look at your own prompt library — categories, tags, ratings, and growth over time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total prompts" value={prompts.length} icon={FileText} />
        <KpiCard
          label="Average rating"
          value={avgRating !== null ? avgRating.toFixed(1) : "—"}
          icon={Star}
        />
        <KpiCard label="Most active category" value={mostActiveCategory} icon={FolderOpen} />
        <KpiCard label="Distinct tags used" value={new Set(tagNames).size} icon={Tags} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Library growth</CardTitle>
          <div className="flex gap-1">
            {GRANULARITIES.map((g) => (
              <Link
                key={g.value}
                href={`/analytics?granularity=${g.value}`}
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
          <BarChart
            bars={growthBars}
            color="chart-1"
            format="integer"
            emptyMessage="No prompts yet."
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompts by category</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart bars={categoryBars} color="chart-2" format="integer" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompts by source</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart bars={sourceBars} color="chart-3" format="integer" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top tags</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            bars={tagBars}
            color="chart-4"
            format="integer"
            emptyMessage="No tags used yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most favorited prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {favoritedList.length === 0 && (
            <p className="text-sm text-muted-foreground">No favorites yet.</p>
          )}
          {favoritedList.map((item) => (
            <div
              key={item.promptId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground tabular-nums">
                {item.count} favorite{item.count === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
