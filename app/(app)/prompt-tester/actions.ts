"use server"

import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { getAIProvider } from "@/lib/ai"
import { logAiUsage } from "@/lib/ai/usage"
import { TesterInputSchema, type TesterModelSelection } from "@/lib/validations/prompt-tester"

const MAX_TOKENS = 2048

export type TestResult = {
  provider: string
  model: string
  text?: string
  error?: string
  inputTokens: number
  outputTokens: number
  cost: number
  latencyMs: number
}

export async function runPromptTest(
  promptText: string,
  selections: TesterModelSelection[]
): Promise<TestResult[]> {
  const user = await requireSession()
  const parsed = TesterInputSchema.safeParse({ promptText })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid prompt text")
  if (selections.length === 0) throw new Error("Select at least one model to test")

  const supabase = await createClient()

  const outcomes = await Promise.allSettled(
    selections.map(async (selection) => {
      const provider = getAIProvider(selection.provider, selection.model)
      const result = await provider.generateText({
        prompt: parsed.data.promptText,
        maxTokens: MAX_TOKENS,
      })

      const cost = await logAiUsage(supabase, {
        userId: user.id,
        feature: "prompt_tester",
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
      })

      return {
        provider: selection.provider,
        model: selection.model,
        text: result.text,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost,
        latencyMs: result.latencyMs,
      } satisfies TestResult
    })
  )

  return Promise.all(
    outcomes.map(async (outcome, i) => {
      const selection = selections[i]
      if (outcome.status === "fulfilled") return outcome.value

      const message = outcome.reason instanceof Error ? outcome.reason.message : "Unknown error"
      await logAiUsage(supabase, {
        userId: user.id,
        feature: "prompt_tester",
        provider: selection.provider,
        model: selection.model,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        error: message,
      })

      return {
        provider: selection.provider,
        model: selection.model,
        error: message,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        latencyMs: 0,
      } satisfies TestResult
    })
  )
}

/** Merges newly-tested model ids into a library prompt's tested_models column (deduped). */
export async function recordTestedModels(promptId: string, models: string[]): Promise<void> {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("prompts")
    .select("tested_models")
    .eq("id", promptId)
    .eq("user_id", user.id)
    .single()

  if (!existing) return

  const merged = [...new Set([...existing.tested_models, ...models])]
  await supabase
    .from("prompts")
    .update({ tested_models: merged })
    .eq("id", promptId)
    .eq("user_id", user.id)
}
