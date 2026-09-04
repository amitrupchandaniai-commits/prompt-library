import { MODEL_PRICING } from "@/lib/ai/pricing"

/**
 * Upper-bound pre-call cost estimate for Prompt Tester (docs/AI_COST_CONTROL.md §3:
 * "a simpler per-request cost estimate shown before the call where feasible").
 * Input tokens are a rough approximation (chars/4), not a real tokenizer — this is
 * meant to give a sense of scale before spending money, not an exact figure. Output
 * assumes the full maxTokens budget is used, so the real cost is usually lower.
 */
export function estimateMaxCostUsd(model: string, promptText: string, maxTokens: number): number {
  const rate = MODEL_PRICING[model]
  if (!rate) return 0

  const estimatedInputTokens = Math.ceil(promptText.length / 4)
  return estimatedInputTokens * rate.input + maxTokens * rate.output
}
