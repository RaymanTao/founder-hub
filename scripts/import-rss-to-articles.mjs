import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content", "writing");
const feedsPath = path.join(process.cwd(), "data", "rss-feeds.json");
const isDryRun = process.argv.includes("--dry-run");
const useLegacyMdx = process.argv.includes("--legacy-mdx");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const perFeedLimit = Number(limitArg?.split("=")[1] ?? 5);

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  };
}

function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

async function supabaseFetch(pathname, init = {}) {
  const config = getSupabaseConfig();

  return fetch(`${config.url}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
}

function decodeXml(input = "") {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] ?? "");
}

function getAtomLink(block) {
  const match = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return decodeXml(match?.[1] ?? "");
}

function getMediaUrl(block) {
  const mediaMatch = block.match(/<media:content\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  const enclosureMatch = block.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  return decodeXml(mediaMatch?.[1] ?? enclosureMatch?.[1] ?? "");
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

async function ensureUniqueSlug(base) {
  const safeBase = slugify(base) || `rss-${Date.now()}`;
  let slug = safeBase;
  let index = 2;

  while (true) {
    try {
      await fs.access(path.join(contentDir, `${slug}.mdx`));
      slug = `${safeBase}-${index}`;
      index += 1;
    } catch {
      return slug;
    }
  }
}

function toDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function toDateOnly(value) {
  return toDate(value).toISOString().slice(0, 10);
}

function toIsoDate(value) {
  return toDate(value).toISOString();
}

function canonicalizeUrl(input) {
  if (!input) return "";

  try {
    const url = new URL(input);
    url.hash = "";
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source"
    ].forEach((key) => url.searchParams.delete(key));
    return url.toString().replace(/\/$/, "");
  } catch {
    return input.trim();
  }
}

function extractItems(xml) {
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  if (rssItems.length) {
    return rssItems.map((item) => ({
      title: getTag(item, "title"),
      link: getTag(item, "link"),
      description: getTag(item, "description") || getTag(item, "content:encoded"),
      date: getTag(item, "pubDate") || getTag(item, "dc:date"),
      imageUrl: getMediaUrl(item),
      raw: item
    }));
  }

  const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return atomEntries.map((entry) => ({
    title: getTag(entry, "title"),
    link: getAtomLink(entry) || getTag(entry, "link"),
    description: getTag(entry, "summary") || getTag(entry, "content"),
    date: getTag(entry, "updated") || getTag(entry, "published"),
    imageUrl: getMediaUrl(entry),
    raw: entry
  }));
}

function scoreItem(item, feed) {
  const text = `${item.title} ${item.description} ${(feed.tags ?? []).join(" ")}`.toLowerCase();
  const keywords = [
    "创业",
    "融资",
    "founder",
    "startup",
    "indie",
    "solo",
    "ai",
    "agent",
    "产品",
    "增长",
    "case",
    "launch"
  ];
  const matched = keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
  const relevanceScore = Math.min(100, 45 + matched * 9);
  const founderValueScore = Math.min(100, Number(feed.trustScore ?? 70) + matched * 4);
  const ageInDays = Math.max(0, (Date.now() - toDate(item.date).getTime()) / 86400000);
  const freshnessScore = Math.max(35, Math.round(100 - ageInDays * 4));
  const score = Math.round(
    relevanceScore * 0.35 + founderValueScore * 0.4 + freshnessScore * 0.25
  );

  return {
    relevanceScore,
    founderValueScore,
    freshnessScore,
    score
  };
}

function createDraftBody(item, feed) {
  return [
    `# ${item.title}`,
    "",
    "## 我的一句话判断",
    "",
    "待补充：这条资讯对创业者意味着什么？",
    "",
    "## 原文要点",
    "",
    item.description || "待补充。",
    "",
    "## 我的解读",
    "",
    "待补充：结合创业、一人公司、融资或案例视角补充自己的判断。",
    "",
    "## 来源",
    "",
    `- 来源：${feed.title}`,
    `- 链接：${item.link || "待补充"}`
  ].join("\n");
}

function toCandidatePayload(item, feed) {
  const canonicalUrl = canonicalizeUrl(item.link);
  const scores = scoreItem(item, feed);

  return {
    feed_id: feed.id,
    feed_title: feed.title,
    feed_url: feed.url,
    title: item.title,
    url: item.link || canonicalUrl,
    canonical_url: canonicalUrl || slugify(`${feed.id}-${item.title}`),
    description: item.description || null,
    published_at: toIsoDate(item.date),
    category: feed.category,
    type: feed.type,
    language: feed.language ?? "zh-CN",
    status: "pending",
    relevance_score: scores.relevanceScore,
    founder_value_score: scores.founderValueScore,
    freshness_score: scores.freshnessScore,
    score: scores.score,
    duplicate_risk: "low",
    suggested_tags: feed.tags ?? [],
    raw_payload: {
      title: item.title,
      link: item.link,
      description: item.description,
      date: item.date,
      imageUrl: item.imageUrl,
      feed: {
        id: feed.id,
        title: feed.title,
        trustScore: feed.trustScore
      }
    }
  };
}

async function importFeedAsMdx(feed, items) {
  let created = 0;

  for (const item of items) {
    const slug = await ensureUniqueSlug(item.title);
    const meta = {
      title: item.title,
      slug,
      description: item.description || `来自 ${feed.title} 的 RSS 资讯，待补充解读。`,
      date: toDateOnly(item.date),
      category: feed.category,
      type: feed.type,
      readingTime: "5 min",
      featured: false,
      published: false,
      archived: false,
      number: 0,
      source: feed.title,
      sourceUrl: item.link || feed.url,
      verified: false,
      access: "Free",
      tags: feed.tags ?? []
    };
    const body = createDraftBody(item, feed);
    const file = matter.stringify(`${body.trim()}\n`, meta);
    await fs.writeFile(path.join(contentDir, `${slug}.mdx`), file, "utf8");
    created += 1;
  }

  return created;
}

async function importFeedAsCandidates(feed, items) {
  const payload = items.map((item) => toCandidatePayload(item, feed));

  if (isDryRun) {
    console.log(`${feed.title}: ${payload.length} candidates`);
    for (const item of payload) {
      console.log(`- [${item.score}] ${item.title}`);
    }
    return 0;
  }

  const response = await supabaseFetch(
    "rss_items?on_conflict=canonical_url&select=id,title",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates,return=representation"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${feed.id} candidate upsert failed: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function importFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "user-agent": "FounderHubRSSBot/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${feed.id} fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const items = extractItems(xml)
    .filter((item) => item.title)
    .slice(0, Number.isFinite(perFeedLimit) ? perFeedLimit : 5);

  if (useLegacyMdx) {
    if (isDryRun) {
      console.log(`${feed.title}: ${items.length} local MDX drafts`);
      for (const item of items) {
        console.log(`- ${item.title}`);
      }
      return 0;
    }

    return importFeedAsMdx(feed, items);
  }

  return importFeedAsCandidates(feed, items);
}

async function main() {
  const feeds = JSON.parse(await fs.readFile(feedsPath, "utf8"));
  const enabledFeeds = feeds.filter((feed) => feed.enabled && feed.url);

  if (!enabledFeeds.length) {
    console.log("No enabled RSS feeds. Edit data/rss-feeds.json first.");
    return;
  }

  if (!useLegacyMdx && !isDryRun && !isSupabaseConfigured()) {
    throw new Error(
      "Supabase is required for RSS candidates. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use --legacy-mdx."
    );
  }

  let total = 0;

  for (const feed of enabledFeeds) {
    total += await importFeed(feed);
  }

  if (!isDryRun) {
    console.log(
      useLegacyMdx
        ? `Created ${total} RSS draft articles.`
        : `Created ${total} RSS candidate items.`
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
