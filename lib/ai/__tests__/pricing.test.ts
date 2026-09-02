import { describe, expect, it } from "vitest"
import { estimateCostUsd } from "@/lib/ai/pricing"

describe("estimateCostUsd", () => {
  it("computes cost from input and output token counts", () => {
    const cost = estimateCostUsd("claude-sonnet-5", 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(2 + 10, 5)
  })

  it("returns 0 for an unknown model instead of throwing", () => {
    expect(estimateCostUsd("some-future-model", 1000, 1000)).toBe(0)
  })

  it("returns 0 for zero tokens", () => {
    expect(estimateCostUsd("claude-opus-5", 0, 0)).toBe(0)
  })
})
