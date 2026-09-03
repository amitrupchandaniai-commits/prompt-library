"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { disconnectGoogle } from "@/app/(app)/settings/actions"

export function DisconnectGoogleButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await disconnectGoogle()
            toast.success("Google disconnected")
            router.refresh()
          } catch {
            toast.error("Could not disconnect Google")
          }
        })
      }}
    >
      {isPending ? "Disconnecting…" : "Disconnect"}
    </Button>
  )
}
