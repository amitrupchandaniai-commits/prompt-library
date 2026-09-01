import "server-only"
import { createClient } from "@/lib/supabase/server"

export type PromptListItem = Awaited<ReturnType<typeof listPrompts>>["prompts"][number]

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
    .select(
      "id, title, description, slug, prompt_text, category_id, is_archived, user_rating, is_favorite:favorites(user_id), created_at, updated_at, categories(name, slug), prompt_tags(tags(id, name))",
      { count: "exact" }
    )
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
