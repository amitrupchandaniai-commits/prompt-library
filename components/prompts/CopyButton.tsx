"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        toast.success("Prompt copied to clipboard")
      }}
    >
      <Copy className="size-4" />
      Copy
    </Button>
  )
}
