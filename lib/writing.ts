import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Article, ArticleMeta } from "@/types/article";

const contentDir = path.join(process.cwd(), "content", "writing");

export async function getAllArticles(): Promise<ArticleMeta[]> {
  const files = await fs.readdir(contentDir);
  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(contentDir, file), "utf8");
        const { data } = matter(raw);
        return data as ArticleMeta;
      })
  );

  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
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
    ...(data as ArticleMeta),
    content
  };
}
