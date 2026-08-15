import { ArticleCard } from "@/components/cards/article-card";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { zhCN } from "@/locale/zh-cn";
import { createMetadata } from "@/lib/seo";
import { getAllArticles } from "@/lib/writing";

export const metadata = createMetadata({
  title: zhCN.writing.metadataTitle,
  description: zhCN.writing.metadataDescription,
  path: "/writing"
});

export default async function WritingPage() {
  const articles = await getAllArticles();

  return (
    <Section>
      <div className="max-w-3xl">
        <SectionHeader
          eyebrow={zhCN.writing.eyebrow}
          title={zhCN.writing.title}
          description={zhCN.writing.description}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </Section>
  );
}
