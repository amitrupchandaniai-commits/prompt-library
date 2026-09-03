"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Copy, History, RotateCcw, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { restoreVersion } from "@/app/(app)/prompts/actions"

type Version = {
  id: string
  version_number: number
  title: string
  prompt_text: string
  change_source: string
  created_at: string
}

const CHANGE_SOURCE_LABELS: Record<string, string> = {
  original: "Original",
  user_edit: "Edited",
  ai_improved: "AI Improved",
  ai_tested: "AI Tested",
  restored: "Restored",
}

export function VersionHistory({
  promptId,
  versions,
}: {
  promptId: string
  versions: Version[]
}) {
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const [compareLeft, setCompareLeft] = useState<string>(versions[1]?.id ?? versions[0]?.id ?? "")
  const [compareRight, setCompareRight] = useState<string>(versions[0]?.id ?? "")
  const [isPending, startTransition] = useTransition()

  const latestVersionId = versions[0]?.id
  const viewing = versions.find((v) => v.id === viewingId)
  const left = versions.find((v) => v.id === compareLeft)
  const right = versions.find((v) => v.id === compareRight)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="size-4" />
          {versions.length} version{versions.length !== 1 ? "s" : ""}
        </div>
        {versions.length > 1 && (
          <Button variant="outline" size="sm" onClick={() => setComparing(true)}>
            <GitCompare className="size-3.5" />
            Compare
          </Button>
        )}
      </div>

      {versions.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-medium">v{v.version_number}</span>
            <Badge variant="outline" className="shrink-0">
              {CHANGE_SOURCE_LABELS[v.change_source] ?? v.change_source}
            </Badge>
            <span className="truncate text-xs text-muted-foreground">
              {new Date(v.created_at).toLocaleString()}
            </span>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={() => setViewingId(v.id)}>
              View
            </Button>
            {v.id !== latestVersionId && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Restore v${v.version_number}? This will be saved as a new version.`)) {
                    startTransition(async () => {
                      try {
                        await restoreVersion(promptId, v.id)
                        toast.success(`Restored v${v.version_number}`)
                      } catch {
                        toast.error("Could not restore this version")
                      }
                    })
                  }
                }}
              >
                <RotateCcw className="size-3.5" />
                Restore
              </Button>
            )}
          </div>
        </div>
      ))}

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>
                  v{viewing.version_number} — {viewing.title}
                </DialogTitle>
              </DialogHeader>
              <pre className="max-h-[28rem] overflow-auto rounded-md bg-muted/60 p-3 font-mono text-sm whitespace-pre-wrap">
                {viewing.prompt_text}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={async () => {
                  await navigator.clipboard.writeText(viewing.prompt_text)
                  toast.success("Copied to clipboard")
                }}
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={comparing} onOpenChange={setComparing}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare versions</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Select
                value={compareLeft}
                onValueChange={(value) => setCompareLeft(value ?? "")}
                items={versions.map((v) => ({
                  value: v.id,
                  label: `v${v.version_number} — ${CHANGE_SOURCE_LABELS[v.change_source] ?? v.change_source}`,
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version_number} — {CHANGE_SOURCE_LABELS[v.change_source] ?? v.change_source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <pre className="max-h-[28rem] overflow-auto rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
                {left?.prompt_text}
              </pre>
            </div>
            <div className="space-y-2">
              <Select
                value={compareRight}
                onValueChange={(value) => setCompareRight(value ?? "")}
                items={versions.map((v) => ({
                  value: v.id,
                  label: `v${v.version_number} — ${CHANGE_SOURCE_LABELS[v.change_source] ?? v.change_source}`,
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version_number} — {CHANGE_SOURCE_LABELS[v.change_source] ?? v.change_source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <pre className="max-h-[28rem] overflow-auto rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
                {right?.prompt_text}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
