"use client"

import { useActionState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Copy, Save, RotateCcw } from "lucide-react"
import {
  improvePrompt,
  applyImprovementToPrompt,
  saveImprovedAsNewPrompt,
  type ImproverFormState,
} from "@/app/(app)/prompt-improver/actions"
import { SCORE_LABELS, overallScore } from "@/lib/validations/prompt-improver"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const initialState: ImproverFormState = undefined

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

export function PromptImproverClient({
  promptId,
  initialPromptText,
}: {
  promptId?: string
  initialPromptText?: string
}) {
  const [state, formAction, pending] = useActionState(improvePrompt, initialState)
  const [isSaving, startSaveTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="size-5" />
          Prompt Improver
        </h1>
        <p className="mt-1 text-muted-foreground">
          Paste any prompt. It&apos;s scored on clarity, context, specificity, structure,
          constraints, output definition, and reusability, then rewritten — without changing
          what you&apos;re actually trying to accomplish.
        </p>
      </div>

      {!state?.result && (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promptText">Prompt to improve</Label>
            <Textarea
              id="promptText"
              name="promptText"
              rows={10}
              className="font-mono text-sm"
              defaultValue={initialPromptText}
              required
            />
            {state?.fieldErrors?.promptText && (
              <p className="text-sm text-destructive">{state.fieldErrors.promptText[0]}</p>
            )}
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Analyzing…" : "Analyze & improve"}
          </Button>
        </form>
      )}

      {state?.result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quality score: {overallScore(state.result.scores)}/100
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.entries(state.result.scores) as [keyof typeof SCORE_LABELS, number][]).map(
                ([key, value]) => (
                  <div key={key} className="rounded-md border p-2 text-center">
                    <div className={`text-lg font-semibold tabular-nums ${scoreColor(value)}`}>
                      {value}
                    </div>
                    <div className="text-xs text-muted-foreground">{SCORE_LABELS[key]}</div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problems found</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {state.result.problemsFound.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {state.result.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Original <Badge variant="outline">Before</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
                  {state.originalPromptText}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Improved <Badge>After</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
                  {state.result.improvedPrompt}
                </pre>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What changed</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {state.result.explanation}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(state.result!.improvedPrompt)
                toast.success("Improved prompt copied to clipboard")
              }}
            >
              <Copy className="size-4" />
              Copy improved
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => {
                startSaveTransition(async () => {
                  try {
                    if (promptId) {
                      await applyImprovementToPrompt(promptId, state.result!.improvedPrompt)
                      toast.success("Prompt updated — original preserved in version history")
                      router.push(`/prompts/${promptId}`)
                    } else {
                      const { id } = await saveImprovedAsNewPrompt(
                        state.originalPromptText ?? "",
                        state.result!.improvedPrompt
                      )
                      router.push(`/prompts/${id}`)
                    }
                  } catch {
                    toast.error("Could not save. Please try again.")
                  }
                })
              }}
            >
              <Save className="size-4" />
              {isSaving
                ? "Saving…"
                : promptId
                  ? "Save as new version"
                  : "Save as new prompt"}
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
