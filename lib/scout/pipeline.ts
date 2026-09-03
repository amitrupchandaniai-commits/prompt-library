import "server-only"
import { createClient } from "@/lib/supabase/server"
import { getAIProvider } from "@/lib/ai"
import { logAiUsage } from "@/lib/ai/usage"
import { generateEmbedding } from "@/lib/ai/embeddings"
import { fetchFeedItems } from "./rss"
import { hashContent } from "./content-hash"
import { checkForInjection } from "./security-filter"
import { CandidateAnalysisSchema, SCOUT_SYSTEM_PROMPT } from "./analyze"

export type ScoutConfig = {
  maxSources: number
  maxItemsPerSource: number
  minQualityScore: number
}

export const DEFAULT_SCOUT_CONFIG: ScoutConfig = {
  maxSources: 3,
  maxItemsPerSource: 5,
  minQualityScore: 60,
}

const DUPLICATE_REJECT_THRESHOLD = 0.95
const DUPLICATE_FLAG_THRESHOLD = 0.85

function overallScore(scores: CandidateAnalysisScores): number {
  const values = Object.values(scores)
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

type CandidateAnalysisScores = {
  clarity: number
  specificity: number
  context: number
  structure: number
  reusability: number
  originality: number
  practicalValue: number
}

export async function runPromptScout(userId: string, config: ScoutConfig = DEFAULT_SCOUT_CONFIG) {
  const supabase = await createClient()

  const { data: run, error: runError } = await supabase
    .from("research_runs")
    .insert({ status: "running", triggered_by: userId })
    .select("id")
    .single()

  if (runError || !run) throw new Error("Could not start a research run")

  const errors: string[] = []
  let sourcesScanned = 0
  let itemsDiscovered = 0
  let itemsAnalyzed = 0
  let itemsRejected = 0
  let duplicatesFound = 0
  let pendingReviewCount = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCost = 0

  try {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, name, url, type, trust_score")
      .eq("enabled", true)
      .order("trust_score", { ascending: false })
      .limit(config.maxSources)

    const { data: categories } = await supabase.from("categories").select("id, name")
    const categoryByName = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]))
    const categoryNameList = (categories ?? []).map((c) => c.name).join(", ")

    const provider = getAIProvider("anthropic")

    for (const source of sources ?? []) {
      sourcesScanned += 1

      let items
      try {
        items = source.type === "rss" ? await fetchFeedItems(source.url, config.maxItemsPerSource) : []
      } catch (err) {
        errors.push(`Failed to fetch ${source.name}: ${err instanceof Error ? err.message : "unknown error"}`)
        continue
      }

      itemsDiscovered += items.length

      for (const item of items) {
        const rawContent = `${item.title}\n\n${item.content}`
        const contentHash = hashContent(rawContent)

        // Dedup memory: never re-analyze content we've already processed in a past run.
        const { data: alreadyProcessed } = await supabase
          .from("processed_content")
          .select("id")
          .eq("source_url", item.link)
          .eq("content_hash", contentHash)
          .maybeSingle()

        if (alreadyProcessed) continue

        await supabase.from("processed_content").insert({
          source_url: item.link,
          content_hash: contentHash,
          publication_date: item.publicationDate || null,
          run_id: run.id,
        })

        // Security pre-filter — code-level, before this content ever reaches the LLM.
        const injectionCheck = checkForInjection(rawContent)
        if (!injectionCheck.safe) {
          await supabase.from("research_candidates").insert({
            run_id: run.id,
            title: item.title,
            prompt_text: "(rejected before analysis)",
            security_status: "rejected",
            security_notes: injectionCheck.reason,
            source_id: source.id,
            source_url: item.link,
            source_name: source.name,
            source_author: item.author,
            source_publication_date: item.publicationDate || null,
            content_hash: contentHash,
            review_status: "rejected",
            recommended_action: "reject",
          })
          itemsRejected += 1
          continue
        }

        itemsAnalyzed += 1

        let analysis
        try {
          const result = await provider.generateStructured({
            system: SCOUT_SYSTEM_PROMPT,
            prompt: `Available categories: ${categoryNameList}\n\nSource: ${source.name}\nTitle: ${item.title}\n\nContent:\n${item.content.slice(0, 6000)}`,
            schema: CandidateAnalysisSchema,
            schemaName: "candidate_analysis",
            maxTokens: 2048,
          })
          analysis = result.data
          totalInputTokens += result.inputTokens
          totalOutputTokens += result.outputTokens
          totalCost += await logAiUsage({
            userId,
            feature: "prompt_scout",
            provider: result.provider,
            model: result.model,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            latencyMs: result.latencyMs,
          })
        } catch (err) {
          errors.push(`Analysis failed for "${item.title}": ${err instanceof Error ? err.message : "unknown error"}`)
          itemsRejected += 1
          continue
        }

        if (!analysis.isUseful) {
          await supabase.from("research_candidates").insert({
            run_id: run.id,
            title: analysis.title || item.title,
            prompt_text: "(not useful — no adaptation generated)",
            security_status: "passed",
            source_id: source.id,
            source_url: item.link,
            source_name: source.name,
            source_author: item.author,
            source_publication_date: item.publicationDate || null,
            content_hash: contentHash,
            review_status: "rejected",
            reviewer_notes: analysis.rejectionReason,
            recommended_action: "reject",
          })
          itemsRejected += 1
          continue
        }

        const quality = overallScore(analysis.scores)
        if (quality < config.minQualityScore) {
          await supabase.from("research_candidates").insert({
            run_id: run.id,
            title: analysis.title,
            description: analysis.description,
            prompt_text: analysis.promptText,
            quality_score: quality,
            clarity_score: analysis.scores.clarity,
            specificity_score: analysis.scores.specificity,
            context_score: analysis.scores.context,
            structure_score: analysis.scores.structure,
            reusability_score: analysis.scores.reusability,
            originality_score: analysis.scores.originality,
            practical_value_score: analysis.scores.practicalValue,
            security_status: "passed",
            source_id: source.id,
            source_url: item.link,
            source_name: source.name,
            source_author: item.author,
            source_publication_date: item.publicationDate || null,
            content_hash: contentHash,
            review_status: "rejected",
            reviewer_notes: `Below minimum quality score (${quality} < ${config.minQualityScore})`,
            recommended_action: "reject",
          })
          itemsRejected += 1
          continue
        }

        // Duplicate check against the user's existing library via pgvector (reuses Phase 3).
        let duplicateProbability: number | null = null
        let duplicateOfPromptId: string | null = null
        try {
          const embedding = await generateEmbedding(`${analysis.title}\n\n${analysis.description}\n\n${analysis.promptText}`)
          const { data: matches } = await supabase.rpc("match_prompts", {
            query_embedding: embedding,
            match_count: 1,
          })
          const best = matches?.[0]
          if (best) {
            duplicateProbability = Math.round(best.similarity * 100)
            duplicateOfPromptId = best.id
          }
        } catch {
          // Best-effort — if embeddings aren't configured, dedup just doesn't run for this candidate.
        }

        if (duplicateProbability !== null && duplicateProbability / 100 >= DUPLICATE_REJECT_THRESHOLD) {
          duplicatesFound += 1
          await supabase.from("research_candidates").insert({
            run_id: run.id,
            title: analysis.title,
            description: analysis.description,
            prompt_text: analysis.promptText,
            quality_score: quality,
            duplicate_probability: duplicateProbability,
            duplicate_of_prompt_id: duplicateOfPromptId,
            security_status: "passed",
            source_id: source.id,
            source_url: item.link,
            source_name: source.name,
            source_author: item.author,
            source_publication_date: item.publicationDate || null,
            content_hash: contentHash,
            review_status: "rejected",
            reviewer_notes: "Likely duplicate of an existing prompt in your library",
            recommended_action: "reject",
          })
          itemsRejected += 1
          continue
        }

        const categoryId = categoryByName.get(analysis.categoryName.toLowerCase()) ?? null
        const needsReviewForDuplicate =
          duplicateProbability !== null && duplicateProbability / 100 >= DUPLICATE_FLAG_THRESHOLD

        await supabase.from("research_candidates").insert({
          run_id: run.id,
          title: analysis.title,
          description: analysis.description,
          prompt_text: analysis.promptText,
          category_id: categoryId,
          use_case: analysis.useCase,
          tags: analysis.tags,
          quality_score: quality,
          clarity_score: analysis.scores.clarity,
          specificity_score: analysis.scores.specificity,
          context_score: analysis.scores.context,
          structure_score: analysis.scores.structure,
          reusability_score: analysis.scores.reusability,
          originality_score: analysis.scores.originality,
          practical_value_score: analysis.scores.practicalValue,
          duplicate_probability: duplicateProbability,
          duplicate_of_prompt_id: duplicateOfPromptId,
          security_status: "passed",
          is_ai_optimized: true,
          source_id: source.id,
          source_url: item.link,
          source_name: source.name,
          source_author: item.author,
          source_publication_date: item.publicationDate || null,
          content_hash: contentHash,
          review_status: "pending",
          recommended_action: needsReviewForDuplicate ? "review" : analysis.recommendedAction,
        })
        pendingReviewCount += 1
      }

      await supabase.from("sources").update({ last_scanned_at: new Date().toISOString() }).eq("id", source.id)
    }

    await supabase
      .from("research_runs")
      .update({
        status: errors.length > 0 ? "partial" : "completed",
        ended_at: new Date().toISOString(),
        sources_scanned: sourcesScanned,
        items_discovered: itemsDiscovered,
        items_analyzed: itemsAnalyzed,
        items_rejected: itemsRejected,
        duplicates_found: duplicatesFound,
        pending_review_count: pendingReviewCount,
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        ai_cost_usd: totalCost,
        errors,
      })
      .eq("id", run.id)

    return { runId: run.id }
  } catch (err) {
    await supabase
      .from("research_runs")
      .update({
        status: "failed",
        ended_at: new Date().toISOString(),
        sources_scanned: sourcesScanned,
        items_discovered: itemsDiscovered,
        items_analyzed: itemsAnalyzed,
        items_rejected: itemsRejected,
        duplicates_found: duplicatesFound,
        pending_review_count: pendingReviewCount,
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        ai_cost_usd: totalCost,
        errors: [...errors, err instanceof Error ? err.message : "Unknown error"],
      })
      .eq("id", run.id)
    throw err
  }
}
