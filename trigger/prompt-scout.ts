import { logger, schedules } from "@trigger.dev/sdk"
import { createServiceClient } from "@/lib/supabase/service"
import { runPromptScout, DEFAULT_SCOUT_CONFIG } from "@/lib/scout/pipeline"

// Headless job: no session/cookies exist here, so the owning user must be
// known up front rather than derived from a request. Single-tenant app today
// (see docs/AGENT_ARCHITECTURE.md), so this is one fixed user id rather than
// a loop over all users.
const SCOUT_OWNER_USER_ID = process.env.SCOUT_OWNER_USER_ID

export const weeklyPromptScout = schedules.task({
  id: "weekly-prompt-scout",
  // Sunday 02:00, per docs/AGENT_ARCHITECTURE.md's default schedule.
  cron: {
    pattern: "0 2 * * 0",
    timezone: process.env.SCOUT_TIMEZONE || "UTC",
  },
  maxDuration: 900,
  run: async () => {
    if (!SCOUT_OWNER_USER_ID) {
      throw new Error("SCOUT_OWNER_USER_ID env var is not set")
    }

    const supabase = createServiceClient()
    const result = await runPromptScout(supabase, SCOUT_OWNER_USER_ID, DEFAULT_SCOUT_CONFIG)

    logger.log("Prompt Scout run complete", result)
    return result
  },
})
