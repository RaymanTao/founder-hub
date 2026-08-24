import { Article, ArticleMeta } from "@/types/article";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

type ArticleRow = {
  id?: string;
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

export type ArticleWriteInput = ArticleMeta & {
  content: string;
};

export type ArticleRevision = {
  id: string;
  article_id: string;
  title: string;
  description: string;
  body: string;
  meta: Record<string, unknown>;
  created_by: string;
  created_at: string;
};

const articleFields = [
  "id",
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

export function shouldWriteArticlesToSupabase() {
  return shouldReadArticlesFromSupabase();
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

function toArticlePayload(article: ArticleWriteInput) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.content.trim(),
    date: article.date,
    category: article.category,
    type: article.type,
    reading_time: article.readingTime,
    featured: article.featured,
    published: article.published,
    archived: article.archived,
    number: article.number,
    source: article.source,
    source_url: article.sourceUrl ?? null,
    verified: article.verified,
    access: article.access,
    tags: article.tags,
    audio_url: article.audioUrl ?? null,
    cover: article.cover ?? null
  };
}

async function createArticleRevision(articleId: string, article: ArticleWriteInput) {
  const response = await supabaseFetch("article_revisions", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      article_id: articleId,
      title: article.title,
      description: article.description,
      body: article.content.trim(),
      meta: {
        slug: article.slug,
        date: article.date,
        category: article.category,
        type: article.type,
        readingTime: article.readingTime,
        featured: article.featured,
        published: article.published,
        archived: article.archived,
        number: article.number,
        source: article.source,
        sourceUrl: article.sourceUrl,
        verified: article.verified,
        access: article.access,
        tags: article.tags,
        audioUrl: article.audioUrl,
        cover: article.cover
      }
    })
  });

  if (!response.ok) {
    throw new Error(`ARTICLE_REVISION_INSERT_FAILED_${response.status}`);
  }
}

export async function upsertSupabaseArticle(article: ArticleWriteInput) {
  if (!shouldWriteArticlesToSupabase()) return null;

  const response = await supabaseFetch("articles?on_conflict=slug&select=id,slug", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(toArticlePayload(article))
  });

  if (!response.ok) {
    throw new Error(`ARTICLE_UPSERT_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{ id: string; slug: string }>;
  const row = rows[0];

  if (!row) {
    throw new Error("ARTICLE_UPSERT_EMPTY_RESPONSE");
  }

  await createArticleRevision(row.id, article);
  return row;
}

export async function findSupabaseArticleSlug(slug: string) {
  if (!shouldWriteArticlesToSupabase()) return null;

  const response = await supabaseFetch(
    `articles?slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`
  );

  if (!response.ok) {
    throw new Error(`ARTICLE_SLUG_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{ slug: string }>;
  return rows[0]?.slug ?? null;
}

export async function upsertSupabaseArticleSource(input: {
  articleSlug: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceSite?: string;
  author?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!shouldWriteArticlesToSupabase()) return;

  const articleResponse = await supabaseFetch(
    `articles?slug=eq.${encodeURIComponent(input.articleSlug)}&select=id&limit=1`
  );

  if (!articleResponse.ok) {
    throw new Error(`ARTICLE_SOURCE_ARTICLE_FIND_FAILED_${articleResponse.status}`);
  }

  const articleRows = (await articleResponse.json()) as Array<{ id: string }>;
  const articleId = articleRows[0]?.id;
  if (!articleId) return;

  const response = await supabaseFetch("article_sources?on_conflict=article_id,source_url", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      article_id: articleId,
      source_url: input.sourceUrl,
      source_title: input.sourceTitle ?? null,
      source_site: input.sourceSite ?? null,
      author: input.author ?? null,
      metadata: input.metadata ?? {}
    })
  });

  if (!response.ok) {
    throw new Error(`ARTICLE_SOURCE_UPSERT_FAILED_${response.status}`);
  }
}

export async function listSupabaseArticleRevisions(slug: string) {
  if (!shouldReadArticlesFromSupabase()) return null;

  const articleResponse = await supabaseFetch(
    `articles?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`
  );

  if (!articleResponse.ok) {
    throw new Error(`ARTICLE_REVISION_ARTICLE_FIND_FAILED_${articleResponse.status}`);
  }

  const articleRows = (await articleResponse.json()) as Array<{ id: string }>;
  const articleId = articleRows[0]?.id;
  if (!articleId) return [];

  const response = await supabaseFetch(
    `article_revisions?article_id=eq.${encodeURIComponent(
      articleId
    )}&select=id,article_id,title,description,body,meta,created_by,created_at&order=created_at.desc&limit=100`
  );

  if (!response.ok) {
    throw new Error(`ARTICLE_REVISIONS_LIST_FAILED_${response.status}`);
  }

  return (await response.json()) as ArticleRevision[];
}

export async function getSupabaseArticleRevision(slug: string, revisionId: string) {
  if (!shouldReadArticlesFromSupabase()) return null;

  const articleResponse = await supabaseFetch(
    `articles?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`
  );

  if (!articleResponse.ok) {
    throw new Error(`ARTICLE_REVISION_ARTICLE_FIND_FAILED_${articleResponse.status}`);
  }

  const articleRows = (await articleResponse.json()) as Array<{ id: string }>;
  const articleId = articleRows[0]?.id;
  if (!articleId) return null;

  const response = await supabaseFetch(
    `article_revisions?id=eq.${encodeURIComponent(
      revisionId
    )}&article_id=eq.${encodeURIComponent(
      articleId
    )}&select=id,article_id,title,description,body,meta,created_by,created_at&limit=1`
  );

  if (!response.ok) {
    throw new Error(`ARTICLE_REVISION_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as ArticleRevision[];
  return rows[0] ?? null;
}
