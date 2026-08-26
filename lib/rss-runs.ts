import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

export type RssRun = {
  id: string;
  trigger: "cron" | "manual";
  status: "running" | "success" | "failed";
  feedCount: number;
  itemCount: number;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type RunRow = {
  id: string;
  trigger: RssRun["trigger"];
  status: RssRun["status"];
  feed_count: number;
  item_count: number;
  message: string | null;
  started_at: string;
  finished_at: string | null;
};

function mapRun(row: RunRow): RssRun {
  return { id: row.id, trigger: row.trigger, status: row.status, feedCount: row.feed_count, itemCount: row.item_count, message: row.message, startedAt: row.started_at, finishedAt: row.finished_at };
}

export async function listRssRuns(limit = 10) {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseFetch(`rss_feed_runs?select=*&order=started_at.desc&limit=${limit}`);
  if (!response.ok) return null;
  return ((await response.json()) as RunRow[]).map(mapRun);
}

export async function startRssRun(trigger: RssRun["trigger"]) {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseFetch("rss_feed_runs?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ trigger, status: "running" })
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

export async function finishRssRun(id: string | null, input: { status: "success" | "failed"; feedCount?: number; itemCount?: number; message?: string }) {
  if (!id || !isSupabaseConfigured()) return;
  await supabaseFetch(`rss_feed_runs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: input.status, feed_count: input.feedCount ?? 0, item_count: input.itemCount ?? 0, message: input.message ?? null, finished_at: new Date().toISOString() })
  });
}

export async function testRssFeedUrl(url: string) {
  const response = await fetch(url, { headers: { "user-agent": "FounderHubRSSBot/1.0" }, cache: "no-store" });
  return { ok: response.ok, status: response.status, contentType: response.headers.get("content-type") ?? "", bytes: Number(response.headers.get("content-length") ?? 0) };
}
