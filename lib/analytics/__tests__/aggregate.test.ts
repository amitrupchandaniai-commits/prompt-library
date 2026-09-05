import { describe, expect, it } from "vitest"
import { byCategory, bySource, byCreatedPeriod, averageRating, topTags, topFavorited, type PromptForAnalytics } from "@/lib/analytics/aggregate"

const prompts: PromptForAnalytics[] = [
  { id: "1", categoryName: "Coding", userRating: 5, createdAt: "2026-03-02T00:00:00Z", isOriginal: true, isAiDiscovered: false, isAiImproved: false },
  { id: "2", categoryName: "Coding", userRating: 3, createdAt: "2026-03-03T00:00:00Z", isOriginal: true, isAiDiscovered: false, isAiImproved: true },
  { id: "3", categoryName: null, userRating: null, createdAt: "2026-03-10T00:00:00Z", isOriginal: false, isAiDiscovered: true, isAiImproved: false },
]

describe("byCategory", () => {
  it("groups by category name, falling back to Uncategorized for null", () => {
    const result = byCategory(prompts)
    expect(result).toEqual(
      expect.arrayContaining([
        { label: "Coding", value: 2 },
        { label: "Uncategorized", value: 1 },
      ])
    )
  })
})

describe("bySource", () => {
  it("counts Original and AI-Discovered as mutually exclusive, covering every prompt", () => {
    const result = bySource(prompts)
    const original = result.find((r) => r.label === "Original")!.value
    const aiDiscovered = result.find((r) => r.label === "AI-Discovered")!.value
    expect(original + aiDiscovered).toBe(prompts.length)
  })

  it("counts AI-Improved independently (can overlap with Original)", () => {
    const result = bySource(prompts)
    expect(result.find((r) => r.label === "AI-Improved")!.value).toBe(1)
  })
})

describe("byCreatedPeriod", () => {
  it("buckets by week and sorts ascending", () => {
    const result = byCreatedPeriod(prompts, "week")
    expect(result.length).toBeGreaterThan(0)
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].label < result[i].label).toBe(true)
    }
  })
})

describe("averageRating", () => {
  it("averages only rated prompts, ignoring nulls", () => {
    expect(averageRating(prompts)).toBe(4) // (5 + 3) / 2
  })

  it("returns null when nothing is rated", () => {
    expect(averageRating(prompts.map((p) => ({ ...p, userRating: null })))).toBeNull()
  })
})

describe("topTags", () => {
  it("tallies, sorts descending, and respects the limit", () => {
    const result = topTags(["a", "b", "a", "c", "a", "b"], 2)
    expect(result).toEqual([
      { label: "a", value: 3 },
      { label: "b", value: 2 },
    ])
  })
})

describe("topFavorited", () => {
  it("sorts by count descending and respects the limit", () => {
    const result = topFavorited(
      [
        { promptId: "1", title: "One", count: 2 },
        { promptId: "2", title: "Two", count: 5 },
        { promptId: "3", title: "Three", count: 1 },
      ],
      2
    )
    expect(result).toEqual([
      { promptId: "2", title: "Two", count: 5 },
      { promptId: "1", title: "One", count: 2 },
    ])
  })
})
