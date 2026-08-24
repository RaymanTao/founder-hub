import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  findSupabaseArticleSlug,
  shouldWriteArticlesToSupabase,
  upsertSupabaseArticle,
  upsertSupabaseArticleSource
} from "@/lib/article-db";
import { createInterpretationTemplate } from "@/lib/article-template";
import { ArticleMeta, ArticleType } from "@/types/article";

const contentDir = path.join(process.cwd(), "content", "writing");

export type ArticleMetaUpdate = Omit<ArticleMeta, "slug">;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

async function ensureUniqueSlug(base: string) {
  const safeBase = slugify(base) || `article-${Date.now()}`;
  let slug = safeBase;
  let index = 2;

  while (true) {
    if (shouldWriteArticlesToSupabase()) {
      const existingSlug = await findSupabaseArticleSlug(slug);
      if (!existingSlug) return slug;
      slug = `${safeBase}-${index}`;
      index += 1;
      continue;
    }

    try {
      await fs.access(path.join(contentDir, `${slug}.mdx`));
      slug = `${safeBase}-${index}`;
      index += 1;
    } catch {
      return slug;
    }
  }
}

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function getMetaContent(html: string, key: string, value: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find((item) => getAttribute(item, key).toLowerCase() === value);
  return tag ? getAttribute(tag, "content") : "";
}

function getLinkHref(html: string, rel: string) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const tag = tags.find((item) => getAttribute(item, "rel").toLowerCase() === rel);
  return tag ? getAttribute(tag, "href") : "";
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  if (!value) return undefined;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function toDateOnly(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function extractKeywords(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function extractPageMeta(html: string, url: string) {
  const title =
    getMetaContent(html, "property", "og:title") ||
    getMetaContent(html, "name", "twitter:title") ||
    decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ||
    "未命名采集文章";

  const description =
    getMetaContent(html, "name", "description") ||
    getMetaContent(html, "property", "og:description") ||
    "从第三方来源采集的待编辑草稿，请补充自己的解读后再发布。";

  const siteName =
    getMetaContent(html, "property", "og:site_name") ||
    new URL(url).hostname.replace(/^www\./, "");

  const canonicalUrl = toAbsoluteUrl(getLinkHref(html, "canonical"), url) ?? url;
  const image =
    toAbsoluteUrl(getMetaContent(html, "property", "og:image"), url) ??
    toAbsoluteUrl(getMetaContent(html, "name", "twitter:image"), url);
  const publishedAt =
    toDateOnly(getMetaContent(html, "property", "article:published_time")) ||
    toDateOnly(getMetaContent(html, "name", "date")) ||
    toDateOnly(getMetaContent(html, "name", "pubdate"));
  const keywords = extractKeywords(getMetaContent(html, "name", "keywords"));
  const author =
    getMetaContent(html, "name", "author") ||
    getMetaContent(html, "property", "article:author");

  return {
    title,
    description,
    siteName,
    canonicalUrl,
    image,
    publishedAt,
    keywords,
    author
  };
}

async function writeArticle(slug: string, meta: ArticleMeta, body: string) {
  if (shouldWriteArticlesToSupabase()) {
    await upsertSupabaseArticle({
      ...meta,
      slug,
      content: body
    });
    return;
  }

  const next = matter.stringify(`${body.trim()}\n`, meta);
  await fs.writeFile(path.join(contentDir, `${slug}.mdx`), next, "utf8");
}

export async function updateArticle(slug: string, update: ArticleMetaUpdate, body: string) {
  const nextData: ArticleMeta = {
    ...update,
    slug
  };

  if (shouldWriteArticlesToSupabase()) {
    await upsertSupabaseArticle({
      ...nextData,
      content: body
    });
    if (nextData.sourceUrl) {
      await upsertSupabaseArticleSource({
        articleSlug: slug,
        sourceUrl: nextData.sourceUrl,
        sourceTitle: nextData.title,
        sourceSite: nextData.source,
        metadata: {
          importedFrom: "admin-edit",
          verified: nextData.verified
        }
      });
    }
    return;
  }

  const filePath = path.join(contentDir, `${slug}.mdx`);
  const next = matter.stringify(`${body.trim()}\n`, nextData);
  await fs.writeFile(filePath, next, "utf8");
}

export async function createBlankArticle(input: {
  title: string;
  description: string;
  type: ArticleType;
}) {
  const slug = await ensureUniqueSlug(input.title);
  const today = new Date().toISOString().slice(0, 10);
  const meta: ArticleMeta = {
    title: input.title,
    slug,
    description: input.description,
    date: today,
    category: "AI",
    type: input.type,
    readingTime: "5 min",
    featured: false,
    published: false,
    archived: false,
    number: 0,
    source: "Founder Hub",
    verified: true,
    access: "Free",
    tags: []
  };

  const body = createInterpretationTemplate({
    title: input.title,
    source: "Founder Hub",
    description: input.description
  });

  await writeArticle(slug, meta, body);

  return slug;
}

export async function createArticleFromUrl(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "FounderHubBot/1.0 (+https://founder-hub.local)"
    }
  });

  if (!response.ok) {
    throw new Error(`FETCH_FAILED_${response.status}`);
  }

  const html = await response.text();
  const page = extractPageMeta(html, url);
  const slug = await ensureUniqueSlug(page.title);
  const meta: ArticleMeta = {
    title: page.title,
    slug,
    description: page.description,
    date: page.publishedAt || new Date().toISOString().slice(0, 10),
    category: "AI",
    type: "Founder Analysis",
    readingTime: "5 min",
    featured: false,
    published: false,
    archived: false,
    number: 0,
    source: page.siteName,
    sourceUrl: page.canonicalUrl,
    verified: false,
    access: "Free",
    tags: page.keywords,
    cover: page.image
  };

  const body = createInterpretationTemplate({
    title: page.title,
    sourceUrl: page.canonicalUrl,
    source: page.siteName,
    author: page.author,
    description: page.description
  });

  await writeArticle(slug, meta, body);

  if (shouldWriteArticlesToSupabase()) {
    await upsertSupabaseArticleSource({
      articleSlug: slug,
      sourceUrl: page.canonicalUrl,
      sourceTitle: page.title,
      sourceSite: page.siteName,
      author: page.author,
      metadata: {
        importedFrom: "url",
        description: page.description,
        image: page.image,
        publishedAt: page.publishedAt,
        keywords: page.keywords
      }
    });
  }

  return slug;
}
