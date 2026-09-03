"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { runPromptScout, DEFAULT_SCOUT_CONFIG } from "@/lib/scout/pipeline"
import { logAuditEvent } from "@/lib/audit"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"
import { embedPrompt, embeddableContent } from "@/lib/ai/embed-prompt"

// Trigger.dev will own real scheduled runs (Phase 4 fast-follow); this manual
// path deliberately stays small (DEFAULT_SCOUT_CONFIG) so it reliably completes
// within a single serverless request.
export const maxDuration = 60

export async function startScoutRun(): Promise<{ runId: string }> {
  const user = await requireSession()
  const result = await runPromptScout(user.id, DEFAULT_SCOUT_CONFIG)
  revalidatePath("/prompt-scout")
  revalidatePath("/prompt-scout/queue")
  return result
}

export async function approveCandidate(candidateId: string): Promise<{ promptId: string }> {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: candidate } = await supabase
    .from("research_candidates")
    .select("*")
    .eq("id", candidateId)
    .single()

  if (!candidate) throw new Error("Candidate not found")

  const baseSlug = slugify(candidate.title) || "discovered-prompt"
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

  const { data: prompt, error } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      title: candidate.title,
      slug,
      description: candidate.description,
      prompt_text: candidate.prompt_text,
      category_id: candidate.category_id,
      use_case: candidate.use_case,
      quality_score: candidate.quality_score,
      clarity_score: candidate.clarity_score,
      specificity_score: candidate.specificity_score,
      context_score: candidate.context_score,
      structure_score: candidate.structure_score,
      reusability_score: candidate.reusability_score,
      originality_score: candidate.originality_score,
      practical_value_score: candidate.practical_value_score,
      is_original: false,
      is_ai_discovered: true,
      is_verified: false,
      source_id: candidate.source_id,
      source_url: candidate.source_url,
      source_name: candidate.source_name,
      source_author: candidate.source_author,
      source_publication_date: candidate.source_publication_date,
      discovered_at: candidate.created_at,
      variables: detectVariables(candidate.prompt_text),
    })
    .select("id")
    .single()

  if (error || !prompt) throw new Error("Could not publish this candidate")

  await supabase.from("prompt_versions").insert({
    prompt_id: prompt.id,
    version_number: 1,
    title: candidate.title,
    prompt_text: candidate.prompt_text,
    change_source: "original",
    created_by: user.id,
  })

  if (candidate.tags.length > 0) {
    const tagIds: string[] = []
    for (const name of candidate.tags) {
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
      await supabase
        .from("prompt_tags")
        .insert(tagIds.map((tagId) => ({ prompt_id: prompt.id, tag_id: tagId })))
    }
  }

  await embedPrompt(
    prompt.id,
    embeddableContent({
      title: candidate.title,
      description: candidate.description,
      promptText: candidate.prompt_text,
    })
  )

  await supabase
    .from("research_candidates")
    .update({ review_status: "approved", supabase_prompt_id: prompt.id })
    .eq("id", candidateId)

  await logAuditEvent({
    userId: user.id,
    action: "scout_candidate.approved",
    objectType: "prompt",
    objectId: prompt.id,
    newValue: { candidateId, sourceUrl: candidate.source_url },
  })

  revalidatePath("/prompt-scout/queue")
  revalidatePath("/prompts")
  revalidatePath("/dashboard")
  return { promptId: prompt.id }
}

export async function rejectCandidate(candidateId: string, notes?: string) {
  const user = await requireSession()
  const supabase = await createClient()

  await supabase
    .from("research_candidates")
    .update({ review_status: "rejected", reviewer_notes: notes || null })
    .eq("id", candidateId)

  await logAuditEvent({
    userId: user.id,
    action: "scout_candidate.rejected",
    objectType: "research_candidate",
    objectId: candidateId,
  })

  revalidatePath("/prompt-scout/queue")
}
