import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { estimateCostUsd } from "./pricing"
import type { AIProviderName } from "./types"

/**
 * Every AI call logs here before its result is trusted (docs/AI_COST_CONTROL.md) —
 * this is a thin, mandatory side effect, not an afterthought bolted onto each feature.
 * Best-effort: a logging failure must never take down the feature that triggered it.
 *
 * Takes an injected Supabase client rather than creating one itself, since callers
 * differ in context: a Next.js request has cookies to build a session-scoped client
 * from, but a Trigger.dev scheduled job has no session at all and must pass a
 * service-role client instead.
 */
export async function logAiUsage(
  supabase: SupabaseClient<Database>,
  entry: {
    userId: string | null
    feature: string
    provider: AIProviderName
    model: string
    inputTokens: number
    outputTokens: number
    latencyMs: number
    error?: string
  }
) {
  try {
    const costUsd = estimateCostUsd(entry.model, entry.inputTokens, entry.outputTokens)

    const { error } = await supabase.from("ai_usage_log").insert({
      user_id: entry.userId,
      feature: entry.feature,
      provider: entry.provider,
      model: entry.model,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      latency_ms: entry.latencyMs,
      cost_usd: costUsd,
      error: entry.error ?? null,
    })

    if (error) console.error("logAiUsage: insert failed", error)
    return costUsd
  } catch (err) {
    console.error("logAiUsage: unexpected error", err)
    return 0
  }
}
