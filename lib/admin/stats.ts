export type AuthUserSummary = {
  id: string
  email: string
  createdAt: string
  lastSignInAt: string | null
}

export type UserStat = AuthUserSummary & {
  promptCount: number
  scoutApproved: number
  scoutRejected: number
}

/**
 * Pure aggregation: shapes an admin-panel row per user from data already
 * fetched elsewhere (Supabase Admin API for the user list, plain counts
 * derived from `prompts`/`audit_log`). Kept separate from data fetching so
 * it's directly testable, matching lib/google/sheets-schema.ts's split.
 */
export function buildUserStats(
  authUsers: AuthUserSummary[],
  promptCounts: Map<string, number>,
  scoutApproved: Map<string, number>,
  scoutRejected: Map<string, number>
): UserStat[] {
  return authUsers
    .map((user) => ({
      ...user,
      promptCount: promptCounts.get(user.id) ?? 0,
      scoutApproved: scoutApproved.get(user.id) ?? 0,
      scoutRejected: scoutRejected.get(user.id) ?? 0,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
