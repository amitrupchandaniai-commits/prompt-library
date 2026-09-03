// One-time (and safe to re-run) backfill: generates embeddings for every prompt
// that doesn't have one yet — needed for prompts created before semantic search
// shipped, or any time OPENAI_API_KEY wasn't set when a prompt was saved.
// Usage: node --env-file=.env.local scripts/backfill-embeddings.mjs
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}
if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)
const openai = new OpenAI({ apiKey: openaiKey })

async function embed(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  })
  return `[${response.data[0].embedding.join(",")}]`
}

async function main() {
  const { data: prompts, error } = await supabase
    .from("prompts")
    .select("id, title, description, prompt_text")
    .is("embedding", null)

  if (error) throw error

  if (!prompts || prompts.length === 0) {
    console.log("Nothing to backfill — every prompt already has an embedding.")
    return
  }

  console.log(`Backfilling embeddings for ${prompts.length} prompt(s)...`)

  let done = 0
  for (const prompt of prompts) {
    const content = [prompt.title, prompt.description, prompt.prompt_text]
      .filter(Boolean)
      .join("\n\n")

    try {
      const embedding = await embed(content)
      const { error: updateError } = await supabase
        .from("prompts")
        .update({ embedding })
        .eq("id", prompt.id)
      if (updateError) throw updateError
      done += 1
      console.log(`  [${done}/${prompts.length}] ${prompt.title}`)
    } catch (err) {
      console.error(`  Failed for "${prompt.title}" (${prompt.id}):`, err.message)
    }
  }

  console.log(`\nDone. Embedded ${done} of ${prompts.length} prompts.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
