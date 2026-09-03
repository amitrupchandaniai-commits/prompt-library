import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CandidateReviewCard } from "@/components/scout/CandidateReviewCard"

export default async function ScoutQueuePage() {
  await requireSession()
  const supabase = await createClient()

  const { data: candidates } = await supabase
    .from("research_candidates")
    .select("*, categories(name)")
    .eq("review_status", "pending")
    .order("quality_score", { ascending: false, nullsFirst: false })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-1 text-muted-foreground">
          Every candidate lands here regardless of score — nothing publishes automatically.
        </p>
      </div>

      {(candidates ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nothing to review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Run Prompt Scout from its dashboard to discover new candidates.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates!.map((candidate) => (
            <CandidateReviewCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  )
}
