import { analyzeRssCandidate } from "@/lib/rss-ai";
import { getRssFeeds } from "@/lib/rss-feeds";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";
import type { ArticleCategory, ArticleType } from "@/types/article";
import type { RssCandidate } from "@/types/rss";

type Feed = Awaited<ReturnType<typeof getRssFeeds>>[number];

function decodeXml(input: string) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] ?? "");
}

function getLink(block: string) {
  return decodeXml(
    block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
      getTag(block, "link")
  );
}

function getItems(xml: string) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return blocks
    .map((block) => ({
      title: getTag(block, "title"),
      link: getLink(block),
      description: getTag(block, "description") || getTag(block, "summary") || getTag(block, "content:encoded"),
      date: getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated")
    }))
    .filter((item) => item.title);
}

function canonicalizeUrl(input: string) {
  try {
    const url = new URL(input);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "source"].forEach((key) =>
      url.searchParams.delete(key)
    );
    return url.toString().replace(/\/$/, "");
  } catch {
    return input.trim();
  }
}

function scoreItem(title: string, description: string, dateValue: string, feed: Feed) {
  const text = `${title} ${description} ${(feed.tags ?? []).join(" ")}`.toLowerCase();
  const keywords = ["创业", "融资", "founder", "startup", "indie", "solo", "ai", "agent", "产品", "增长", "case", "launch"];
  const matched = keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
  const relevanceScore = Math.min(100, 45 + matched * 9);
  const founderValueScore = Math.min(100, Number(feed.trustScore ?? 70) + matched * 4);
  const date = new Date(dateValue);
  const ageInDays = Number.isNaN(date.getTime()) ? 0 : Math.max(0, (Date.now() - date.getTime()) / 86400000);
  const freshnessScore = Math.max(35, Math.round(100 - ageInDays * 4));
  return { relevanceScore, founderValueScore, freshnessScore, score: Math.round(relevanceScore * 0.35 + founderValueScore * 0.4 + freshnessScore * 0.25) };
}

function toCandidate(item: ReturnType<typeof getItems>[number], feed: Feed): RssCandidate {
  const canonicalUrl = canonicalizeUrl(item.link || `${feed.url}#${item.title}`);
  const publishedAt = item.date && !Number.isNaN(new Date(item.date).getTime())
    ? new Date(item.date).toISOString()
    : new Date().toISOString();
  const scores = scoreItem(item.title, item.description, publishedAt, feed);
  return {
    id: canonicalUrl,
    feedId: feed.id,
    feedTitle: feed.title,
    feedUrl: feed.url,
    title: item.title,
    url: item.link || canonicalUrl,
    canonicalUrl,
    description: item.description,
    publishedAt,
    category: feed.category as ArticleCategory,
    type: feed.type as ArticleType,
    language: feed.language ?? "zh-CN",
    status: "pending",
    ...scores,
    duplicateRisk: "low",
    suggestedTags: feed.tags ?? [],
    aiSummary: null,
    founderTakeaway: null,
    aiReason: null,
    analyzedAt: null,
    articleSlug: null,
    importedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function importRssCandidates(limit = 5) {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const feeds = (await getRssFeeds()).filter((feed) => feed.enabled && feed.url);
  let feedCount = 0;
  let itemCount = 0;

  for (const feed of feeds) {
    const response = await fetch(feed.url, { headers: { "user-agent": "FounderHubRSSBot/1.0" }, cache: "no-store" });
    if (!response.ok) throw new Error(`${feed.id}_FETCH_FAILED_${response.status}`);
    const items = getItems(await response.text()).slice(0, limit);
    const payload = [];
    for (const item of items) {
      const candidate = toCandidate(item, feed);
      let analysis = null;
      if (process.env.DEEPSEEK_API_KEY) {
        try {
          analysis = await analyzeRssCandidate(candidate);
        } catch (error) {
          console.warn(`RSS AI skipped for ${candidate.title}:`, error);
        }
      }
      payload.push({
        feed_id: candidate.feedId,
        feed_title: candidate.feedTitle,
        feed_url: candidate.feedUrl,
        title: candidate.title,
        url: candidate.url,
        canonical_url: candidate.canonicalUrl,
        description: candidate.description || null,
        published_at: candidate.publishedAt,
        category: candidate.category,
        type: candidate.type,
        language: candidate.language,
        status: "pending",
        relevance_score: analysis?.relevanceScore ?? candidate.relevanceScore,
        founder_value_score: analysis?.founderValueScore ?? candidate.founderValueScore,
        freshness_score: analysis?.freshnessScore ?? candidate.freshnessScore,
        score: analysis?.score ?? candidate.score,
        duplicate_risk: analysis?.duplicateRisk ?? candidate.duplicateRisk,
        suggested_tags: analysis?.suggestedTags ?? candidate.suggestedTags,
        ai_summary: analysis?.aiSummary ?? null,
        founder_takeaway: analysis?.founderTakeaway ?? null,
        ai_reason: analysis?.aiReason ?? null,
        analyzed_at: analysis ? new Date().toISOString() : null,
        raw_payload: { title: candidate.title, link: candidate.url, description: candidate.description, date: candidate.publishedAt }
      });
    }
    if (payload.length) {
      const upsert = await supabaseFetch("rss_items?on_conflict=canonical_url&select=id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify(payload)
      });
      if (!upsert.ok) throw new Error(`${feed.id}_UPSERT_FAILED_${upsert.status}`);
      const rows = await upsert.json();
      itemCount += Array.isArray(rows) ? rows.length : 0;
    }
    feedCount += 1;
  }
  return { feedCount, itemCount, configuredFeedCount: feeds.length };
}
