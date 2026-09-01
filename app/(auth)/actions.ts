"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SignInSchema, SignUpSchema, MagicLinkSchema } from "@/lib/validations/auth"

export type AuthFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: string
} | undefined

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: "Incorrect email or password." }
  }

  redirect("/dashboard")
}

export async function signInWithMagicLink(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = MagicLinkSchema.safeParse({ email: formData.get("email") })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback` },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: "Check your email for a magic sign-in link." }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
