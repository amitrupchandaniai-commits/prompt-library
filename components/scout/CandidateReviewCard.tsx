"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ExternalLink, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { approveCandidate, rejectCandidate } from "@/app/(app)/prompt-scout/actions"
import type { Tables } from "@/types/database.types"

type Candidate = Tables<"research_candidates"> & { categories: { name: string } | null }

export function CandidateReviewCard({ candidate }: { candidate: Candidate }) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState("")
  const [showReject, setShowReject] = useState(false)
  const router = useRouter()

  const duplicateWarning =
    candidate.duplicate_probability !== null && candidate.duplicate_probability >= 85

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{candidate.title}</CardTitle>
          {candidate.quality_score !== null && (
            <Badge variant={candidate.quality_score >= 80 ? "default" : "secondary"}>
              Quality {candidate.quality_score}
            </Badge>
          )}
          {candidate.categories?.name && (
            <Badge variant="outline">{candidate.categories.name}</Badge>
          )}
          {duplicateWarning && (
            <Badge variant="destructive">
              {candidate.duplicate_probability}% possible duplicate
            </Badge>
          )}
        </div>
        {candidate.description && (
          <p className="text-sm text-muted-foreground">{candidate.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="max-h-64 overflow-auto rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
          {candidate.prompt_text}
        </pre>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <a
            href={candidate.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            {candidate.source_name ?? "Source"}
          </a>
          {candidate.source_author && <span>by {candidate.source_author}</span>}
          {candidate.tags.length > 0 && (
            <span className="flex gap-1">
              {candidate.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </span>
          )}
        </div>

        {showReject && (
          <Textarea
            placeholder="Optional note on why you're rejecting this"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        )}

        <div className="flex gap-2">
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await approveCandidate(candidate.id)
                  toast.success("Published to your library")
                  router.refresh()
                } catch {
                  toast.error("Could not approve this candidate")
                }
              })
            }}
          >
            <Check className="size-4" />
            Approve
          </Button>
          {!showReject ? (
            <Button variant="outline" onClick={() => setShowReject(true)}>
              <X className="size-4" />
              Reject
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await rejectCandidate(candidate.id, notes)
                  toast.success("Rejected")
                  router.refresh()
                })
              }}
            >
              Confirm reject
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
