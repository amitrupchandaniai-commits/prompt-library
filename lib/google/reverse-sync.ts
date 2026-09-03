import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { getGoogleClients } from "./client"
import { SHEET_NAMES } from "./sheets-schema"
import { ReverseSyncRowSchema } from "@/lib/validations/google"
import { publishCandidate } from "@/lib/scout/publish-candidate"

// Column A = Candidate ID (index 0), U = Review Status (index 20),
// V = Reviewer Notes (index 21) in NEW_DISCOVERIES_HEADERS order (see
// lib/google/sheets-schema.ts). Reading only A:V means there is structurally
// nothing else to read back even if the sheet gains stray columns — never
// permissions/security/system config (docs/GOOGLE_INTEGRATION.md §4).
const REVIEW_STATUS_COL_INDEX = 20
const REVIEWER_NOTES_COL_INDEX = 21

/**
 * Opt-in reverse sync: reads Review Status/Reviewer Notes back from the
 * "New Discoveries" sheet and applies validated changes to research_candidates.
 * No-op unless the user has enabled sheets_review_sync_enabled. Flipping a row
 * to "approved" triggers the same publish path as the in-app Approve button
 * (lib/scout/publish-candidate.ts), so a sheet approval and an in-app approval
 * always converge on the same result.
 */
export async function syncReviewColumnsFromSheets(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ updated: number; skipped: number }> {
  const { data: integration } = await supabase
    .from("google_integrations")
    .select("spreadsheet_id, sheets_review_sync_enabled")
    .eq("user_id", userId)
    .maybeSingle()

  if (!integration?.sheets_review_sync_enabled || !integration.spreadsheet_id) {
    return { updated: 0, skipped: 0 }
  }

  const { sheets: sheetsClient } = await getGoogleClients(supabase, userId)
  const { data } = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: integration.spreadsheet_id,
    range: `'${SHEET_NAMES.newDiscoveries}'!A2:${String.fromCharCode(65 + REVIEWER_NOTES_COL_INDEX)}`,
  })

  let updated = 0
  let skipped = 0

  for (const row of data.values ?? []) {
    const parsed = ReverseSyncRowSchema.safeParse({
      candidateId: row[0],
      reviewStatus: typeof row[REVIEW_STATUS_COL_INDEX] === "string" ? row[REVIEW_STATUS_COL_INDEX].toLowerCase() : undefined,
      reviewerNotes: row[REVIEWER_NOTES_COL_INDEX] || undefined,
    })

    if (!parsed.success) {
      skipped += 1
      continue
    }

    const { data: candidate } = await supabase
      .from("research_candidates")
      .select("review_status, reviewer_notes")
      .eq("id", parsed.data.candidateId)
      .maybeSingle()

    if (!candidate) {
      skipped += 1
      continue
    }

    const notes = parsed.data.reviewerNotes ?? null
    if (candidate.review_status === parsed.data.reviewStatus && candidate.reviewer_notes === notes) {
      continue
    }

    await supabase
      .from("research_candidates")
      .update({ review_status: parsed.data.reviewStatus, reviewer_notes: notes })
      .eq("id", parsed.data.candidateId)
    updated += 1

    if (parsed.data.reviewStatus === "approved" && candidate.review_status !== "approved") {
      try {
        await publishCandidate(supabase, userId, parsed.data.candidateId)
      } catch (err) {
        console.error("publishCandidate (from reverse sync): unexpected error", err)
      }
    }
  }

  return { updated, skipped }
}
