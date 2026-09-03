import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
// See lib/google/oauth-client.ts for why this comes from googleapis-common.
import { OAuth2Client } from "googleapis-common"
import { sheets, type sheets_v4 } from "@googleapis/sheets"
import { drive, type drive_v3 } from "@googleapis/drive"
import type { Database } from "@/types/database.types"
import { getValidAccessToken } from "./tokens"

export async function getGoogleClients(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ sheets: sheets_v4.Sheets; drive: drive_v3.Drive }> {
  const accessToken = await getValidAccessToken(supabase, userId)
  const auth = new OAuth2Client()
  auth.setCredentials({ access_token: accessToken })

  return {
    sheets: sheets({ version: "v4", auth }),
    drive: drive({ version: "v3", auth }),
  }
}
