"use client"

import { useTransition } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { EXPORT_FORMATS, type ExportFormat, type ExportScope } from "@/lib/export/types"
import { exportToDriveAction } from "@/app/(app)/prompts/actions"

export function ExportMenu({ scope, id }: { scope: ExportScope; id?: string }) {
  const [isPending, startTransition] = useTransition()

  function downloadUrl(format: ExportFormat): string {
    const params = new URLSearchParams({ scope, format })
    if (id) params.set("id", id)
    return `/api/export?${params.toString()}`
  }

  // Not a plain <a href download>: rendering the anchor as a menu item means
  // selecting it closes (unmounts) the menu right as the click fires, which
  // can cancel the in-flight download ("Site wasn't available" in Chrome's
  // download history). window.open runs synchronously in the click handler,
  // before that unmount happens, so the request is already underway.
  function download(format: ExportFormat) {
    window.open(downloadUrl(format), "_blank")
  }

  function saveToDrive(format: ExportFormat) {
    startTransition(async () => {
      try {
        const { webViewLink } = await exportToDriveAction(scope, id ?? null, format)
        toast.success("Saved to Google Drive", {
          action: webViewLink
            ? { label: "Open", onClick: () => window.open(webViewLink, "_blank") }
            : undefined,
        })
      } catch {
        toast.error("Could not save to Drive. Is Google connected in Settings?")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" disabled={isPending} />}>
        <Download className="size-4" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Download</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {EXPORT_FORMATS.map((f) => (
              <DropdownMenuItem key={f.value} onClick={() => download(f.value)}>
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Save to Google Drive</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {EXPORT_FORMATS.map((f) => (
              <DropdownMenuItem key={f.value} onClick={() => saveToDrive(f.value)}>
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
