import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Article, ArticleMeta } from "@/types/article";

const contentDir = path.join(process.cwd(), "content", "writing");

type GetAllArticlesOptions = {
  includeDrafts?: boolean;
  includeArchived?: boolean;
};

function normalizeArticleMeta(data: Record<string, unknown>): ArticleMeta {
  return {
    ...(data as ArticleMeta),
    number: Number(data.number ?? 0),
    source: typeof data.source === "string" ? data.source : "Founder Hub",
    verified: data.verified !== false,
    access: data.access === "Deep Dive" ? "Deep Dive" : "Free",
    published: data.published !== false,
    archived: data.archived === true,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : []
  };
}

export async function getAllArticles(
  options: GetAllArticlesOptions = {}
): Promise<ArticleMeta[]> {
  const files = await fs.readdir(contentDir);
  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(contentDir, file), "utf8");
        const { data } = matter(raw);
        return normalizeArticleMeta(data);
      })
  );

  return articles
    .filter((article) => options.includeArchived || !article.archived)
    .filter((article) => options.includeDrafts || article.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getFeaturedArticles() {
  const articles = await getAllArticles();
  return articles.filter((article) => article.featured).slice(0, 3);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const files = await fs.readdir(contentDir);
  const fileName = files.find((file) => file === `${slug}.mdx`);

  if (!fileName) {
    return null;
  }

  const raw = await fs.readFile(path.join(contentDir, fileName), "utf8");
  const { data, content } = matter(raw);

  return {
    ...normalizeArticleMeta(data),
    content
  };
}
