"use client"

import { useActionState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Wand2, Copy, Save, RotateCcw } from "lucide-react"
import { buildPrompt, saveBuiltPrompt, type BuilderFormState } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: BuilderFormState = undefined

export default function PromptBuilderPage() {
  const [state, formAction, pending] = useActionState(buildPrompt, initialState)
  const [isSaving, startSaveTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Wand2 className="size-5" />
          Prompt Builder
        </h1>
        <p className="mt-1 text-muted-foreground">
          What do you want AI to help you accomplish? Fill in whatever&apos;s relevant —
          everything except the first field is optional.
        </p>
      </div>

      {!state?.result && (
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="objective">What do you want AI to help you accomplish?</Label>
            <Textarea
              id="objective"
              name="objective"
              rows={3}
              placeholder="e.g. Analyze customer support tickets to find the top 3 recurring complaints"
              required
            />
            {state?.fieldErrors?.objective && (
              <p className="text-sm text-destructive">{state.fieldErrors.objective[0]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" placeholder="e.g. Senior data analyst" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" name="audience" placeholder="Who is this output for?" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="context">Context</Label>
              <Textarea id="context" name="context" rows={2} placeholder="Relevant background" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="input">Input</Label>
              <Textarea
                id="input"
                name="input"
                rows={2}
                placeholder="What data or material will be provided?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input id="tone" name="tone" placeholder="e.g. Formal, concise" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputFormat">Output format</Label>
              <Input id="outputFormat" name="outputFormat" placeholder="e.g. Bulleted list" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="constraints">Constraints</Label>
              <Textarea
                id="constraints"
                name="constraints"
                rows={2}
                placeholder="Anything the output must avoid or follow"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="examples">Examples</Label>
              <Textarea id="examples" name="examples" rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="successCriteria">Success criteria</Label>
              <Textarea
                id="successCriteria"
                name="successCriteria"
                rows={2}
                placeholder="What does a great result look like?"
              />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Building…" : "Build prompt"}
          </Button>
        </form>
      )}

      {state?.result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{state.result.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{state.result.description}</p>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted/60 p-4 font-mono text-sm whitespace-pre-wrap">
                {state.result.promptText}
              </pre>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(state.result!.promptText)
                toast.success("Prompt copied to clipboard")
              }}
            >
              <Copy className="size-4" />
              Copy
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => {
                startSaveTransition(async () => {
                  try {
                    const { id } = await saveBuiltPrompt(state.result!)
                    router.push(`/prompts/${id}`)
                  } catch {
                    toast.error("Could not save the prompt. Please try again.")
                  }
                })
              }}
            >
              <Save className="size-4" />
              {isSaving ? "Saving…" : "Save to library"}
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              <RotateCcw className="size-4" />
              Start over
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
