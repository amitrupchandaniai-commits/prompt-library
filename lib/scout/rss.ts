import "server-only"
import Parser from "rss-parser"

export type FeedItem = {
  title: string
  link: string
  content: string
  author?: string
  publicationDate?: string
}

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "PromptLibrary-PromptScout/0.1 (+https://prompt-library-beta-topaz.vercel.app)" },
})

/** Fetches an RSS/Atom feed and returns its items, newest first, capped at `limit`. */
export async function fetchFeedItems(feedUrl: string, limit: number): Promise<FeedItem[]> {
  const feed = await parser.parseURL(feedUrl)

  return (feed.items ?? []).slice(0, limit).map((item) => ({
    title: item.title?.trim() || "(untitled)",
    link: item.link?.trim() || feedUrl,
    content: (item["content:encoded"] || item.content || item.contentSnippet || item.summary || "").trim(),
    author: item.creator || item.author || undefined,
    publicationDate: item.isoDate || item.pubDate || undefined,
  }))
}
