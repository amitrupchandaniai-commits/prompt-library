"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addSource, type SourceFormState } from "@/app/(app)/sources/actions"

const initialState: SourceFormState = undefined

const TYPE_OPTIONS = [
  { value: "rss", label: "RSS / Atom feed" },
  { value: "api", label: "Official API" },
  { value: "web", label: "Web page" },
]

export function AddSourceDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(addSource, initialState)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add source</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a source</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Feed / page URL</Label>
            <Input id="url" name="url" type="url" placeholder="https://…" required />
            {state?.fieldErrors?.url && (
              <p className="text-sm text-destructive">{state.fieldErrors.url[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" items={TYPE_OPTIONS} defaultValue="rss">
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only RSS feeds are actually scanned by Prompt Scout right now — API/web sources can
              be registered but aren&apos;t fetched yet.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trustScore">Trust score (0-100)</Label>
            <Input
              id="trustScore"
              name="trustScore"
              type="number"
              min={0}
              max={100}
              defaultValue={70}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add source"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
