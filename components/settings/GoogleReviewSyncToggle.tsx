"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { setSheetsReviewSyncEnabled } from "@/app/(app)/settings/actions"

export function GoogleReviewSyncToggle({ defaultChecked }: { defaultChecked: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor="sheets-review-sync" className="text-sm font-medium">
          Sheets review sync
        </Label>
        <p className="text-xs text-muted-foreground">
          Let approving/rejecting a candidate from the spreadsheet update it here too.
        </p>
      </div>
      <Switch
        id="sheets-review-sync"
        defaultChecked={defaultChecked}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            try {
              await setSheetsReviewSyncEnabled(checked)
              toast.success(checked ? "Sheets review sync enabled" : "Sheets review sync disabled")
              router.refresh()
            } catch {
              toast.error("Could not update this setting")
            }
          })
        }}
      />
    </div>
  )
}
