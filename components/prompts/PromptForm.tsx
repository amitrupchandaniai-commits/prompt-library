"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DIFFICULTIES } from "@/lib/validations/prompt"
import type { PromptFormState } from "@/app/(app)/prompts/actions"

type Category = { id: string; name: string }

export function PromptForm({
  action,
  categories,
  defaultValues,
  submitLabel,
}: {
  action: (state: PromptFormState, formData: FormData) => Promise<PromptFormState>
  categories: Category[]
  defaultValues?: {
    title?: string
    description?: string
    promptText?: string
    categoryId?: string
    subcategory?: string
    useCase?: string
    industry?: string
    difficulty?: string
    promptType?: string
    recommendedModels?: string[]
    exampleInput?: string
    exampleOutput?: string
    instructions?: string
    notes?: string
    tags?: string[]
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  const allFieldErrors = state?.fieldErrors
    ? Object.entries(state.fieldErrors).flatMap(([field, messages]) =>
        (messages ?? []).map((message) => `${field}: ${message}`)
      )
    : []

  return (
    <form action={formAction} className="space-y-6">
      {allFieldErrors.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">Couldn&apos;t save — please fix the following:</p>
          <ul className="mt-1 list-inside list-disc">
            {allFieldErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={defaultValues?.title} required />
          {state?.fieldErrors?.title && (
            <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description}
            rows={2}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="promptText">Prompt</Label>
          <Textarea
            id="promptText"
            name="promptText"
            defaultValue={defaultValues?.promptText}
            rows={10}
            className="font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            Use <code>{"{{VARIABLE_NAME}}"}</code> placeholders for reusable inputs — they&apos;re
            detected automatically and turned into a fill-in form on the prompt&apos;s page.
          </p>
          {state?.fieldErrors?.promptText && (
            <p className="text-sm text-destructive">{state.fieldErrors.promptText[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" defaultValue={defaultValues?.categoryId || undefined}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={defaultValues?.difficulty || undefined}>
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input id="subcategory" name="subcategory" defaultValue={defaultValues?.subcategory} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="useCase">Use case</Label>
          <Input id="useCase" name="useCase" defaultValue={defaultValues?.useCase} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" defaultValue={defaultValues?.industry} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promptType">Prompt type</Label>
          <Input id="promptType" name="promptType" defaultValue={defaultValues?.promptType} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendedModels">Recommended models</Label>
          <Input
            id="recommendedModels"
            name="recommendedModels"
            placeholder="Claude, GPT-4, comma separated"
            defaultValue={defaultValues?.recommendedModels?.join(", ")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="comma, separated, tags"
            defaultValue={defaultValues?.tags?.join(", ")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exampleInput">Example input</Label>
          <Textarea id="exampleInput" name="exampleInput" defaultValue={defaultValues?.exampleInput} rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exampleOutput">Example output</Label>
          <Textarea
            id="exampleOutput"
            name="exampleOutput"
            defaultValue={defaultValues?.exampleOutput}
            rows={3}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            name="instructions"
            defaultValue={defaultValues?.instructions}
            rows={3}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes} rows={3} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
