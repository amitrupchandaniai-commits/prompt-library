import { requireSession } from "@/lib/dal"
import { getPromptById } from "@/lib/queries/prompts"
import { PromptTesterClient } from "@/components/prompt-tester/PromptTesterClient"

export default async function PromptTesterPage({
  searchParams,
}: {
  searchParams: Promise<{ promptId?: string }>
}) {
  const { promptId } = await searchParams
  const user = await requireSession()

  const prompt = promptId ? await getPromptById(user.id, promptId) : null

  return <PromptTesterClient promptId={prompt?.id} initialPromptText={prompt?.prompt_text} />
}
