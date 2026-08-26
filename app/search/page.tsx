import Link from "next/link";
import { ArticleCard } from "@/components/cards/article-card";
import { createMetadata } from "@/lib/seo";
import { searchArticles } from "@/lib/search";

export const metadata = createMetadata({
  title: "全站搜索",
  description: "搜索 Founder Hub 的创业、一人公司、融资、案例和 AI 产品内容。",
  path: "/search"
});

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const query = ((await searchParams)?.q ?? "").trim().slice(0, 100);
  const results = query ? await searchArticles(query) : [];

  return (
    <main className="min-h-[70vh] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Search</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">搜索全站内容</h1>
        <form action="/search" className="mt-8 flex max-w-2xl gap-3">
          <input name="q" defaultValue={query} autoFocus placeholder="搜索文章、标签、来源或正文..." className="min-h-12 min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-5 text-sm outline-none transition focus:border-[var(--accent)]" />
          <button type="submit" className="min-h-12 rounded-full bg-[var(--foreground)] px-6 text-sm font-medium text-white transition hover:bg-[var(--accent)]">搜索</button>
        </form>

        {query ? <p className="mt-6 text-sm text-[var(--muted)]">“{query}”找到 {results.length} 篇内容</p> : <p className="mt-6 text-sm text-[var(--secondary)]">输入关键词，搜索文章标题、摘要、正文、标签和来源。</p>}

        {results.length ? <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{results.map((article) => <ArticleCard key={article.slug} article={article} />)}</div> : null}
        {query && !results.length ? <div className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-6 text-sm text-[var(--secondary)]">没有找到匹配内容，换个关键词再试试。</div> : null}
        <Link href="/" className="mt-10 inline-block text-sm font-medium text-[var(--accent)]">返回首页 →</Link>
      </div>
    </main>
  );
}
