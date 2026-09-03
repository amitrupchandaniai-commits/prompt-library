import "server-only"
// Imported from googleapis-common (a shared transitive dependency of
// @googleapis/sheets and @googleapis/drive) rather than a standalone
// google-auth-library install: npm otherwise resolves two different
// google-auth-library versions, and their OAuth2Client classes are not
// structurally assignable to each other (private field mismatch) even though
// identical in shape — this keeps a single OAuth2Client type throughout.
import { OAuth2Client } from "googleapis-common"

// spreadsheets (not full drive) + drive.file: the app can only ever see files
// and folders it created itself, limiting blast radius if a token leaks
// (docs/GOOGLE_INTEGRATION.md §2, §7).
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
] as const

export function createOAuthClient(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function buildAuthUrl(state: string): string {
  return createOAuthClient().generateAuthUrl({
    // access_type "offline" is required to receive a refresh_token; prompt
    // "consent" forces one even on a reconnect, so the weekly cron
    // (trigger/prompt-scout.ts) never gets stranded without one.
    access_type: "offline",
    prompt: "consent",
    scope: [...GOOGLE_SCOPES],
    state,
  })
}
