"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"
import { PromptSchema } from "@/lib/validations/prompt"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"
import { embedPrompt, embeddableContent } from "@/lib/ai/embed-prompt"
import { exportToDrive } from "@/lib/export/drive"
import type { ExportFormat, ExportScope } from "@/lib/export/types"

export type PromptFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | undefined

/**
 * FormData.get() returns null for a field that isn't present at all (e.g. no
 * matching input was rendered) or is empty, but Zod's `.optional()` only
 * accepts `undefined`, not `null` — so an absent field fails validation
 * instead of being treated as "not provided". Normalize here so every
 * optional field behaves the same way regardless of why it's empty.
 */
function optionalField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function parsePromptForm(formData: FormData) {
  return PromptSchema.safeParse({
    title: formData.get("title"),
    description: optionalField(formData, "description"),
    promptText: formData.get("promptText"),
    categoryId: optionalField(formData, "categoryId"),
    subcategory: optionalField(formData, "subcategory"),
    useCase: optionalField(formData, "useCase"),
    industry: optionalField(formData, "industry"),
    difficulty: optionalField(formData, "difficulty"),
    promptType: optionalField(formData, "promptType"),
    recommendedModels: (formData.get("recommendedModels") as string | null)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
    exampleInput: optionalField(formData, "exampleInput"),
    exampleOutput: optionalField(formData, "exampleOutput"),
    instructions: optionalField(formData, "instructions"),
    notes: optionalField(formData, "notes"),
    tags: (formData.get("tags") as string | null)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
  })
}

/**
 * Best-effort: a tag failure should never take down prompt creation/editing,
 * since the prompt itself has already been saved by the time this runs.
 */
async function syncTags(userId: string, promptId: string, tagNames: string[]) {
  const supabase = await createClient()

  try {
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
        continue
      }

      const { data: created, error } = await supabase
        .from("tags")
        .insert({ user_id: userId, name })
        .select("id")
        .single()
      if (error || !created) {
        console.error("syncTags: failed to create tag", name, error)
        continue
      }
      tagIds.push(created.id)
    }

    if (tagIds.length === 0) return

    const { error: linkError } = await supabase
      .from("prompt_tags")
      .insert(tagIds.map((tagId) => ({ prompt_id: promptId, tag_id: tagId })))
    if (linkError) {
      console.error("syncTags: failed to link tags to prompt", promptId, linkError)
    }
  } catch (err) {
    console.error("syncTags: unexpected error", err)
  }
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

  await embedPrompt(
    created.id,
    embeddableContent({ title: data.title, description: data.description, promptText: data.promptText })
  )

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

    await embedPrompt(
      promptId,
      embeddableContent({ title: data.title, description: data.description, promptText: data.promptText })
    )
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

/** Makes an old version the live prompt text again — as a new version, never by deleting history. */
export async function restoreVersion(promptId: string, versionId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: version } = await supabase
    .from("prompt_versions")
    .select("title, prompt_text")
    .eq("id", versionId)
    .eq("prompt_id", promptId)
    .single()

  if (!version) throw new Error("Version not found")

  const { error: updateError } = await supabase
    .from("prompts")
    .update({
      title: version.title,
      prompt_text: version.prompt_text,
      variables: detectVariables(version.prompt_text),
    })
    .eq("id", promptId)
    .eq("user_id", user.id)

  if (updateError) throw new Error("Could not restore this version")

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
    title: version.title,
    prompt_text: version.prompt_text,
    change_source: "restored",
    created_by: user.id,
  })

  await embedPrompt(
    promptId,
    embeddableContent({ title: version.title, promptText: version.prompt_text })
  )

  await logAuditEvent({
    userId: user.id,
    action: "prompt.version_restored",
    objectType: "prompt",
    objectId: promptId,
  })

  revalidatePath(`/prompts/${promptId}`)
  revalidatePath("/prompts")
}

export async function exportToDriveAction(
  scope: ExportScope,
  id: string | null,
  format: ExportFormat
): Promise<{ fileId: string; webViewLink: string | null }> {
  const user = await requireSession()
  const supabase = await createClient()

  const result = await exportToDrive(supabase, user.id, scope, id, format)

  await logAuditEvent({
    userId: user.id,
    action: "export.completed",
    objectType: scope,
    objectId: id ?? undefined,
    newValue: { format, destination: "drive", fileId: result.fileId },
  })

  return result
}
