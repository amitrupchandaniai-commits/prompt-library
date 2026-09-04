"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { runTrendDetectionNow } from "@/app/(app)/prompt-scout/trends/actions"

export function DetectTrendsButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          toast.info("Analyzing this week's candidates…")
          try {
            const { trendsFound } = await runTrendDetectionNow()
            toast.success(
              trendsFound > 0
                ? `Found ${trendsFound} trend${trendsFound === 1 ? "" : "s"}`
                : "No genuine trends this week — not enough data or nothing stood out"
            )
            router.refresh()
          } catch {
            toast.error("Could not run trend detection. Check run history for details.")
          }
        })
      }}
    >
      <Sparkles className="size-4" />
      {isPending ? "Analyzing…" : "Detect trends now"}
    </Button>
  )
}
