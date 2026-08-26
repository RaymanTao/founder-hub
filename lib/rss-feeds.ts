import fallbackFeeds from "@/data/rss-feeds.json";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";
import type { RssFeed } from "@/types/rss-feed";

type FeedRow = {
  id: string;
  title: string;
  url: string;
  category: RssFeed["category"];
  type: RssFeed["type"];
  language: string;
  tags: string[] | null;
  trust_score: number;
  enabled: boolean;
};

function mapFeed(row: FeedRow): RssFeed {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    category: row.category,
    type: row.type,
    language: row.language,
    tags: row.tags ?? [],
    trustScore: row.trust_score,
    enabled: row.enabled
  };
}

function fallback() {
  return fallbackFeeds as RssFeed[];
}

export async function getRssFeeds(): Promise<RssFeed[]> {
  if (!isSupabaseConfigured()) return fallback();
  const response = await supabaseFetch("rss_feeds?select=*&order=title.asc");
  if (!response.ok) return fallback();
  return ((await response.json()) as FeedRow[]).map(mapFeed);
}

export async function saveRssFeed(feed: RssFeed) {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const response = await supabaseFetch("rss_feeds?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: feed.id,
      title: feed.title,
      url: feed.url,
      category: feed.category,
      type: feed.type,
      language: feed.language,
      tags: feed.tags,
      trust_score: feed.trustScore,
      enabled: feed.enabled
    })
  });
  if (!response.ok) throw new Error(`RSS_FEED_SAVE_FAILED_${response.status}`);
}

export async function deleteRssFeed(id: string) {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const response = await supabaseFetch(`rss_feeds?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
  if (!response.ok) throw new Error(`RSS_FEED_DELETE_FAILED_${response.status}`);
}
