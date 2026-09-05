import { bucketKey, type Granularity } from "@/lib/costs/format"
import type { Bar } from "@/lib/costs/aggregate"

export type PromptForAnalytics = {
  id: string
  categoryName: string | null
  userRating: number | null
  createdAt: string
  isOriginal: boolean
  isAiDiscovered: boolean
  isAiImproved: boolean
}

export function byCategory(prompts: PromptForAnalytics[]): Bar[] {
  const totals = new Map<string, number>()
  for (const prompt of prompts) {
    const key = prompt.categoryName ?? "Uncategorized"
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }
  return [...totals.entries()].sort(([, a], [, b]) => b - a).map(([label, value]) => ({ label, value }))
}

export function bySource(prompts: PromptForAnalytics[]): Bar[] {
  let original = 0
  let aiDiscovered = 0
  let aiImproved = 0
  for (const prompt of prompts) {
    if (prompt.isAiDiscovered) aiDiscovered += 1
    else if (prompt.isOriginal) original += 1
    if (prompt.isAiImproved) aiImproved += 1
  }
  return [
    { label: "Original", value: original },
    { label: "AI-Discovered", value: aiDiscovered },
    { label: "AI-Improved", value: aiImproved },
  ]
}

export function byCreatedPeriod(prompts: PromptForAnalytics[], granularity: Granularity): Bar[] {
  const totals = new Map<string, number>()
  for (const prompt of prompts) {
    const key = bucketKey(prompt.createdAt, granularity)
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }
  return [...totals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, value]) => ({ label, value }))
}

export function averageRating(prompts: PromptForAnalytics[]): number | null {
  const rated = prompts.filter((p): p is PromptForAnalytics & { userRating: number } => p.userRating !== null)
  if (rated.length === 0) return null
  return rated.reduce((sum, p) => sum + p.userRating, 0) / rated.length
}

export function topTags(tagNames: string[], limit = 10): Bar[] {
  const totals = new Map<string, number>()
  for (const name of tagNames) {
    totals.set(name, (totals.get(name) ?? 0) + 1)
  }
  return [...totals.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }))
}

export type FavoriteCount = { promptId: string; title: string; count: number }

export function topFavorited(counts: FavoriteCount[], limit = 10): FavoriteCount[] {
  return [...counts].sort((a, b) => b.count - a.count).slice(0, limit)
}
