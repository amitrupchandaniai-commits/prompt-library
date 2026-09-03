import * as z from "zod"

// The only two columns ever read back from the "New Discoveries" sheet
// (docs/GOOGLE_INTEGRATION.md §4) — never permissions, security, or system
// configuration data, which aren't even present in the sheet to begin with.
export const REVIEW_STATUSES = ["pending", "approved", "rejected", "merged"] as const

export const ReverseSyncRowSchema = z.object({
  candidateId: z.string().uuid(),
  reviewStatus: z.enum(REVIEW_STATUSES),
  reviewerNotes: z.string().trim().max(2000).optional(),
})

export type ReverseSyncRow = z.infer<typeof ReverseSyncRowSchema>
