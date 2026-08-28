import type { ArticleCategory } from "@/types/article";
import type { RssFeed } from "@/types/rss-feed";

export type OpmlFeed = Pick<RssFeed, "title" | "url" | "category" | "language" | "tags">;

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function categoryFromPath(path: string): ArticleCategory {
  const value = path.toLowerCase();
  if (value.includes("artificial") || value.includes("ai")) return "AI";
  if (value.includes("engineering") || value.includes("technology") || value.includes("product")) return "Build";
  if (value.includes("business") || value.includes("news") || value.includes("media")) return "Growth";
  return "Growth";
}

function getAttribute(attributes: string, name: string) {
  const match = attributes.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

export function parseOpml(xml: string): OpmlFeed[] {
  if (!/<opml\b/i.test(xml) || xml.length > 5_000_000) {
    throw new Error("INVALID_OPML");
  }

  const feeds: OpmlFeed[] = [];
  const stack: string[] = [];
  const tokenPattern = /<outline\b([^>]*?)\/?>(?:<\/outline>)?|<\/outline>/gi;
  let token: RegExpExecArray | null;
  while ((token = tokenPattern.exec(xml))) {
    if (token[0].startsWith("</")) {
      stack.pop();
      continue;
    }

    const attributes = token[1];
    const url = getAttribute(attributes, "xmlUrl");
    const title = getAttribute(attributes, "title") || getAttribute(attributes, "text");
    if (url && title && /^https?:\/\//i.test(url)) {
      const groupName = stack.join(" / ");
      feeds.push({
        title,
        url,
        category: categoryFromPath(groupName),
        language: /[\u4e00-\u9fff]/.test(`${title} ${groupName}`) ? "zh-CN" : "en",
        tags: ["tidings-rss", groupName].filter(Boolean)
      });
    } else if (!/\/$/.test(token[0])) {
      stack.push(title);
    }
  }

  const unique = new Map<string, OpmlFeed>();
  for (const feed of feeds) unique.set(feed.url.toLowerCase(), feed);
  return [...unique.values()];
}

export function rssFeedId(title: string, url: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "feed";
  let hash = 0;
  for (const char of url) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `tidings-${base}-${hash.toString(36)}`;
}
