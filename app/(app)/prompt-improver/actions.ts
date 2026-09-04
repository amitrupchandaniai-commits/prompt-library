"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { getAIProvider } from "@/lib/ai"
import { logAiUsage } from "@/lib/ai/usage"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"
import { embedPrompt, embeddableContent } from "@/lib/ai/embed-prompt"
import {
  ImproverInputSchema,
  ImproverOutputSchema,
  type ImproverOutput,
} from "@/lib/validations/prompt-improver"

export type ImproverFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  result?: ImproverOutput
  originalPromptText?: string
} | undefined

const SYSTEM_PROMPT = `You are an expert prompt engineer reviewing a prompt someone else wrote. Analyze it and produce an improved version.

Score these seven dimensions from 0-100, based on the prompt AS WRITTEN:
- clarity: is the instruction unambiguous?
- context: does it give the model enough background to succeed?
- specificity: are requirements concrete rather than vague?
- structure: is it organized and easy to follow?
- constraints: are limits/boundaries defined where they'd help?
- outputDefinition: is the expected output format/shape clear?
- reusability: could this be reused with different inputs (e.g. via variables) without rewriting it?

List specific problemsFound (not generic advice — reference what's actually missing or unclear in THIS prompt) and specific recommendations that address them.

Then write improvedPrompt: a rewritten version that fixes the problems found. CRITICAL RULE: never change what the user is actually trying to accomplish. You are improving clarity, structure, and completeness — not changing the goal, scope, or subject matter. If the original prompt is ambiguous about intent, preserve the most plausible reading rather than guessing something different.

Finally, write a short explanation of what changed and why.`

export async function improvePrompt(
  _prevState: ImproverFormState,
  formData: FormData
): Promise<ImproverFormState> {
  const user = await requireSession()

  const parsed = ImproverInputSchema.safeParse({
    promptText: formData.get("promptText"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const provider = getAIProvider("anthropic")
  const supabase = await createClient()

  try {
    const result = await provider.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: parsed.data.promptText,
      schema: ImproverOutputSchema,
      schemaName: "prompt_improver_output",
      // 3072 was too low: this schema's output (7 scores + problemsFound +
      // recommendations + a full rewritten prompt + explanation) is the most
      // verbose structured output in the app, and got cut off mid-JSON for
      // longer inputs — the Anthropic SDK's structured-output parser can't
      // recover from truncated JSON, so this silently failed for anyone
      // improving a longer prompt.
      maxTokens: 8192,
    })

    await logAiUsage(supabase, {
      userId: user.id,
      feature: "prompt_improver",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
    })

    return { result: result.data, originalPromptText: parsed.data.promptText }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "prompt_improver",
      provider: provider.name,
      model: provider.model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      error: message,
    })
    const truncated = /unterminated string|failed to parse structured output/i.test(message)
    return {
      error: truncated
        ? "This prompt is too long for a full analysis right now. Try a shorter prompt, or split it into smaller parts."
        : "Couldn't analyze this prompt right now. Please try again.",
    }
  }
}

/** Applies an improvement to an existing library prompt as a new version — never overwrites the original. */
export async function applyImprovementToPrompt(
  promptId: string,
  improvedPrompt: string
): Promise<{ id: string }> {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("prompts")
    .select("id, title, prompt_text, original_prompt")
    .eq("id", promptId)
    .eq("user_id", user.id)
    .single()

  if (!existing) throw new Error("Prompt not found")

  const { error } = await supabase
    .from("prompts")
    .update({
      prompt_text: improvedPrompt,
      is_ai_improved: true,
      improved_prompt: improvedPrompt,
      original_prompt: existing.original_prompt ?? existing.prompt_text,
      variables: detectVariables(improvedPrompt),
    })
    .eq("id", promptId)
    .eq("user_id", user.id)

  if (error) throw new Error("Could not save the improved prompt")

  const { data: lastVersion } = await supabase
    .from("prompt_versions")
    .select("version_number")
    .eq("prompt_id", promptId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase.from("prompt_versions").insert({
    prompt_id: promptId,
    version_number: (lastVersion?.version_number ?? 0) + 1,
    title: existing.title,
    prompt_text: improvedPrompt,
    change_source: "ai_improved",
    created_by: user.id,
  })

  await embedPrompt(promptId, embeddableContent({ title: existing.title, promptText: improvedPrompt }))

  revalidatePath(`/prompts/${promptId}`)
  revalidatePath("/prompts")
  return { id: promptId }
}

/** Saves an improved prompt (from pasted text with no library prompt behind it) as a brand-new prompt. */
export async function saveImprovedAsNewPrompt(
  originalPromptText: string,
  improvedPrompt: string
): Promise<{ id: string }> {
  const user = await requireSession()
  const supabase = await createClient()

  const title = improvedPrompt.split("\n")[0]?.slice(0, 80).trim() || "Improved Prompt"
  const baseSlug = slugify(title) || "improved-prompt"

  let slug = baseSlug
  let attempt = 1
  while (true) {
    const { data: existing } = await supabase
      .from("prompts")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle()
    if (!existing) break
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  const { data: created, error } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      title,
      slug,
      prompt_text: improvedPrompt,
      prompt_type: "AI Improved",
      is_original: false,
      is_ai_improved: true,
      original_prompt: originalPromptText,
      improved_prompt: improvedPrompt,
      variables: detectVariables(improvedPrompt),
    })
    .select("id")
    .single()

  if (error || !created) throw new Error("Could not save the prompt")

  await supabase.from("prompt_versions").insert({
    prompt_id: created.id,
    version_number: 1,
    title,
    prompt_text: improvedPrompt,
    change_source: "ai_improved",
    created_by: user.id,
  })

  await embedPrompt(created.id, embeddableContent({ title, promptText: improvedPrompt }))

  return { id: created.id }
}
