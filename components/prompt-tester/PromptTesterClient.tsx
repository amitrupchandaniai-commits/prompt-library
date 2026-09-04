"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { FlaskConical, Copy, RotateCcw } from "lucide-react"
import { runPromptTest, recordTestedModels, type TestResult } from "@/app/(app)/prompt-tester/actions"
import { AVAILABLE_MODELS, type TesterModelSelection } from "@/lib/validations/prompt-tester"
import { estimateMaxCostUsd } from "@/lib/costs/estimate"
import { detectVariables, fillVariables } from "@/lib/variables"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const MAX_TOKENS = 2048

function selectionKey(s: TesterModelSelection) {
  return `${s.provider}:${s.model}`
}

export function PromptTesterClient({
  promptId,
  initialPromptText,
}: {
  promptId?: string
  initialPromptText?: string
}) {
  const [promptText, setPromptText] = useState(initialPromptText ?? "")
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set([selectionKey(AVAILABLE_MODELS[1])]) // Claude Sonnet 5 selected by default
  )
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [isPending, startTransition] = useTransition()

  const variables = useMemo(() => detectVariables(promptText), [promptText])
  const resolvedPromptText = useMemo(
    () => (variables.length > 0 ? fillVariables(promptText, variableValues) : promptText),
    [promptText, variableValues, variables.length]
  )

  function toggleModel(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function runTest() {
    const selections = AVAILABLE_MODELS.filter((m) => selectedKeys.has(selectionKey(m))).map(
      (m) => ({ provider: m.provider, model: m.model }) as TesterModelSelection
    )
    if (selections.length === 0) {
      toast.error("Select at least one model")
      return
    }
    if (resolvedPromptText.trim().length === 0) {
      toast.error("Paste a prompt to test")
      return
    }

    startTransition(async () => {
      try {
        const testResults = await runPromptTest(resolvedPromptText, selections)
        setResults(testResults)
        if (promptId) {
          const succeeded = testResults.filter((r) => !r.error).map((r) => r.model)
          if (succeeded.length > 0) await recordTestedModels(promptId, succeeded)
        }
      } catch {
        toast.error("Couldn't run the test. Please try again.")
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FlaskConical className="size-5" />
          Prompt Tester
        </h1>
        <p className="mt-1 text-muted-foreground">
          Run a prompt against one or more models and compare the raw outputs side by side.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="promptText">Prompt to test</Label>
          <Textarea
            id="promptText"
            rows={8}
            className="font-mono text-sm"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
        </div>

        {variables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fill in variables</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {variables.map((name) => (
                <div key={name} className="space-y-1">
                  <Label htmlFor={`var-${name}`} className="text-xs">
                    {name}
                  </Label>
                  <Input
                    id={`var-${name}`}
                    value={variableValues[name] ?? ""}
                    onChange={(e) =>
                      setVariableValues((prev) => ({ ...prev, [name]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label>Models to test</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {AVAILABLE_MODELS.map((m) => {
              const key = selectionKey(m)
              const estimate = estimateMaxCostUsd(m.model, resolvedPromptText, MAX_TOKENS)
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md border p-2.5 text-sm hover:bg-accent/50"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedKeys.has(key)}
                      onChange={() => toggleModel(key)}
                    />
                    {m.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    up to ${estimate.toFixed(4)}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <Button onClick={runTest} disabled={isPending}>
          {isPending ? "Running…" : "Run test"}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Results</h2>
            <Button variant="ghost" size="sm" onClick={() => setResults(null)}>
              <RotateCcw className="size-4" />
              Clear
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((result) => (
              <Card key={`${result.provider}:${result.model}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">{result.model}</CardTitle>
                  {!result.error && (
                    <Badge variant="outline" className="tabular-nums">
                      ${result.cost.toFixed(4)} · {result.latencyMs}ms
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {result.error ? (
                    <p className="text-sm text-destructive">{result.error}</p>
                  ) : (
                    <>
                      <pre className="max-h-96 overflow-auto rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
                        {result.text}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          await navigator.clipboard.writeText(result.text ?? "")
                          toast.success("Copied to clipboard")
                        }}
                      >
                        <Copy className="size-4" />
                        Copy
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
