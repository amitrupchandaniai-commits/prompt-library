import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { Toaster } from "@/components/ui/sonner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession()
  const supabase = await createClient()

  const [{ data: profile }, { data: prompts }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("prompts")
      .select("id, title, description")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(200),
  ])

  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          displayName={profile?.display_name ?? null}
          email={user.email ?? ""}
          searchablePrompts={prompts ?? []}
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
