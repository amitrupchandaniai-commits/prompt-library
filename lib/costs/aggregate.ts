import { bucketKey, featureLabel, modelLabel, type Granularity, type UsageRow } from "./format"

export function summarize(rows: UsageRow[]) {
  const totalCost = rows.reduce((sum, r) => sum + r.costUsd, 0)
  const totalCalls = rows.length
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const thisWeekCost = rows
    .filter((r) => new Date(r.createdAt).getTime() >= sevenDaysAgo)
    .reduce((sum, r) => sum + r.costUsd, 0)

  return { totalCost, totalCalls, avgCostPerCall, thisWeekCost }
}

export type Bar = { label: string; value: number }

export function byPeriod(rows: UsageRow[], granularity: Granularity): Bar[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const key = bucketKey(row.createdAt, granularity)
    totals.set(key, (totals.get(key) ?? 0) + row.costUsd)
  }
  return [...totals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, value]) => ({ label, value }))
}

export function byFeature(rows: UsageRow[]): Bar[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const key = featureLabel(row.feature)
    totals.set(key, (totals.get(key) ?? 0) + row.costUsd)
  }
  return [...totals.entries()].sort(([, a], [, b]) => b - a).map(([label, value]) => ({ label, value }))
}

export function byModel(rows: UsageRow[]): Bar[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const key = modelLabel(row.provider, row.model)
    totals.set(key, (totals.get(key) ?? 0) + row.costUsd)
  }
  return [...totals.entries()].sort(([, a], [, b]) => b - a).map(([label, value]) => ({ label, value }))
}

export type ResearchRunCost = {
  runId: string
  startedAt: string
  status: string
  cost: number
}

/**
 * `runsById` supplies started_at/status for each research_runs row referenced
 * by these usage rows — a separate table, so it's passed in rather than
 * queried here (keeps this function pure and testable).
 */
export function byResearchRun(
  rows: UsageRow[],
  runsById: Map<string, { startedAt: string; status: string }>
): ResearchRunCost[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    if (!row.researchRunId) continue
    totals.set(row.researchRunId, (totals.get(row.researchRunId) ?? 0) + row.costUsd)
  }

  return [...totals.entries()]
    .map(([runId, cost]) => {
      const run = runsById.get(runId)
      return {
        runId,
        startedAt: run?.startedAt ?? "",
        status: run?.status ?? "unknown",
        cost,
      }
    })
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}
