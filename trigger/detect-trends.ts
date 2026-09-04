import { logger, schedules } from "@trigger.dev/sdk"
import { createServiceClient } from "@/lib/supabase/service"
import { detectTrends } from "@/lib/scout/detect-trends"
import { syncTrendsToSheets } from "@/lib/google/sync"

// Same single-tenant assumption as trigger/prompt-scout.ts. Runs an hour
// after the weekly scout cron (0 2 * * 0) so that week's candidates are settled.
const SCOUT_OWNER_USER_ID = process.env.SCOUT_OWNER_USER_ID

export const weeklyTrendDetection = schedules.task({
  id: "detect-trends",
  cron: { pattern: "0 3 * * 0" },
  maxDuration: 300,
  run: async () => {
    if (!SCOUT_OWNER_USER_ID) {
      throw new Error("SCOUT_OWNER_USER_ID env var is not set")
    }

    const supabase = createServiceClient()
    const trends = await detectTrends(supabase, SCOUT_OWNER_USER_ID)

    if (trends.length > 0) {
      try {
        await syncTrendsToSheets(supabase, SCOUT_OWNER_USER_ID)
      } catch (err) {
        // Best-effort, same as every other Google sync path — never fail the
        // trend-detection run over a Sheets problem.
        logger.error("syncTrendsToSheets failed", { error: err })
      }
    }

    logger.log("Trend detection complete", { trendsFound: trends.length })
    return { trendsFound: trends.length }
  },
})
