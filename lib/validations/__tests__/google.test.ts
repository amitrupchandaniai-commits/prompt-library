import { describe, expect, it } from "vitest"
import { ReverseSyncRowSchema } from "@/lib/validations/google"

const VALID_ID = "123e4567-e89b-12d3-a456-426614174000"

describe("ReverseSyncRowSchema", () => {
  it("accepts a valid row", () => {
    const result = ReverseSyncRowSchema.safeParse({
      candidateId: VALID_ID,
      reviewStatus: "approved",
      reviewerNotes: "Looks good",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a row with no reviewer notes", () => {
    const result = ReverseSyncRowSchema.safeParse({
      candidateId: VALID_ID,
      reviewStatus: "pending",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid review status", () => {
    const result = ReverseSyncRowSchema.safeParse({
      candidateId: VALID_ID,
      reviewStatus: "definitely-approved",
    })
    expect(result.success).toBe(false)
  })

  it("rejects reviewer notes over 2000 characters", () => {
    const result = ReverseSyncRowSchema.safeParse({
      candidateId: VALID_ID,
      reviewStatus: "approved",
      reviewerNotes: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed candidate id", () => {
    const result = ReverseSyncRowSchema.safeParse({
      candidateId: "not-a-uuid",
      reviewStatus: "approved",
    })
    expect(result.success).toBe(false)
  })
})
