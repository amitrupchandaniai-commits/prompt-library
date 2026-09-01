import { redirect } from "next/navigation"
import { getSession } from "@/lib/dal"

export default async function RootPage() {
  const user = await getSession()
  redirect(user ? "/dashboard" : "/login")
}
