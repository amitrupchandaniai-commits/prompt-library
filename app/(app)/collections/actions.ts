"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireSession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"
import { CollectionSchema } from "@/lib/validations/prompt"

export type CollectionFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | undefined

export async function createCollection(
  _prevState: CollectionFormState,
  formData: FormData
): Promise<CollectionFormState> {
  const user = await requireSession()
  const parsed = CollectionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from("collections")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .select("id")
    .single()

  if (error || !created) {
    return { error: "Could not create the collection. Please try again." }
  }

  await logAuditEvent({
    userId: user.id,
    action: "collection.created",
    objectType: "collection",
    objectId: created.id,
    newValue: { name: parsed.data.name },
  })

  revalidatePath("/collections")
  redirect(`/collections/${created.id}`)
}

export async function deleteCollection(collectionId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id)

  if (error) throw error

  await logAuditEvent({
    userId: user.id,
    action: "collection.deleted",
    objectType: "collection",
    objectId: collectionId,
  })

  revalidatePath("/collections")
  redirect("/collections")
}

export async function addPromptToCollection(collectionId: string, promptId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", user.id)
    .single()

  if (!collection) throw new Error("Collection not found")

  await supabase
    .from("collection_prompts")
    .upsert({ collection_id: collectionId, prompt_id: promptId })

  revalidatePath(`/collections/${collectionId}`)
  revalidatePath(`/prompts/${promptId}`)
}

export async function removePromptFromCollection(collectionId: string, promptId: string) {
  const user = await requireSession()
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", user.id)
    .single()

  if (!collection) throw new Error("Collection not found")

  await supabase
    .from("collection_prompts")
    .delete()
    .eq("collection_id", collectionId)
    .eq("prompt_id", promptId)

  revalidatePath(`/collections/${collectionId}`)
  revalidatePath(`/prompts/${promptId}`)
}
