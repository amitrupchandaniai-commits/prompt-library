import "server-only"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "./embeddings"

/**
 * Refreshes a prompt's embedding after it's created/edited/improved/restored.
 * Best-effort: without OPENAI_API_KEY configured, or on any failure, this is a
 * no-op — semantic search silently falls back to keyword search for that
 * prompt rather than blocking the save that triggered it.
 */
export async function embedPrompt(promptId: string, content: string) {
  if (!process.env.OPENAI_API_KEY) return

  try {
    const embedding = await generateEmbedding(content)
    const supabase = await createClient()
    const { error } = await supabase.from("prompts").update({ embedding }).eq("id", promptId)
    if (error) console.error("embedPrompt: update failed", promptId, error)
  } catch (err) {
    console.error("embedPrompt: unexpected error", promptId, err)
  }
}

export function embeddableContent(input: {
  title: string
  description?: string | null
  promptText: string
}): string {
  return [input.title, input.description, input.promptText].filter(Boolean).join("\n\n")
}
