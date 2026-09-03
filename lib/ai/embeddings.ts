import "server-only"
import OpenAI from "openai"

const EMBEDDING_MODEL = "text-embedding-3-small"

/** Returns a pgvector-literal string ("[0.1,0.2,...]") ready to store in a `vector` column. */
export async function generateEmbedding(text: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // model's input limit is generous; this is a sane upper bound for a prompt
  })

  const [{ embedding }] = response.data
  return `[${embedding.join(",")}]`
}
