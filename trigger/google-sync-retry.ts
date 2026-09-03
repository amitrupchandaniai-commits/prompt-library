import { logger, schedules } from "@trigger.dev/sdk"
import { createServiceClient } from "@/lib/supabase/service"
import { syncRunToGoogle } from "@/lib/google/sync"

const SCOUT_OWNER_USER_ID = process.env.SCOUT_OWNER_USER_ID

// Retries only the half (Sheets or Drive) that actually failed on a prior
// run, so a run whose Drive upload already succeeded doesn't get re-uploaded
// just because Sheets failed (docs/GOOGLE_INTEGRATION.md §6).
export const hourlyGoogleSyncRetry = schedules.task({
  id: "google-sync-retry",
  cron: { pattern: "0 * * * *" },
  maxDuration: 300,
  run: async () => {
    if (!SCOUT_OWNER_USER_ID) {
      throw new Error("SCOUT_OWNER_USER_ID env var is not set")
    }

    const supabase = createServiceClient()
    const { data: failedRuns } = await supabase
      .from("research_runs")
      .select("id, sheets_sync_status, drive_report_status")
      .or("sheets_sync_status.eq.failed,drive_report_status.eq.failed")
      .order("started_at", { ascending: false })
      .limit(10)

    let retried = 0
    for (const run of failedRuns ?? []) {
      await syncRunToGoogle(supabase, SCOUT_OWNER_USER_ID, run.id, {
        skipSheets: run.sheets_sync_status !== "failed",
        skipDrive: run.drive_report_status !== "failed",
      })
      retried += 1
    }

    logger.log("Google sync retry complete", { retried })
    return { retried }
  },
})
