"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { syncFromSheetsNow } from "@/app/(app)/prompt-scout/actions"

export function SyncFromSheetsButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            const { updated, skipped } = await syncFromSheetsNow()
            toast.success(`Synced from Sheets — ${updated} updated, ${skipped} skipped`)
            router.refresh()
          } catch {
            toast.error("Could not sync from Sheets")
          }
        })
      }}
    >
      <RefreshCw className="size-4" />
      {isPending ? "Syncing…" : "Sync from Sheets"}
    </Button>
  )
}
