import Link from "next/link";
import { ArticleCard } from "@/components/cards/article-card";
import { Section } from "@/components/ui/section";
import { createMetadata } from "@/lib/seo";
import { getAllArticles } from "@/lib/writing";
import type { ArticleAccess, ArticleCategory } from "@/types/article";

type Props = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    access?: string;
    tag?: string;
  }>;
};

const categories: Array<{ label: string; value: ArticleCategory | "All" }> = [
  { label: "全部", value: "All" },
  { label: "Build", value: "Build" },
  { label: "AI", value: "AI" },
  { label: "Growth", value: "Growth" },
  { label: "Solopreneur", value: "Solopreneur" }
];

const accessTabs: Array<{ label: string; value: ArticleAccess | "All" }> = [
  { label: "全部", value: "All" },
  { label: "只看免费", value: "Free" },
  { label: "深度文章", value: "Deep Dive" }
];

export const metadata = createMetadata({
  title: "文章",
  description: "Founder Hub 内容库，按分类、标签和深度浏览 AI 创业与一人公司文章。",
  path: "/writing"
});

function buildHref(params: {
  q?: string;
  category?: string;
  access?: string;
  tag?: string;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category && params.category !== "All") query.set("category", params.category);
  if (params.access && params.access !== "All") query.set("access", params.access);
  if (params.tag) query.set("tag", params.tag);
  const qs = query.toString();
  return qs ? `/writing?${qs}` : "/writing";
}

export default async function WritingPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const articles = await getAllArticles();
  const q = params.q?.trim() ?? "";
  const selectedCategory = params.category ?? "All";
  const selectedAccess = params.access ?? "All";
  const selectedTag = params.tag;
  const tags = Array.from(new Set(articles.flatMap((article) => article.tags))).slice(0, 12);

  const filtered = articles.filter((article) => {
    const haystack = [
      article.title,
      article.description,
      article.slug,
      article.source,
      article.category,
      article.type,
      article.access,
      ...article.tags
    ]
      .join(" ")
      .toLowerCase();
    const queryMatch = !q || haystack.includes(q.toLowerCase());
    const categoryMatch =
      selectedCategory === "All" || article.category === selectedCategory;
    const accessMatch = selectedAccess === "All" || article.access === selectedAccess;
    const tagMatch = !selectedTag || article.tags.includes(selectedTag);
    return queryMatch && categoryMatch && accessMatch && tagMatch;
  });
  const hasActiveFilters =
    Boolean(q) || selectedCategory !== "All" || selectedAccess !== "All" || Boolean(selectedTag);

  return (
    <Section>
      <div className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Library
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
          AI 创业与一人公司的内容库
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--secondary)]">
          按主题、标签和深度浏览文章。这里会持续沉淀产品实验、Agent 自动化、增长系统和个人商业化复盘。
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          共 {articles.length} 篇，当前显示 {filtered.length} 篇。
        </p>
      </div>

      <div className="mt-10 space-y-5 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-5">
        <form action="/writing" className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索标题、摘要、标签、来源..."
            className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
          {selectedCategory !== "All" ? (
            <input type="hidden" name="category" value={selectedCategory} />
          ) : null}
          {selectedAccess !== "All" ? (
            <input type="hidden" name="access" value={selectedAccess} />
          ) : null}
          {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            搜索
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <span>当前显示 {filtered.length} 篇</span>
          {hasActiveFilters ? (
            <Link
              href="/writing"
              className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              清空搜索和筛选
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={buildHref({
                q,
                category: category.value,
                access: selectedAccess,
                tag: selectedTag
              })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedCategory === category.value
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-[rgba(255,255,255,0.5)] text-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {accessTabs.map((access) => (
            <Link
              key={access.value}
              href={buildHref({
                q,
                category: selectedCategory,
                access: access.value,
                tag: selectedTag
              })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedAccess === access.value
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                  : "border-[var(--border)] bg-[rgba(255,255,255,0.5)] text-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              {access.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            热门标签
          </span>
          {tags.map((tag) => (
            <Link
              key={tag}
              href={buildHref({
                q,
                category: selectedCategory,
                access: selectedAccess,
                tag: selectedTag === tag ? undefined : tag
              })}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                selectedTag === tag
                  ? "border-[var(--accent)] bg-[rgba(138,106,82,0.12)] text-[var(--accent-strong)]"
                  : "border-[var(--border)] bg-[rgba(255,255,255,0.5)] text-[var(--secondary)]"
              }`}
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {!filtered.length ? (
        <div className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-6 text-sm text-[var(--secondary)]">
          没有找到符合条件的文章，可以清空搜索和筛选后再试。
        </div>
      ) : null}
    </Section>
  );
}
