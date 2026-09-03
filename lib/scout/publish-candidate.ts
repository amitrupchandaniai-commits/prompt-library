import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { slugify } from "@/lib/slugify"
import { detectVariables } from "@/lib/variables"
import { embedPrompt, embeddableContent } from "@/lib/ai/embed-prompt"
import { logAuditEvent } from "@/lib/audit"

/**
 * Publishes a research candidate as a real prompt: generates a unique slug,
 * inserts the prompt + its first version, links/creates tags, embeds it, and
 * marks the candidate approved. Shared by the in-app "Approve" action
 * (app/(app)/prompt-scout/actions.ts) and the Sheets reverse-sync path
 * (lib/google/reverse-sync.ts) so a sheet-driven approval produces the exact
 * same result as an in-app one — never an "approved but not published" candidate.
 */
export async function publishCandidate(
  supabase: SupabaseClient<Database>,
  userId: string,
  candidateId: string
): Promise<{ promptId: string }> {
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
      .eq("user_id", userId)
      .eq("slug", slug)
      .maybeSingle()
    if (!existing) break
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  const { data: prompt, error } = await supabase
    .from("prompts")
    .insert({
      user_id: userId,
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
    created_by: userId,
  })

  if (candidate.tags.length > 0) {
    const tagIds: string[] = []
    for (const name of candidate.tags) {
      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", name)
        .maybeSingle()
      if (existingTag) {
        tagIds.push(existingTag.id)
      } else {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ user_id: userId, name })
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
    userId,
    action: "scout_candidate.approved",
    objectType: "prompt",
    objectId: prompt.id,
    newValue: { candidateId, sourceUrl: candidate.source_url },
  })

  return { promptId: prompt.id }
}
