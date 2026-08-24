export type ArticleCategory =
  | "Build"
  | "AI"
  | "Growth"
  | "Solopreneur";

export type ArticleType =
  | "Tutorial"
  | "Case Study"
  | "Essay"
  | "Build Log"
  | "Product Review"
  | "Founder Analysis"
  | "Experiment";

export type ArticleAccess = "Free" | "Deep Dive";

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: ArticleCategory;
  type: ArticleType;
  readingTime: string;
  featured: boolean;
  published: boolean;
  archived: boolean;
  number: number;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  access: ArticleAccess;
  tags: string[];
  audioUrl?: string;
  cover?: string;
};

export type Article = ArticleMeta & {
  content: string;
};
