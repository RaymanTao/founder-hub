import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";
import type { ArticleCategory } from "@/types/article";
import type { RssCandidate, RssItemStatus } from "@/types/rss";

type RssItemRow = {
  id: string;
  feed_id: string;
  feed_title: string;
  feed_url: string;
  title: string;
  url: string;
  canonical_url: string;
  description: string | null;
  published_at: string | null;
  category: RssCandidate["category"];
  type: RssCandidate["type"];
  language: string;
  status: RssCandidate["status"];
  relevance_score: number | null;
  founder_value_score: number | null;
  freshness_score: number | null;
  score: number | null;
  duplicate_risk: RssCandidate["duplicateRisk"];
  suggested_tags: string[] | null;
  ai_summary: string | null;
  founder_takeaway: string | null;
  ai_reason: string | null;
  analyzed_at: string | null;
  article_slug: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListRssCandidatesOptions = {
  status?: RssItemStatus | "All";
  category?: ArticleCategory | "All";
  q?: string;
  limit?: number;
};

const rssItemFields = [
  "id",
  "feed_id",
  "feed_title",
  "feed_url",
  "title",
  "url",
  "canonical_url",
  "description",
  "published_at",
  "category",
  "type",
  "language",
  "status",
  "relevance_score",
  "founder_value_score",
  "freshness_score",
  "score",
  "duplicate_risk",
  "suggested_tags",
  "ai_summary",
  "founder_takeaway",
  "ai_reason",
  "analyzed_at",
  "article_slug",
  "imported_at",
  "created_at",
  "updated_at"
].join(",");

function mapRssItemRow(row: RssItemRow): RssCandidate {
  return {
    id: row.id,
    feedId: row.feed_id,
    feedTitle: row.feed_title,
    feedUrl: row.feed_url,
    title: row.title,
    url: row.url,
    canonicalUrl: row.canonical_url,
    description: row.description ?? "",
    publishedAt: row.published_at,
    category: row.category,
    type: row.type,
    language: row.language,
    status: row.status,
    relevanceScore: row.relevance_score,
    founderValueScore: row.founder_value_score,
    freshnessScore: row.freshness_score,
    score: row.score,
    duplicateRisk: row.duplicate_risk,
    suggestedTags: row.suggested_tags ?? [],
    aiSummary: row.ai_summary,
    founderTakeaway: row.founder_takeaway,
    aiReason: row.ai_reason,
    analyzedAt: row.analyzed_at,
    articleSlug: row.article_slug,
    importedAt: row.imported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildQuery(options: ListRssCandidatesOptions) {
  const params = new URLSearchParams();
  params.set("select", rssItemFields);
  params.set("order", "published_at.desc.nullslast,created_at.desc");
  params.set("limit", String(options.limit ?? 100));

  if (options.status && options.status !== "All") {
    params.set("status", `eq.${options.status}`);
  }

  if (options.category && options.category !== "All") {
    params.set("category", `eq.${options.category}`);
  }

  if (options.q) {
    const escaped = options.q.replace(/[%*]/g, "");
    params.set("or", `(title.ilike.*${escaped}*,description.ilike.*${escaped}*,feed_title.ilike.*${escaped}*)`);
  }

  return params.toString();
}

export async function listRssCandidates(options: ListRssCandidatesOptions = {}) {
  if (!isSupabaseConfigured()) return null;

  const response = await supabaseFetch(`rss_items?${buildQuery(options)}`);

  if (!response.ok) {
    throw new Error(`RSS_ITEMS_LIST_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as RssItemRow[];
  return rows.map(mapRssItemRow);
}

export async function getRssCandidateById(id: string) {
  if (!isSupabaseConfigured()) return null;

  const response = await supabaseFetch(
    `rss_items?id=eq.${encodeURIComponent(id)}&select=${rssItemFields}&limit=1`
  );

  if (!response.ok) {
    throw new Error(`RSS_ITEM_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as RssItemRow[];
  return rows[0] ? mapRssItemRow(rows[0]) : null;
}

export async function updateRssCandidateStatus(
  id: string,
  input: {
    status: RssItemStatus;
    articleSlug?: string;
  }
) {
  if (!isSupabaseConfigured()) return false;

  const response = await supabaseFetch(`rss_items?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      status: input.status,
      article_slug: input.articleSlug ?? null,
      imported_at: input.status === "imported" ? new Date().toISOString() : null
    })
  });

  if (!response.ok) {
    throw new Error(`RSS_ITEM_STATUS_FAILED_${response.status}`);
  }

  return true;
}

export async function updateRssCandidateAnalysis(
  id: string,
  input: {
    aiSummary: string;
    founderTakeaway: string;
    aiReason: string;
    relevanceScore: number;
    founderValueScore: number;
    freshnessScore: number;
    score: number;
    duplicateRisk: "low" | "medium" | "high";
    suggestedTags: string[];
  }
) {
  if (!isSupabaseConfigured()) return false;

  const response = await supabaseFetch(`rss_items?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      ai_summary: input.aiSummary,
      founder_takeaway: input.founderTakeaway,
      ai_reason: input.aiReason,
      relevance_score: input.relevanceScore,
      founder_value_score: input.founderValueScore,
      freshness_score: input.freshnessScore,
      score: input.score,
      duplicate_risk: input.duplicateRisk,
      suggested_tags: input.suggestedTags,
      analyzed_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`RSS_ITEM_ANALYSIS_FAILED_${response.status}`);
  }

  return true;
}
