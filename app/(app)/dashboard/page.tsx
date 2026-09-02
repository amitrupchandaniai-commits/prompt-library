import Link from "next/link"
import { FileText, CalendarPlus, Star, FolderHeart, Bot, Plus } from "lucide-react"
import { requireSession } from "@/lib/dal"
import {
  getDashboardStats,
  listRecentPrompts,
  listTopRatedPrompts,
} from "@/lib/queries/prompts"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export default async function DashboardPage() {
  const user = await requireSession()
  const [stats, recent, topRated] = await Promise.all([
    getDashboardStats(user.id),
    listRecentPrompts(user.id),
    listTopRatedPrompts(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            An overview of your prompt library.
          </p>
        </div>
        <Link href="/prompts/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New prompt
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Prompts" value={stats.totalPrompts} icon={FileText} />
        <KpiCard label="Added This Week" value={stats.addedThisWeek} icon={CalendarPlus} />
        <KpiCard label="Favorites" value={stats.favoritesCount} icon={Star} />
        <KpiCard label="Collections" value={stats.collectionsCount} icon={FolderHeart} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No prompts yet.{" "}
                <Link href="/prompts/new" className="underline underline-offset-4">
                  Create your first one
                </Link>
                .
              </p>
            )}
            {recent.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.id}`}
                className="block rounded-md border p-3 text-sm hover:bg-accent"
              >
                <div className="font-medium">{prompt.title}</div>
                {prompt.description && (
                  <div className="truncate text-xs text-muted-foreground">
                    {prompt.description}
                  </div>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Rated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRated.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Rate prompts from their detail page to see your favorites here.
              </p>
            )}
            {topRated.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
              >
                <span className="font-medium">{prompt.title}</span>
                <span className="text-xs text-muted-foreground">★ {prompt.user_rating}/5</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-muted-foreground" />
            Prompt Scout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Prompt Scout&apos;s autonomous weekly research pipeline is designed in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/AGENT_ARCHITECTURE.md</code>{" "}
            and ships in Phase 4. It isn&apos;t running yet — there&apos;s nothing to report.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
