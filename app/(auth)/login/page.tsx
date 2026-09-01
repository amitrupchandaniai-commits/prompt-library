"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { signIn, signInWithMagicLink, type AuthFormState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: AuthFormState = undefined

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic-link">("password")
  const [state, action, pending] = useActionState(
    mode === "password" ? signIn : signInWithMagicLink,
    initialState
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to your prompt library.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          {mode === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              {state?.fieldErrors?.password && (
                <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
              )}
            </div>
          )}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Please wait…" : mode === "password" ? "Sign in" : "Send magic link"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "password" ? "Sign in with a magic link instead" : "Sign in with a password instead"}
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
