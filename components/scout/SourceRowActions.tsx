"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toggleSourceEnabled, deleteSource } from "@/app/(app)/sources/actions"

export function SourceRowActions({
  sourceId,
  enabled,
}: {
  sourceId: string
  enabled: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Switch
        checked={enabled}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await toggleSourceEnabled(sourceId, checked)
            toast.success(checked ? "Source enabled" : "Source disabled")
          })
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        aria-label="Delete source"
        onClick={() => {
          if (confirm("Delete this source? Past candidates it discovered are kept.")) {
            startTransition(async () => {
              await deleteSource(sourceId)
              toast.success("Source deleted")
            })
          }
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
