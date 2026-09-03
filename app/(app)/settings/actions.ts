"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"

export async function disconnectGoogle(): Promise<void> {
  const user = await requireSession()
  const supabase = await createClient()

  await supabase.from("google_integrations").delete().eq("user_id", user.id)

  await logAuditEvent({
    userId: user.id,
    action: "google.disconnected",
    objectType: "google_integrations",
  })

  revalidatePath("/settings")
}

export async function setSheetsReviewSyncEnabled(enabled: boolean): Promise<void> {
  const user = await requireSession()
  const supabase = await createClient()

  await supabase
    .from("google_integrations")
    .update({ sheets_review_sync_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)

  revalidatePath("/settings")
}
