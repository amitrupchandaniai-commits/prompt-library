import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddSourceDialog } from "@/components/scout/AddSourceDialog"
import { SourceRowActions } from "@/components/scout/SourceRowActions"

export default async function SourcesPage() {
  await requireSession()
  const supabase = await createClient()

  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .order("trust_score", { ascending: false })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-1 text-muted-foreground">
            Approved sources Prompt Scout scans each run. Official docs and RSS feeds are
            preferred over scraping (docs/AGENT_ARCHITECTURE.md).
          </p>
        </div>
        <AddSourceDialog />
      </div>

      <div className="space-y-2">
        {(sources ?? []).map((source) => (
          <Card key={source.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{source.name}</span>
                  <Badge variant="outline">{source.type}</Badge>
                  <Badge variant="secondary">Trust {source.trust_score}</Badge>
                  {!source.enabled && <Badge variant="destructive">Disabled</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{source.url}</p>
                {source.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">{source.notes}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Last scanned:{" "}
                  {source.last_scanned_at
                    ? new Date(source.last_scanned_at).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <SourceRowActions sourceId={source.id} enabled={source.enabled} />
            </CardContent>
          </Card>
        ))}
      </div>

      {(sources ?? []).length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No sources yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add an RSS feed, official API, or documentation site for Prompt Scout to scan.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
