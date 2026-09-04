import { describe, expect, it } from "vitest"
import { estimateMaxCostUsd } from "@/lib/costs/estimate"

describe("estimateMaxCostUsd", () => {
  it("produces a sane positive estimate for a known model", () => {
    const estimate = estimateMaxCostUsd("claude-sonnet-5", "A".repeat(400), 2048)
    expect(estimate).toBeGreaterThan(0)
  })

  it("scales with prompt length", () => {
    const short = estimateMaxCostUsd("claude-sonnet-5", "A".repeat(40), 2048)
    const long = estimateMaxCostUsd("claude-sonnet-5", "A".repeat(4000), 2048)
    expect(long).toBeGreaterThan(short)
  })

  it("returns 0 for an unmapped model, matching estimateCostUsd's fallback", () => {
    expect(estimateMaxCostUsd("some-unknown-model", "hello", 2048)).toBe(0)
  })
})
