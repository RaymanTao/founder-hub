import { Article, ArticleMeta } from "@/types/article";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

type ArticleRow = {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: ArticleMeta["category"];
  type: ArticleMeta["type"];
  reading_time: string;
  featured: boolean;
  published: boolean;
  archived: boolean;
  number: number;
  source: string;
  source_url: string | null;
  verified: boolean;
  access: ArticleMeta["access"];
  tags: string[] | null;
  audio_url: string | null;
  cover: string | null;
  body?: string | null;
};

const articleFields = [
  "title",
  "slug",
  "description",
  "date",
  "category",
  "type",
  "reading_time",
  "featured",
  "published",
  "archived",
  "number",
  "source",
  "source_url",
  "verified",
  "access",
  "tags",
  "audio_url",
  "cover"
].join(",");

function isSupabaseArticleSourceEnabled() {
  return process.env.ARTICLE_CONTENT_SOURCE === "supabase";
}

function mapArticleRow(row: ArticleRow): ArticleMeta {
  return {
    title: row.title,
    slug: row.slug,
    description: row.description,
    date: row.date,
    category: row.category,
    type: row.type,
    readingTime: row.reading_time,
    featured: row.featured,
    published: row.published,
    archived: row.archived,
    number: row.number,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    verified: row.verified,
    access: row.access,
    tags: row.tags ?? [],
    audioUrl: row.audio_url ?? undefined,
    cover: row.cover ?? undefined
  };
}

export function shouldReadArticlesFromSupabase() {
  return isSupabaseConfigured() && isSupabaseArticleSourceEnabled();
}

export async function listSupabaseArticles() {
  if (!shouldReadArticlesFromSupabase()) return null;

  const response = await supabaseFetch(
    `articles?select=${articleFields}&order=date.desc,number.desc`
  );

  if (!response.ok) {
    throw new Error(`ARTICLES_LIST_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as ArticleRow[];
  return rows.map(mapArticleRow);
}

export async function getSupabaseArticleBySlug(slug: string) {
  if (!shouldReadArticlesFromSupabase()) return null;

  const response = await supabaseFetch(
    `articles?slug=eq.${encodeURIComponent(slug)}&select=${articleFields},body&limit=1`
  );

  if (!response.ok) {
    throw new Error(`ARTICLE_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as ArticleRow[];
  const row = rows[0];
  if (!row) return null;

  return {
    ...mapArticleRow(row),
    content: row.body ?? ""
  } satisfies Article;
}
