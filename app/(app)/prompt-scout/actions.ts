"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { runPromptScout, DEFAULT_SCOUT_CONFIG } from "@/lib/scout/pipeline"
import { publishCandidate } from "@/lib/scout/publish-candidate"
import { logAuditEvent } from "@/lib/audit"
import { syncCandidateToSheets } from "@/lib/google/sync"
import { syncReviewColumnsFromSheets } from "@/lib/google/reverse-sync"

// Note: maxDuration can't be exported from a "use server" file (only async
// functions are allowed there) — it's set on app/(app)/prompt-scout/page.tsx
// instead, which is what actually governs a Server Action invoked from it.

export async function startScoutRun(): Promise<{ runId: string }> {
  const user = await requireSession()
  const supabase = await createClient()
  const result = await runPromptScout(supabase, user.id, DEFAULT_SCOUT_CONFIG)

  await logAuditEvent({
    userId: user.id,
    action: "scout_run.started",
    objectType: "research_run",
    objectId: result.runId,
  })

  revalidatePath("/prompt-scout")
  revalidatePath("/prompt-scout/queue")
  return result
}

export async function approveCandidate(candidateId: string): Promise<{ promptId: string }> {
  const user = await requireSession()
  const supabase = await createClient()

  const result = await publishCandidate(supabase, user.id, candidateId)

  // Best-effort: a stale "pending" row in the sheet until the next weekly
  // run is a worse UX than the small added latency here.
  try {
    await syncCandidateToSheets(supabase, user.id, candidateId)
  } catch (err) {
    console.error("syncCandidateToSheets: unexpected error", err)
  }

  revalidatePath("/prompt-scout/queue")
  revalidatePath("/prompts")
  revalidatePath("/dashboard")
  return result
}

export async function rejectCandidate(candidateId: string, notes?: string) {
  const user = await requireSession()
  const supabase = await createClient()

  await supabase
    .from("research_candidates")
    .update({ review_status: "rejected", reviewer_notes: notes || null })
    .eq("id", candidateId)

  await logAuditEvent({
    userId: user.id,
    action: "scout_candidate.rejected",
    objectType: "research_candidate",
    objectId: candidateId,
  })

  try {
    await syncCandidateToSheets(supabase, user.id, candidateId)
  } catch (err) {
    console.error("syncCandidateToSheets: unexpected error", err)
  }

  revalidatePath("/prompt-scout/queue")
}

export async function syncFromSheetsNow(): Promise<{ updated: number; skipped: number }> {
  const user = await requireSession()
  const supabase = await createClient()
  const result = await syncReviewColumnsFromSheets(supabase, user.id)
  revalidatePath("/prompt-scout/queue")
  revalidatePath("/prompts")
  return result
}
