import type { ArticleCategory, ArticleType } from "@/types/article";

export type RssItemStatus = "pending" | "selected" | "rejected" | "imported";

export type RssCandidate = {
  id: string;
  feedId: string;
  feedTitle: string;
  feedUrl: string;
  title: string;
  url: string;
  canonicalUrl: string;
  description: string;
  publishedAt: string | null;
  category: ArticleCategory;
  type: ArticleType;
  language: string;
  status: RssItemStatus;
  relevanceScore: number | null;
  founderValueScore: number | null;
  freshnessScore: number | null;
  score: number | null;
  duplicateRisk: "low" | "medium" | "high" | null;
  suggestedTags: string[];
  articleSlug: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
