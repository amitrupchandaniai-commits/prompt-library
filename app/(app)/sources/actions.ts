"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"

const SourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  url: z.url("Enter a valid URL"),
  type: z.enum(["rss", "api", "web"]),
  trustScore: z.coerce.number().int().min(0).max(100),
  notes: z.string().trim().max(1000).optional(),
})

export type SourceFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | undefined

export async function addSource(
  _prevState: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  const user = await requireSession()

  const parsed = SourceSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
    type: formData.get("type"),
    trustScore: formData.get("trustScore") || 70,
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("sources").insert({
    name: parsed.data.name,
    url: parsed.data.url,
    type: parsed.data.type,
    trust_score: parsed.data.trustScore,
    notes: parsed.data.notes || null,
  })

  if (error) {
    return { error: "Could not add this source. Please try again." }
  }

  await logAuditEvent({
    userId: user.id,
    action: "source.created",
    objectType: "source",
    newValue: { name: parsed.data.name, url: parsed.data.url },
  })

  revalidatePath("/sources")
}

export async function toggleSourceEnabled(sourceId: string, enabled: boolean) {
  const user = await requireSession()
  const supabase = await createClient()

  const { error } = await supabase.from("sources").update({ enabled }).eq("id", sourceId)
  if (error) throw new Error("Could not update this source")

  await logAuditEvent({
    userId: user.id,
    action: enabled ? "source.enabled" : "source.disabled",
    objectType: "source",
    objectId: sourceId,
  })

  revalidatePath("/sources")
}

export async function deleteSource(sourceId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { error } = await supabase.from("sources").delete().eq("id", sourceId)
  if (error) throw new Error("Could not delete this source")

  await logAuditEvent({
    userId: user.id,
    action: "source.deleted",
    objectType: "source",
    objectId: sourceId,
  })

  revalidatePath("/sources")
}
