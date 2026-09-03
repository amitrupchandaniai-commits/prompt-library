import { requireSession } from "@/lib/dal"
import { getPromptById } from "@/lib/queries/prompts"
import { PromptImproverClient } from "@/components/prompts/PromptImproverClient"

export default async function PromptImproverPage({
  searchParams,
}: {
  searchParams: Promise<{ promptId?: string }>
}) {
  const { promptId } = await searchParams
  const user = await requireSession()

  const prompt = promptId ? await getPromptById(user.id, promptId) : null

  return (
    <PromptImproverClient
      promptId={prompt?.id}
      initialPromptText={prompt?.prompt_text}
    />
  )
}
