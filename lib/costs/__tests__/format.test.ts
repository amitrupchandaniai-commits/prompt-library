import { describe, expect, it } from "vitest"
import { featureLabel, modelLabel, bucketKey } from "@/lib/costs/format"

describe("featureLabel", () => {
  it("maps known feature values", () => {
    expect(featureLabel("prompt_scout")).toBe("Prompt Scout")
  })

  it("falls back to the raw value for unmapped features", () => {
    expect(featureLabel("some_future_feature")).toBe("some_future_feature")
  })
})

describe("modelLabel", () => {
  it("maps known provider/model pairs", () => {
    expect(modelLabel("anthropic", "claude-sonnet-5")).toBe("Anthropic — Claude Sonnet 5")
  })

  it("falls back to raw values for unmapped provider/model", () => {
    expect(modelLabel("mystery-provider", "mystery-model")).toBe("mystery-provider — mystery-model")
  })
})

describe("bucketKey", () => {
  it("groups by day", () => {
    expect(bucketKey("2026-03-05T14:30:00Z", "day")).toBe("2026-03-05")
  })

  it("groups by month", () => {
    expect(bucketKey("2026-03-05T14:30:00Z", "month")).toBe("2026-03")
  })

  it("groups by week, anchored to the UTC Monday", () => {
    // 2026-03-05 is a Thursday; the week's Monday is 2026-03-02
    expect(bucketKey("2026-03-05T14:30:00Z", "week")).toBe("2026-03-02")
    // A Monday should bucket to itself
    expect(bucketKey("2026-03-02T00:00:00Z", "week")).toBe("2026-03-02")
    // A Sunday belongs to the week that started the prior Monday
    expect(bucketKey("2026-03-08T23:00:00Z", "week")).toBe("2026-03-02")
  })
})
