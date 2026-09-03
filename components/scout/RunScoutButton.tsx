"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startScoutRun } from "@/app/(app)/prompt-scout/actions"

export function RunScoutButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          toast.info("Running Prompt Scout — this can take up to a minute…")
          try {
            await startScoutRun()
            toast.success("Run complete — check the review queue for new candidates")
            router.refresh()
          } catch {
            toast.error("The run failed. Check run history for details.")
            router.refresh()
          }
        })
      }}
    >
      <Play className="size-4" />
      {isPending ? "Running…" : "Run now"}
    </Button>
  )
}
