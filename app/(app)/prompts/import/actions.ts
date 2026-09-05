"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"
import { parseImportFile, type ImportFormat } from "@/lib/export/import"
import { ImportedPromptSchema } from "@/lib/validations/import"

export type ImportState = {
  imported: number
  skipped: { row: number; reason: string }[]
  error?: string
} | undefined

function detectFormat(filename: string): ImportFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "json") return "json"
  if (ext === "csv") return "csv"
  if (ext === "txt") return "txt"
  return null
}

export async function importPrompts(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const user = await requireSession()
  const supabase = await createClient()

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { imported: 0, skipped: [], error: "Choose a file to import" }
  }

  const format = detectFormat(file.name)
  if (!format) {
    return { imported: 0, skipped: [], error: "Unsupported file type — use .json, .csv, or .txt" }
  }

  const text = await file.text()
  const rows = parseImportFile(format, text, file.name)

  const { data: categories } = await supabase.from("categories").select("id, name")
  const categoryByName = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]))

  let imported = 0
  const skipped: { row: number; reason: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.success) {
      skipped.push({ row: i + 1, reason: row.reason })
      continue
    }

    const validated = ImportedPromptSchema.safeParse(row.prompt)
    if (!validated.success) {
      skipped.push({ row: i + 1, reason: validated.error.issues[0]?.message ?? "Invalid data" })
      continue
    }

    const data = validated.data
    const baseSlug = slugify(data.title) || "imported-prompt"
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

    const categoryId = data.categoryName ? (categoryByName.get(data.categoryName.toLowerCase()) ?? null) : null

    const { data: created, error } = await supabase
      .from("prompts")
      .insert({
        user_id: user.id,
        title: data.title,
        slug,
        description: data.description || null,
        prompt_text: data.promptText,
        category_id: categoryId,
        use_case: data.useCase || null,
        difficulty: data.difficulty || null,
        instructions: data.instructions || null,
        notes: data.notes || null,
        variables: detectVariables(data.promptText),
      })
      .select("id")
      .single()

    if (error || !created) {
      skipped.push({ row: i + 1, reason: "Could not create the prompt" })
      continue
    }

    if (data.tags.length > 0) {
      const tagIds: string[] = []
      for (const name of data.tags) {
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", name)
          .maybeSingle()
        if (existingTag) {
          tagIds.push(existingTag.id)
        } else {
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ user_id: user.id, name })
            .select("id")
            .single()
          if (newTag) tagIds.push(newTag.id)
        }
      }
      if (tagIds.length > 0) {
        await supabase.from("prompt_tags").insert(tagIds.map((tagId) => ({ prompt_id: created.id, tag_id: tagId })))
      }
    }

    await supabase.from("prompt_versions").insert({
      prompt_id: created.id,
      version_number: 1,
      title: data.title,
      prompt_text: data.promptText,
      change_source: "original",
      created_by: user.id,
    })

    imported += 1
  }

  await logAuditEvent({
    userId: user.id,
    action: "import.completed",
    objectType: "prompts",
    newValue: { imported, skipped: skipped.length },
  })

  revalidatePath("/prompts")
  return { imported, skipped }
}
