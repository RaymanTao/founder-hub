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

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: ArticleCategory;
  type: ArticleType;
  readingTime: string;
  featured: boolean;
};

export type Article = ArticleMeta & {
  content: string;
};
