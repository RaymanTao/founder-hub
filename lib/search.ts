import { getAllArticles, getArticleBySlug } from "@/lib/writing";
import type { ArticleMeta } from "@/types/article";

export async function searchArticles(query: string): Promise<ArticleMeta[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const articles = await getAllArticles();
  const results = await Promise.all(
    articles.map(async (article) => {
      const searchable = [
        article.title,
        article.description,
        article.slug,
        article.category,
        article.type,
        article.source,
        article.access,
        ...article.tags
      ].join(" ").toLowerCase();

      if (searchable.includes(normalizedQuery)) return article;

      const fullArticle = await getArticleBySlug(article.slug);
      return fullArticle?.content.toLowerCase().includes(normalizedQuery) ? article : null;
    })
  );

  return results.filter((article): article is ArticleMeta => Boolean(article));
}
