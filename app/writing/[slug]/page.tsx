import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { zhCN } from "@/locale/zh-cn";
import { renderMarkdown } from "@/lib/markdown";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { getAllArticles, getArticleBySlug } from "@/lib/writing";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return createMetadata({
      title: zhCN.articleDetail.notFoundTitle,
      description: zhCN.articleDetail.notFoundDescription
    });
  }

  return createMetadata({
    title: article.title,
    description: article.description,
    path: `/writing/${article.slug}`
  });
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <Section>
      <article className="mx-auto max-w-[760px]">
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <div className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
            {article.category} / {article.type}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--secondary)]">
            {article.description}
          </p>
          <p className="mt-6 text-sm text-[var(--muted)]">
            {formatDate(article.date)} / {article.readingTime}
          </p>
        </div>
        <div className="prose-content mt-8 rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          {renderMarkdown(article.content)}
        </div>
      </article>
    </Section>
  );
}
