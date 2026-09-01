import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function listCollections(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, description, created_at, collection_prompts(prompt_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getCollectionById(userId: string, id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select(
      "id, name, description, created_at, collection_prompts(prompt_id, prompts(id, title, description, created_at))"
    )
    .eq("user_id", userId)
    .eq("id", id)
    .single()

  if (error) return null
  return data
}
