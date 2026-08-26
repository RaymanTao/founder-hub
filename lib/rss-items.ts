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
