import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ExportablePrompt } from "@/lib/export/types"

const EXPORT_SELECT =
  "title, description, prompt_text, use_case, difficulty, instructions, notes, example_input, example_output, created_at, categories(name), prompt_tags(tags(name))"

type ExportRow = {
  title: string
  description: string | null
  prompt_text: string
  use_case: string | null
  difficulty: string | null
  instructions: string | null
  notes: string | null
  example_input: string | null
  example_output: string | null
  created_at: string
  categories: { name: string } | null
  prompt_tags: { tags: { name: string } | null }[]
}

function toExportablePrompt(row: ExportRow): ExportablePrompt {
  return {
    title: row.title,
    description: row.description,
    promptText: row.prompt_text,
    categoryName: row.categories?.name ?? null,
    tags: row.prompt_tags.map((pt) => pt.tags?.name).filter((n): n is string => !!n),
    useCase: row.use_case,
    difficulty: row.difficulty,
    instructions: row.instructions,
    notes: row.notes,
    exampleInput: row.example_input,
    exampleOutput: row.example_output,
    createdAt: row.created_at,
  }
}

export async function getExportablePrompt(userId: string, id: string): Promise<ExportablePrompt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select(EXPORT_SELECT)
    .eq("user_id", userId)
    .eq("id", id)
    .single()

  if (error || !data) return []
  return [toExportablePrompt(data as unknown as ExportRow)]
}

export async function getExportableCollection(userId: string, collectionId: string): Promise<ExportablePrompt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select(`id, collection_prompts(prompts(${EXPORT_SELECT}))`)
    .eq("user_id", userId)
    .eq("id", collectionId)
    .single()

  if (error || !data) return []

  const rows = (data.collection_prompts as { prompts: ExportRow | null }[])
    .map((cp) => cp.prompts)
    .filter((p): p is ExportRow => p !== null)

  return rows.map(toExportablePrompt)
}

export async function getExportableLibrary(userId: string): Promise<ExportablePrompt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select(EXPORT_SELECT)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return (data as unknown as ExportRow[]).map(toExportablePrompt)
}
