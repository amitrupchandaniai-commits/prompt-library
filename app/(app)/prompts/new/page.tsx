import { listCategories } from "@/lib/queries/prompts"
import { PromptForm } from "@/components/prompts/PromptForm"
import { createPrompt } from "../actions"

export default async function NewPromptPage() {
  const categories = await listCategories()

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New prompt</h1>
      <PromptForm action={createPrompt} categories={categories} submitLabel="Create prompt" />
    </div>
  )
}
