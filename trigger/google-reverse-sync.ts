import { logger, schedules } from "@trigger.dev/sdk"
import { createServiceClient } from "@/lib/supabase/service"
import { syncReviewColumnsFromSheets } from "@/lib/google/reverse-sync"

// Same single-tenant assumption as trigger/prompt-scout.ts — one fixed owning
// user, no session in a headless job. No-op unless that user has opted into
// sheets_review_sync_enabled (docs/GOOGLE_INTEGRATION.md §4).
const SCOUT_OWNER_USER_ID = process.env.SCOUT_OWNER_USER_ID

export const dailyGoogleReverseSync = schedules.task({
  id: "google-reverse-sync",
  cron: { pattern: "0 6 * * *" },
  maxDuration: 300,
  run: async () => {
    if (!SCOUT_OWNER_USER_ID) {
      throw new Error("SCOUT_OWNER_USER_ID env var is not set")
    }

    const supabase = createServiceClient()
    const result = await syncReviewColumnsFromSheets(supabase, SCOUT_OWNER_USER_ID)

    logger.log("Google reverse sync complete", result)
    return result
  },
})
