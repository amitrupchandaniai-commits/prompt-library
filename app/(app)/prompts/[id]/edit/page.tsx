import { notFound } from "next/navigation"
import { requireSession } from "@/lib/dal"
import { getPromptById, listCategories } from "@/lib/queries/prompts"
import { PromptForm } from "@/components/prompts/PromptForm"
import { updatePrompt } from "../../actions"

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireSession()

  const [prompt, categories] = await Promise.all([
    getPromptById(user.id, id),
    listCategories(),
  ])

  if (!prompt) notFound()

  const boundAction = updatePrompt.bind(null, prompt.id)
  const tags =
    prompt.prompt_tags
      ?.map((pt: { tags: { name: string } | null }) => pt.tags?.name)
      .filter((name): name is string => Boolean(name)) ?? []

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit prompt</h1>
      <PromptForm
        action={boundAction}
        categories={categories}
        submitLabel="Save changes"
        defaultValues={{
          title: prompt.title,
          description: prompt.description ?? undefined,
          promptText: prompt.prompt_text,
          categoryId: prompt.category_id ?? undefined,
          subcategory: prompt.subcategory ?? undefined,
          useCase: prompt.use_case ?? undefined,
          industry: prompt.industry ?? undefined,
          difficulty: prompt.difficulty ?? undefined,
          promptType: prompt.prompt_type ?? undefined,
          recommendedModels: prompt.recommended_models,
          exampleInput: prompt.example_input ?? undefined,
          exampleOutput: prompt.example_output ?? undefined,
          instructions: prompt.instructions ?? undefined,
          notes: prompt.notes ?? undefined,
          tags,
        }}
      />
    </div>
  )
}
