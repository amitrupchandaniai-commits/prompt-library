import { describe, expect, it } from "vitest"
import { buildUserStats, type AuthUserSummary } from "@/lib/admin/stats"

const users: AuthUserSummary[] = [
  { id: "u1", email: "first@example.com", createdAt: "2026-01-01T00:00:00Z", lastSignInAt: "2026-01-02T00:00:00Z" },
  { id: "u2", email: "second@example.com", createdAt: "2026-01-03T00:00:00Z", lastSignInAt: null },
]

describe("buildUserStats", () => {
  it("defaults counts to 0 for a user with no activity", () => {
    const stats = buildUserStats(users, new Map(), new Map(), new Map())
    const first = stats.find((s) => s.id === "u1")!
    expect(first.promptCount).toBe(0)
    expect(first.scoutApproved).toBe(0)
    expect(first.scoutRejected).toBe(0)
  })

  it("applies counts from the provided maps", () => {
    const stats = buildUserStats(
      users,
      new Map([["u1", 5]]),
      new Map([["u1", 2]]),
      new Map([["u2", 1]])
    )
    const first = stats.find((s) => s.id === "u1")!
    const second = stats.find((s) => s.id === "u2")!
    expect(first.promptCount).toBe(5)
    expect(first.scoutApproved).toBe(2)
    expect(second.scoutRejected).toBe(1)
  })

  it("sorts by createdAt descending", () => {
    const stats = buildUserStats(users, new Map(), new Map(), new Map())
    expect(stats.map((s) => s.id)).toEqual(["u2", "u1"])
  })
})
