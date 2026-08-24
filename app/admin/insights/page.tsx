import { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminLeads } from "@/lib/admin-leads";
import { getAllResources } from "@/lib/resources";
import { formatDate } from "@/lib/utils";
import { getAllArticles } from "@/lib/writing";
import type { ArticleMeta } from "@/types/article";

export const metadata: Metadata = {
  title: "内容洞察 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

type ArticleInsight = {
  article: ArticleMeta;
  favoriteCount: number;
  resourceClaimCount: number;
  score: number;
  nextStep: string;
};

function getSlugFromHref(href: string) {
  const match = href.match(/^\/writing\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function countMap(items: string[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  return counts;
}

function getNextStep(insight: Omit<ArticleInsight, "nextStep">) {
  if (!insight.article.published) return "先完善并发布";
  if (insight.article.archived) return "复查是否恢复";
  if (insight.resourceClaimCount > 0) return "升级成资源包";
  if (insight.favoriteCount >= 3) return "扩写成深度版";
  if (insight.article.featured && insight.favoriteCount === 0) return "优化标题和入口";
  if (insight.article.access === "Deep Dive" && insight.favoriteCount === 0) {
    return "补充免费摘要";
  }
  return "继续观察";
}

function buildArticleInsights(
  articles: ArticleMeta[],
  favorites: Array<{ article_slug: string }>,
  resourceLeads: Array<{ resource_id: string }>,
  resourceSlugById: Map<string, string>
) {
  const favoriteCounts = countMap(favorites.map((favorite) => favorite.article_slug));
  const resourceClaimCounts = countMap(
    resourceLeads
      .map((lead) => resourceSlugById.get(lead.resource_id))
      .filter((slug): slug is string => Boolean(slug))
  );

  return articles
    .map((article) => {
      const favoriteCount = favoriteCounts.get(article.slug) ?? 0;
      const resourceClaimCount = resourceClaimCounts.get(article.slug) ?? 0;
      const baseScore = favoriteCount * 3 + resourceClaimCount * 5;
      const score =
        baseScore +
        (article.featured ? 1 : 0) +
        (article.published ? 1 : 0) -
        (article.archived ? 2 : 0);
      const insight = {
        article,
        favoriteCount,
        resourceClaimCount,
        score
      };

      return {
        ...insight,
        nextStep: getNextStep(insight)
      };
    })
    .sort((a, b) => b.score - a.score || b.favoriteCount - a.favoriteCount);
}

function topEntries(counts: Map<string, number>, limit = 6) {
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default async function AdminInsightsPage() {
  await requireAdmin();

  const [articles, leads] = await Promise.all([
    getAllArticles({ includeDrafts: true, includeArchived: true }),
    getAdminLeads()
  ]);
  const resources = await getAllResources({ includeArchived: true });
  const resourceSlugById = new Map(
    resources
      .map((resource) => [resource.id, getSlugFromHref(resource.href)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
  );
  const insights = buildArticleInsights(
    articles,
    leads.readerFavorites,
    leads.resourceLeads,
    resourceSlugById
  );
  const publishedCount = articles.filter((article) => article.published).length;
  const conversionReadyCount = insights.filter(
    (insight) => insight.favoriteCount > 0 || insight.resourceClaimCount > 0
  ).length;
  const sourceStats = topEntries(
    countMap(leads.subscribers.map((subscriber) => subscriber.source))
  );
  const categoryStats = topEntries(
    countMap(articles.map((article) => article.category)),
    4
  );
  const latestSignals = [
    ...leads.readerFavorites.map((favorite) => ({
      id: `favorite-${favorite.id}`,
      label: "收藏",
      title: favorite.article_title,
      href: `/writing/${favorite.article_slug}`,
      email: favorite.email,
      date: favorite.created_at
    })),
    ...leads.resourceLeads.map((lead) => ({
      id: `resource-${lead.id}`,
      label: "领取",
      title: lead.resource_title,
      href: null,
      email: lead.email,
      date: lead.created_at
    }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            返回后台
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            内容洞察
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            汇总文章库存、收藏、资源领取和订阅来源，帮助你判断下一批内容该扩写、资源化还是优化入口。
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
        >
          查看线索
        </Link>
      </div>

      {!leads.configured ? (
        <div className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 text-sm leading-7 text-[var(--secondary)] shadow-[var(--shadow-soft)]">
          当前还没有配置 Supabase，页面会先展示文章库存洞察。配置数据库后，收藏、领取和订阅信号会自动合并进来。
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["文章总数", articles.length],
          ["已发布", publishedCount],
          ["有互动", conversionReadyCount],
          ["总信号", leads.readerFavorites.length + leads.resourceLeads.length]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
          <div className="border-b border-[var(--border)] p-5">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              内容表现排行
            </h2>
            <p className="mt-2 text-sm text-[var(--secondary)]">
              分数由收藏、资源领取、精选和发布状态综合计算，用来粗略排序运营优先级。
            </p>
          </div>
          {insights.slice(0, 12).map((insight) => (
            <div
              key={insight.article.slug}
              className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1fr_160px_120px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  <span>{insight.article.category}</span>
                  <span>/</span>
                  <span>{insight.article.published ? "已发布" : "草稿"}</span>
                  <span>/</span>
                  <span>{insight.article.access === "Free" ? "免费" : "深度"}</span>
                </div>
                <Link
                  href={`/admin/articles/${insight.article.slug}`}
                  className="mt-2 block text-lg font-semibold text-[var(--foreground)] transition hover:text-[var(--accent-strong)]"
                >
                  {insight.article.title}
                </Link>
                <p className="mt-1 text-sm leading-6 text-[var(--secondary)]">
                  {insight.article.description}
                </p>
              </div>
              <div className="text-sm leading-7 text-[var(--muted)]">
                <p>收藏 {insight.favoriteCount}</p>
                <p>领取 {insight.resourceClaimCount}</p>
                <p>{formatDate(insight.article.date)}</p>
              </div>
              <div className="flex items-start lg:justify-end">
                <span className="rounded-full bg-[rgba(138,106,82,0.1)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {insight.nextStep}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid content-start gap-6">
          <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              分类库存
            </h2>
            <div className="mt-5 grid gap-3">
              {categoryStats.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.48)] p-4 text-sm"
                >
                  <span className="font-medium text-[var(--foreground)]">{entry.label}</span>
                  <span className="text-[var(--muted)]">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              订阅来源
            </h2>
            <div className="mt-5 grid gap-3">
              {sourceStats.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.48)] p-4 text-sm"
                >
                  <span className="font-medium text-[var(--foreground)]">{entry.label}</span>
                  <span className="text-[var(--muted)]">{entry.count}</span>
                </div>
              ))}
              {!sourceStats.length ? (
                <p className="text-sm text-[var(--secondary)]">暂时还没有订阅来源数据。</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          最新内容信号
        </h2>
        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
          {latestSignals.map((signal) => (
            <div
              key={signal.id}
              className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[100px_1fr_1fr_140px]"
            >
              <span className="text-sm font-semibold text-[var(--accent-strong)]">
                {signal.label}
              </span>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {signal.email}
              </span>
              {signal.href ? (
                <Link
                  href={signal.href}
                  className="text-sm text-[var(--secondary)] transition hover:text-[var(--accent-strong)]"
                >
                  {signal.title}
                </Link>
              ) : (
                <span className="text-sm text-[var(--secondary)]">{signal.title}</span>
              )}
              <span className="text-sm text-[var(--muted)]">{formatDate(signal.date)}</span>
            </div>
          ))}
          {!latestSignals.length ? (
            <div className="p-6 text-sm text-[var(--secondary)]">
              暂时还没有收藏或资源领取信号。
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
