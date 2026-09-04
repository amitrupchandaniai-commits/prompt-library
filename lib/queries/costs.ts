import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { UsageRow } from "@/lib/costs/format"
import { byResearchRun, type ResearchRunCost } from "@/lib/costs/aggregate"

/** Raw ai_usage_log rows for this user — the shared input every cost view derives from. */
export async function getUsageRows(userId: string): Promise<UsageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_usage_log")
    .select("cost_usd, created_at, feature, provider, model, research_run_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    costUsd: row.cost_usd,
    createdAt: row.created_at,
    feature: row.feature,
    provider: row.provider,
    model: row.model,
    researchRunId: row.research_run_id,
  }))
}

export async function getCostByResearchRun(rows: UsageRow[]): Promise<ResearchRunCost[]> {
  const runIds = [...new Set(rows.map((r) => r.researchRunId).filter((id): id is string => id !== null))]
  if (runIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("research_runs")
    .select("id, started_at, status")
    .in("id", runIds)

  if (error) throw error

  const runsById = new Map((data ?? []).map((run) => [run.id, { startedAt: run.started_at, status: run.status }]))
  return byResearchRun(rows, runsById)
}
