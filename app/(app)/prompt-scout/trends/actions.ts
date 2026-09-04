"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { detectTrends } from "@/lib/scout/detect-trends"
import { logAuditEvent } from "@/lib/audit"

export async function runTrendDetectionNow(): Promise<{ trendsFound: number }> {
  const user = await requireSession()
  const supabase = await createClient()

  const trends = await detectTrends(supabase, user.id)

  await logAuditEvent({
    userId: user.id,
    action: "trends.detected",
    objectType: "trends",
    newValue: { trendsFound: trends.length },
  })

  revalidatePath("/prompt-scout/trends")
  return { trendsFound: trends.length }
}
