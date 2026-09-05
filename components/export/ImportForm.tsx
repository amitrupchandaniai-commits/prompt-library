"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { importPrompts, type ImportState } from "@/app/(app)/prompts/import/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: ImportState = undefined

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importPrompts, initialState)
  const router = useRouter()

  return (
    <form
      action={(formData) => {
        formAction(formData)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" accept=".json,.csv,.txt" required />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Importing…" : "Import"}
      </Button>

      {state && !state.error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Imported {state.imported} prompt{state.imported === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.skipped.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Skipped {state.skipped.length} row{state.skipped.length === 1 ? "" : "s"}:
                </p>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {state.skipped.map((s) => (
                    <li key={s.row}>
                      Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {state.imported > 0 && (
              <Button variant="outline" onClick={() => router.push("/prompts")}>
                Go to library
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  )
}
