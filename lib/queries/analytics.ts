import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { PromptForAnalytics, FavoriteCount } from "@/lib/analytics/aggregate"

export async function getAnalyticsPrompts(userId: string): Promise<PromptForAnalytics[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select("id, user_rating, created_at, is_original, is_ai_discovered, is_ai_improved, categories(name)")
    .eq("user_id", userId)
    .eq("is_archived", false)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    categoryName: (row.categories as { name: string } | null)?.name ?? null,
    userRating: row.user_rating,
    createdAt: row.created_at,
    isOriginal: row.is_original,
    isAiDiscovered: row.is_ai_discovered,
    isAiImproved: row.is_ai_improved,
  }))
}

export async function getTagNames(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select("prompt_tags(tags(name))")
    .eq("user_id", userId)
    .eq("is_archived", false)

  if (error) throw error

  return (data ?? []).flatMap((row) =>
    (row.prompt_tags as { tags: { name: string } | null }[]).map((pt) => pt.tags?.name).filter((n): n is string => !!n)
  )
}

export async function getFavoriteCounts(userId: string): Promise<FavoriteCount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prompts")
    .select("id, title, favorites(user_id)")
    .eq("user_id", userId)
    .eq("is_archived", false)

  if (error) throw error

  return (data ?? [])
    .map((row) => ({
      promptId: row.id,
      title: row.title,
      count: (row.favorites as { user_id: string }[]).length,
    }))
    .filter((row) => row.count > 0)
}
