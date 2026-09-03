import "server-only"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "@/lib/ai/embeddings"

export type PromptListItem = Awaited<ReturnType<typeof listPrompts>>["prompts"][number]

const PROMPT_LIST_SELECT =
  "id, title, description, slug, prompt_text, category_id, is_archived, user_rating, is_favorite:favorites(user_id), created_at, updated_at, categories(name, slug), prompt_tags(tags(id, name))"

export async function listPrompts(opts: {
  userId: string
  search?: string
  categoryId?: string
  favoritesOnly?: boolean
  includeArchived?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from("prompts")
    .select(PROMPT_LIST_SELECT, { count: "exact" })
    .eq("user_id", opts.userId)
    .order("created_at", { ascending: false })

  if (!opts.includeArchived) {
    query = query.eq("is_archived", false)
  }

  if (opts.categoryId) {
    query = query.eq("category_id", opts.categoryId)
  }

  if (opts.search && opts.search.trim().length > 0) {
    const term = opts.search.trim().replace(/[%_]/g, "")
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,prompt_text.ilike.%${term}%`
    )
  }

  const { data, error, count } = await query

  if (error) throw error

  let prompts = data ?? []

  if (opts.favoritesOnly) {
    prompts = prompts.filter((p) => (p.is_favorite?.length ?? 0) > 0)
  }

  return { prompts, count: count ?? 0 }
}

/**
 * Natural-language search over the user's own prompts via pgvector cosine similarity
 * (see match_prompts in supabase/migrations/0010_semantic_search.sql). Throws if
 * OPENAI_API_KEY isn't configured or the embedding call fails — callers should catch
 * and fall back to listPrompts()'s keyword search rather than surface an error for
 * what's meant to be a graceful degradation.
 */
export async function searchPromptsSemantic(opts: {
  userId: string
  query: string
  categoryId?: string
  favoritesOnly?: boolean
  limit?: number
}) {
  const supabase = await createClient()
  const queryEmbedding = await generateEmbedding(opts.query)

  const { data: matches, error: matchError } = await supabase.rpc("match_prompts", {
    query_embedding: queryEmbedding,
    match_user_id: opts.userId,
    match_category_id: opts.categoryId || undefined,
    match_count: opts.limit ?? 50,
  })

  if (matchError) throw matchError
  if (!matches || matches.length === 0) return { prompts: [], count: 0 }

  const similarityById = new Map(matches.map((m) => [m.id, m.similarity]))

  const { data, error } = await supabase
    .from("prompts")
    .select(PROMPT_LIST_SELECT)
    .eq("user_id", opts.userId)
    .in(
      "id",
      matches.map((m) => m.id)
    )

  if (error) throw error

  let prompts = (data ?? []).sort(
    (a, b) => (similarityById.get(b.id) ?? 0) - (similarityById.get(a.id) ?? 0)
  )

  if (opts.favoritesOnly) {
    prompts = prompts.filter((p) => (p.is_favorite?.length ?? 0) > 0)
  }

  return { prompts, count: prompts.length }
}

export async function getPromptById(userId: string, id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select(
      "*, categories(id, name, slug), prompt_tags(tags(id, name)), favorites(user_id)"
    )
    .eq("user_id", userId)
    .eq("id", id)
    .single()

  if (error) return null
  return data
}

export async function listCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function listPromptVersions(promptId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("version_number", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getDashboardStats(userId: string) {
  const supabase = await createClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [totalPrompts, addedThisWeek, favoritesCount, collectionsCount] = await Promise.all([
    supabase
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false),
    supabase
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false)
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("favorites")
      .select("prompt_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ])

  return {
    totalPrompts: totalPrompts.count ?? 0,
    addedThisWeek: addedThisWeek.count ?? 0,
    favoritesCount: favoritesCount.count ?? 0,
    collectionsCount: collectionsCount.count ?? 0,
  }
}

export async function listRecentPrompts(userId: string, limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select("id, title, description, created_at, categories(name)")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function listTopRatedPrompts(userId: string, limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select("id, title, description, user_rating, categories(name)")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .not("user_rating", "is", null)
    .order("user_rating", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
