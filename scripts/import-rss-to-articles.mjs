import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content", "writing");
const feedsPath = path.join(process.cwd(), "data", "rss-feeds.json");
const isDryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const perFeedLimit = Number(limitArg?.split("=")[1] ?? 5);

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

function toDateOnly(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function extractItems(xml) {
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  if (rssItems.length) {
    return rssItems.map((item) => ({
      title: getTag(item, "title"),
      link: getTag(item, "link"),
      description: getTag(item, "description"),
      date: getTag(item, "pubDate") || getTag(item, "dc:date")
    }));
  }

  const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return atomEntries.map((entry) => ({
    title: getTag(entry, "title"),
    link: getAtomLink(entry) || getTag(entry, "link"),
    description: getTag(entry, "summary") || getTag(entry, "content"),
    date: getTag(entry, "updated") || getTag(entry, "published")
  }));
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

  if (isDryRun) {
    console.log(`${feed.title}: ${items.length} items`);
    for (const item of items) {
      console.log(`- ${item.title}`);
    }
    return 0;
  }

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

async function main() {
  const feeds = JSON.parse(await fs.readFile(feedsPath, "utf8"));
  const enabledFeeds = feeds.filter((feed) => feed.enabled && feed.url);

  if (!enabledFeeds.length) {
    console.log("No enabled RSS feeds. Edit data/rss-feeds.json first.");
    return;
  }

  let total = 0;

  for (const feed of enabledFeeds) {
    total += await importFeed(feed);
  }

  if (!isDryRun) {
    console.log(`Created ${total} RSS draft articles.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
