"use server"

import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { getAIProvider } from "@/lib/ai"
import { logAiUsage } from "@/lib/ai/usage"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"
import { embedPrompt, embeddableContent } from "@/lib/ai/embed-prompt"
import {
  PromptBuilderInputSchema,
  PromptBuilderOutputSchema,
  type PromptBuilderOutput,
} from "@/lib/validations/prompt-builder"

export type BuilderFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  result?: PromptBuilderOutput
} | undefined

const SYSTEM_PROMPT = `You are an expert prompt engineer. Given a user's rough description of what they want AI to help with, plus whatever optional details they've provided, write a complete, professional, ready-to-use prompt.

Structure the prompt text with clear labeled sections in this order, but OMIT any section the user gave you nothing for — never write a section with invented or placeholder content:
ROLE, OBJECTIVE, CONTEXT, INPUT, INSTRUCTIONS, CONSTRAINTS, OUTPUT FORMAT, QUALITY CRITERIA

Where the user's own details would benefit from a variable placeholder for reuse (e.g. a company name, product, or audience mentioned only once), use {{VARIABLE_NAME}} syntax instead of hardcoding it.

Never invent facts, constraints, or requirements the user didn't provide. Preserve the user's intent exactly — you are formatting and structuring their request, not changing what they asked for.`

export async function buildPrompt(
  _prevState: BuilderFormState,
  formData: FormData
): Promise<BuilderFormState> {
  const user = await requireSession()

  const parsed = PromptBuilderInputSchema.safeParse({
    objective: formData.get("objective") || undefined,
    role: formData.get("role") || undefined,
    context: formData.get("context") || undefined,
    input: formData.get("input") || undefined,
    audience: formData.get("audience") || undefined,
    constraints: formData.get("constraints") || undefined,
    examples: formData.get("examples") || undefined,
    tone: formData.get("tone") || undefined,
    outputFormat: formData.get("outputFormat") || undefined,
    successCriteria: formData.get("successCriteria") || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const userPrompt = Object.entries(data)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n\n")

  const provider = getAIProvider("anthropic")
  const supabase = await createClient()

  try {
    const result = await provider.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: PromptBuilderOutputSchema,
      schemaName: "prompt_builder_output",
      maxTokens: 2048,
    })

    await logAiUsage(supabase, {
      userId: user.id,
      feature: "prompt_builder",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
    })

    return { result: result.data }
  } catch (err) {
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "prompt_builder",
      provider: provider.name,
      model: provider.model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    })
    return { error: "Couldn't generate a prompt right now. Please try again." }
  }
}

export async function saveBuiltPrompt(output: PromptBuilderOutput): Promise<{ id: string }> {
  const user = await requireSession()
  const supabase = await createClient()

  const baseSlug = slugify(output.title) || "prompt"
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
      title: output.title,
      slug,
      description: output.description,
      prompt_text: output.promptText,
      prompt_type: "AI Built",
      variables: detectVariables(output.promptText),
    })
    .select("id")
    .single()

  if (error || !created) {
    throw new Error("Could not save the prompt")
  }

  await supabase.from("prompt_versions").insert({
    prompt_id: created.id,
    version_number: 1,
    title: output.title,
    prompt_text: output.promptText,
    change_source: "original",
    created_by: user.id,
  })

  await embedPrompt(
    created.id,
    embeddableContent({
      title: output.title,
      description: output.description,
      promptText: output.promptText,
    })
  )

  return { id: created.id }
}
