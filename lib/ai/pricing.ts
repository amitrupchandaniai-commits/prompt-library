/**
 * Per-model USD price per token, for cost logging (docs/AI_COST_CONTROL.md).
 * Keep this as the single place to update when pricing changes or a model is added.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic (per-token, derived from published per-MTok rates)
  "claude-opus-5": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  "claude-sonnet-5": { input: 2 / 1_000_000, output: 10 / 1_000_000 },
  "claude-haiku-4-5": { input: 1 / 1_000_000, output: 5 / 1_000_000 },

  // OpenAI (per-token). NOTE: not verified against a live pricing source in this
  // session the way the Anthropic rates above were — double-check against
  // https://openai.com/api/pricing before trusting these for real budget decisions.
  "gpt-5.1": { input: 1.25 / 1_000_000, output: 10 / 1_000_000 },
  "gpt-5.1-mini": { input: 0.25 / 1_000_000, output: 2 / 1_000_000 },
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rate = MODEL_PRICING[model]
  if (!rate) return 0
  return inputTokens * rate.input + outputTokens * rate.output
}
