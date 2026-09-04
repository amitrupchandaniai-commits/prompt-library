export const FEATURE_LABELS: Record<string, string> = {
  prompt_builder: "Prompt Builder",
  prompt_improver: "Prompt Improver",
  prompt_tester: "Prompt Tester",
  prompt_scout: "Prompt Scout",
  classification: "Classification",
}

export function featureLabel(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
}

const MODEL_LABELS: Record<string, string> = {
  "claude-opus-5": "Claude Opus 5",
  "claude-sonnet-5": "Claude Sonnet 5",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "gpt-5.1": "GPT-5.1",
  "gpt-5.1-mini": "GPT-5.1 Mini",
}

export function modelLabel(provider: string, model: string): string {
  const providerName = PROVIDER_LABELS[provider] ?? provider
  const modelName = MODEL_LABELS[model] ?? model
  return `${providerName} — ${modelName}`
}

export type UsageRow = {
  costUsd: number
  createdAt: string
  feature: string
  provider: string
  model: string
  researchRunId: string | null
}

export type Granularity = "day" | "week" | "month"

/**
 * Groups an ISO timestamp into its bucket key for the given granularity.
 * Week buckets use the UTC Monday of that week (ISO-ish, not calendar-locale
 * dependent) so bucketing is stable regardless of the caller's timezone.
 */
export function bucketKey(isoDate: string, granularity: Granularity): string {
  const date = new Date(isoDate)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  if (granularity === "month") {
    return `${year}-${String(month + 1).padStart(2, "0")}`
  }

  if (granularity === "day") {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  // week: Monday of the UTC week containing this date
  const utcDate = new Date(Date.UTC(year, month, day))
  const dayOfWeek = utcDate.getUTCDay() // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday)
  return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, "0")}-${String(utcDate.getUTCDate()).padStart(2, "0")}`
}
