import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// For headless contexts with no request/cookies (Trigger.dev jobs, scripts).
// Bypasses RLS via the service role key — never expose this client or its
// key to the browser.
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
