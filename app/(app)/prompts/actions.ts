"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"
import { PromptSchema } from "@/lib/validations/prompt"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"

export type PromptFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | undefined

function parsePromptForm(formData: FormData) {
  return PromptSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    promptText: formData.get("promptText"),
    categoryId: formData.get("categoryId"),
    subcategory: formData.get("subcategory"),
    useCase: formData.get("useCase"),
    industry: formData.get("industry"),
    difficulty: formData.get("difficulty"),
    promptType: formData.get("promptType"),
    recommendedModels: (formData.get("recommendedModels") as string | null)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
    exampleInput: formData.get("exampleInput"),
    exampleOutput: formData.get("exampleOutput"),
    instructions: formData.get("instructions"),
    notes: formData.get("notes"),
    tags: (formData.get("tags") as string | null)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
  })
}

async function syncTags(userId: string, promptId: string, tagNames: string[]) {
  const supabase = await createClient()

  await supabase.from("prompt_tags").delete().eq("prompt_id", promptId)

  if (tagNames.length === 0) return

  const tagIds: string[] = []
  for (const name of tagNames) {
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", name)
      .maybeSingle()

    if (existing) {
      tagIds.push(existing.id)
    } else {
      const { data: created, error } = await supabase
        .from("tags")
        .insert({ user_id: userId, name })
        .select("id")
        .single()
      if (error) throw error
      tagIds.push(created.id)
    }
  }

  await supabase
    .from("prompt_tags")
    .insert(tagIds.map((tagId) => ({ prompt_id: promptId, tag_id: tagId })))
}

export async function createPrompt(
  _prevState: PromptFormState,
  formData: FormData
): Promise<PromptFormState> {
  const user = await requireSession()
  const parsed = parsePromptForm(formData)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const data = parsed.data
  const baseSlug = slugify(data.title) || "prompt"

  let slug = baseSlug
  let attempt = 1
  // Slugs are unique per user; append -2, -3, ... on collision.
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
      title: data.title,
      slug,
      description: data.description || null,
      prompt_text: data.promptText,
      category_id: data.categoryId || null,
      subcategory: data.subcategory || null,
      use_case: data.useCase || null,
      industry: data.industry || null,
      difficulty: data.difficulty || null,
      prompt_type: data.promptType || null,
      recommended_models: data.recommendedModels,
      variables: detectVariables(data.promptText),
      example_input: data.exampleInput || null,
      example_output: data.exampleOutput || null,
      instructions: data.instructions || null,
      notes: data.notes || null,
    })
    .select("id")
    .single()

  if (error || !created) {
    return { error: "Could not create the prompt. Please try again." }
  }

  await syncTags(user.id, created.id, data.tags)

  await supabase.from("prompt_versions").insert({
    prompt_id: created.id,
    version_number: 1,
    title: data.title,
    prompt_text: data.promptText,
    change_source: "original",
    created_by: user.id,
  })

  await logAuditEvent({
    userId: user.id,
    action: "prompt.created",
    objectType: "prompt",
    objectId: created.id,
    newValue: { title: data.title },
  })

  revalidatePath("/prompts")
  revalidatePath("/dashboard")
  redirect(`/prompts/${created.id}`)
}

export async function updatePrompt(
  promptId: string,
  _prevState: PromptFormState,
  formData: FormData
): Promise<PromptFormState> {
  const user = await requireSession()
  const parsed = parsePromptForm(formData)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const data = parsed.data

  const { data: existing } = await supabase
    .from("prompts")
    .select("id, title, prompt_text")
    .eq("id", promptId)
    .eq("user_id", user.id)
    .single()

  if (!existing) {
    return { error: "Prompt not found." }
  }

  const { error } = await supabase
    .from("prompts")
    .update({
      title: data.title,
      description: data.description || null,
      prompt_text: data.promptText,
      category_id: data.categoryId || null,
      subcategory: data.subcategory || null,
      use_case: data.useCase || null,
      industry: data.industry || null,
      difficulty: data.difficulty || null,
      prompt_type: data.promptType || null,
      recommended_models: data.recommendedModels,
      variables: detectVariables(data.promptText),
      example_input: data.exampleInput || null,
      example_output: data.exampleOutput || null,
      instructions: data.instructions || null,
      notes: data.notes || null,
    })
    .eq("id", promptId)
    .eq("user_id", user.id)

  if (error) {
    return { error: "Could not update the prompt. Please try again." }
  }

  await syncTags(user.id, promptId, data.tags)

  const textChanged =
    existing.title !== data.title || existing.prompt_text !== data.promptText
  if (textChanged) {
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
      title: data.title,
      prompt_text: data.promptText,
      change_source: "user_edit",
      created_by: user.id,
    })
  }

  await logAuditEvent({
    userId: user.id,
    action: "prompt.updated",
    objectType: "prompt",
    objectId: promptId,
    previousValue: { title: existing.title },
    newValue: { title: data.title },
  })

  revalidatePath("/prompts")
  revalidatePath(`/prompts/${promptId}`)
  revalidatePath("/dashboard")
  redirect(`/prompts/${promptId}`)
}

export async function setPromptArchived(promptId: string, archived: boolean) {
  const user = await requireSession()
  const supabase = await createClient()

  const { error } = await supabase
    .from("prompts")
    .update({ is_archived: archived })
    .eq("id", promptId)
    .eq("user_id", user.id)

  if (error) throw error

  await logAuditEvent({
    userId: user.id,
    action: archived ? "prompt.archived" : "prompt.unarchived",
    objectType: "prompt",
    objectId: promptId,
  })

  revalidatePath("/prompts")
  revalidatePath(`/prompts/${promptId}`)
  revalidatePath("/dashboard")
}

export async function deletePrompt(promptId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", promptId)
    .eq("user_id", user.id)

  if (error) throw error

  await logAuditEvent({
    userId: user.id,
    action: "prompt.deleted",
    objectType: "prompt",
    objectId: promptId,
  })

  revalidatePath("/prompts")
  revalidatePath("/dashboard")
  redirect("/prompts")
}

export async function toggleFavorite(promptId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("favorites")
    .select("prompt_id")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("prompt_id", promptId)
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, prompt_id: promptId })
  }

  revalidatePath("/prompts")
  revalidatePath(`/prompts/${promptId}`)
  revalidatePath("/favorites")
  revalidatePath("/dashboard")
}

export async function ratePrompt(promptId: string, rating: number) {
  const user = await requireSession()
  const supabase = await createClient()

  const { error } = await supabase
    .from("prompts")
    .update({ user_rating: rating })
    .eq("id", promptId)
    .eq("user_id", user.id)

  if (error) throw error

  revalidatePath(`/prompts/${promptId}`)
  revalidatePath("/dashboard")
}
