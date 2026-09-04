import { describe, expect, it } from "vitest"
import { summarize, byPeriod, byFeature, byModel, byResearchRun } from "@/lib/costs/aggregate"
import type { UsageRow } from "@/lib/costs/format"

const now = new Date()
const recent = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
const old = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

const rows: UsageRow[] = [
  { costUsd: 0.1, createdAt: recent, feature: "prompt_builder", provider: "anthropic", model: "claude-sonnet-5", researchRunId: null },
  { costUsd: 0.2, createdAt: recent, feature: "prompt_scout", provider: "anthropic", model: "claude-sonnet-5", researchRunId: "run-1" },
  { costUsd: 0.05, createdAt: old, feature: "prompt_scout", provider: "anthropic", model: "claude-haiku-4-5", researchRunId: "run-2" },
]

describe("summarize", () => {
  it("computes totals and this-week cost", () => {
    const result = summarize(rows)
    expect(result.totalCost).toBeCloseTo(0.35)
    expect(result.totalCalls).toBe(3)
    expect(result.avgCostPerCall).toBeCloseTo(0.35 / 3)
    expect(result.thisWeekCost).toBeCloseTo(0.3) // excludes the 30-day-old row
  })

  it("handles an empty row set without dividing by zero", () => {
    const result = summarize([])
    expect(result.totalCost).toBe(0)
    expect(result.totalCalls).toBe(0)
    expect(result.avgCostPerCall).toBe(0)
  })
})

describe("byFeature", () => {
  it("groups and sums by feature, sorted descending", () => {
    const result = byFeature(rows)
    expect(result[0]).toEqual({ label: "Prompt Scout", value: 0.25 })
    expect(result[1]).toEqual({ label: "Prompt Builder", value: 0.1 })
  })
})

describe("byModel", () => {
  it("groups and sums by provider+model label", () => {
    const result = byModel(rows)
    const sonnet = result.find((r) => r.label === "Anthropic — Claude Sonnet 5")
    expect(sonnet?.value).toBeCloseTo(0.3)
  })
})

describe("byPeriod", () => {
  it("buckets by day and sorts ascending", () => {
    const result = byPeriod(rows, "day")
    expect(result.length).toBe(2)
    expect(result[0].label < result[1].label).toBe(true)
  })
})

describe("byResearchRun", () => {
  it("joins totals against run metadata and sorts most-recent-first", () => {
    const runsById = new Map([
      ["run-1", { startedAt: "2026-03-05T00:00:00Z", status: "completed" }],
      ["run-2", { startedAt: "2026-02-01T00:00:00Z", status: "completed" }],
    ])
    const result = byResearchRun(rows, runsById)
    expect(result).toHaveLength(2)
    expect(result[0].runId).toBe("run-1")
    expect(result[0].cost).toBeCloseTo(0.2)
    expect(result[1].runId).toBe("run-2")
  })

  it("ignores rows with no research_run_id", () => {
    const result = byResearchRun(rows, new Map())
    expect(result.every((r) => r.runId !== undefined)).toBe(true)
    expect(result).toHaveLength(2) // only the two rows with a researchRunId
  })
})
