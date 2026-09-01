"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fillVariables } from "@/lib/variables"

export function UsePromptDialog({
  promptText,
  variables,
}: {
  promptText: string
  variables: string[]
}) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const filled = useMemo(() => fillVariables(promptText, values), [promptText, values])

  if (variables.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(promptText)
          toast.success("Prompt copied to clipboard")
        }}
      >
        Use prompt
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Use prompt</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fill in variables</DialogTitle>
          <DialogDescription>
            Complete the fields below, then copy the finished prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {variables.map((name) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={`var-${name}`}>{name.replace(/_/g, " ")}</Label>
              <Input
                id={`var-${name}`}
                value={values[name] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap">
          {filled}
        </div>

        <DialogFooter>
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(filled)
              toast.success("Filled prompt copied to clipboard")
              setOpen(false)
            }}
          >
            Copy filled prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
