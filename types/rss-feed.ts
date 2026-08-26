import type { ArticleCategory, ArticleType } from "@/types/article";

export type RssFeed = {
  id: string;
  title: string;
  url: string;
  category: ArticleCategory;
  type: ArticleType;
  language: string;
  tags: string[];
  trustScore: number;
  enabled: boolean;
};
