import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminLeads } from "@/lib/admin-leads";
import { getRssFeeds } from "@/lib/rss-feeds";
import { listRssRuns } from "@/lib/rss-runs";
import { getAllResources } from "@/lib/resources";
import { formatDate } from "@/lib/utils";
import { getAllArticles } from "@/lib/writing";
import type { ArticleCategory } from "@/types/article";

export const metadata: Metadata = { title: "仪表盘 | Founder Hub", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const categories: ArticleCategory[] = ["Build", "AI", "Growth", "Solopreneur"];

function monthKey(date: string) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  return `${Number(key.slice(5))}月`;
}

function dayKey(date: string) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function dayLabel(key: string) {
  return `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`;
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [articles, resources, leads, feeds, runs] = await Promise.all([
    getAllArticles({ includeDrafts: true, includeArchived: true }),
    getAllResources({ includeArchived: true }),
    getAdminLeads(),
    getRssFeeds(),
    listRssRuns(5)
  ]);

  const published = articles.filter((article) => article.published && !article.archived);
  const drafts = articles.filter((article) => !article.published && !article.archived);
  const activeFeeds = feeds.filter((feed) => feed.enabled);
  const categoryCounts = categories.map((category) => ({
    category,
    count: published.filter((article) => article.category === category).length
  }));
  const maxCategory = Math.max(...categoryCounts.map((item) => item.count), 1);
  const now = new Date();
  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthly = monthKeys.map((key) => ({
    key,
    count: published.filter((article) => monthKey(article.date) === key).length
  }));
  const maxMonthly = Math.max(...monthly.map((item) => item.count), 1);
  const recentArticles = [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const latestRun = runs?.[0];
  const memberFeatureStatus = "未启用";
  const leadEvents = [
    ...leads.subscribers.map((item) => ({ date: item.subscribed_at, source: item.source || "Newsletter" })),
    ...leads.resourceLeads.map((item) => ({ date: item.created_at, source: item.source || "资源领取" }))
  ];
  const leadDayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
    return dayKey(date.toISOString());
  });
  const leadTrend = leadDayKeys.map((key) => ({ key, count: leadEvents.filter((item) => dayKey(item.date) === key).length }));
  const maxLeadTrend = Math.max(...leadTrend.map((item) => item.count), 1);
  const leadSourceCounts = Array.from(
    leadEvents.reduce((counts, item) => counts.set(item.source, (counts.get(item.source) ?? 0) + 1), new Map<string, number>())
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxLeadSource = Math.max(...leadSourceCounts.map((item) => item.count), 1);
  const totalLeads = leads.subscribers.length + leads.resourceLeads.length;

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">仪表盘</h1>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["已发布文章", published.length, "当前公开内容"],
          ["文章草稿", drafts.length, "待继续编辑"],
          ["订阅用户", leads.subscribers.length, leads.configured ? "Newsletter 订阅" : "需要配置 Supabase"],
          ["会员用户", memberFeatureStatus, "会员体系暂未启用"],
          ["会员收入", memberFeatureStatus, "支付能力暂未启用"]
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{note}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">线索增长趋势</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">近 7 天 Newsletter 订阅与资源领取</p>
            </div>
            <span className="text-sm text-[var(--accent)]">累计 {totalLeads} 条</span>
          </div>
          {leadEvents.length ? (
            <div className="mt-6">
              <svg viewBox="0 0 700 220" className="h-56 w-full overflow-visible" role="img" aria-label="近七天线索增长趋势图">
                <line x1="24" y1="178" x2="676" y2="178" stroke="var(--border)" />
                <line x1="24" y1="112" x2="676" y2="112" stroke="var(--border)" strokeDasharray="4 6" />
                <line x1="24" y1="46" x2="676" y2="46" stroke="var(--border)" strokeDasharray="4 6" />
                <polyline
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={leadTrend.map((item, index) => `${24 + index * 108},${178 - (item.count / maxLeadTrend) * 132}`).join(" ")}
                />
                {leadTrend.map((item, index) => {
                  const x = 24 + index * 108;
                  const y = 178 - (item.count / maxLeadTrend) * 132;
                  return <g key={item.key}><circle cx={x} cy={y} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" /><text x={x} y="207" textAnchor="middle" fill="var(--muted)" fontSize="12">{dayLabel(item.key)}</text><text x={x} y={Math.max(y - 12, 18)} textAnchor="middle" fill="var(--foreground)" fontSize="12">{item.count}</text></g>;
                })}
              </svg>
            </div>
          ) : (
            <div className="mt-6 flex h-56 items-center justify-center rounded-[0.85rem] border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">暂无线索数据</div>
          )}
        </div>

        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">线索来源</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">按来源统计累计新增</p>
          {leadSourceCounts.length ? (
            <div className="mt-7 grid gap-5">
              {leadSourceCounts.map((item) => (
                <div key={item.source}>
                  <div className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-[var(--secondary)]">{item.source}</span><strong className="text-[var(--foreground)]">{item.count}</strong></div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--surface-alt)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(item.count / maxLeadSource) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <div className="mt-7 rounded-[0.85rem] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">暂无来源数据</div>}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-xl font-semibold text-[var(--foreground)]">内容发布趋势</h2><p className="mt-1 text-sm text-[var(--muted)]">近 6 个月已发布文章数量</p></div>
            <span className="text-sm text-[var(--accent)]">共 {published.length} 篇</span>
          </div>
          <div className="mt-8 flex h-56 items-end gap-3 border-b border-[var(--border)] px-2">
            {monthly.map((item) => (
              <div key={item.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs text-[var(--muted)]">{item.count}</span>
                <div className="w-full max-w-12 rounded-t-md bg-[var(--accent)] transition-all" style={{ height: `${Math.max((item.count / maxMonthly) * 78, item.count ? 10 : 3)}%` }} />
                <span className="text-xs text-[var(--muted)]">{monthLabel(item.key)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">内容分类占比</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">已发布内容的结构分布</p>
          <div className="mt-6 flex items-center gap-6">
            <div className="dashboard-donut" style={{ background: `conic-gradient(var(--accent) 0deg 90deg, var(--success) 90deg 180deg, #8aa1bd 180deg 270deg, #c6a26c 270deg 360deg)` }}><div /></div>
            <div className="grid flex-1 gap-3 text-sm">
              {categoryCounts.map((item, index) => <div key={item.category} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[var(--secondary)]"><i className={`dashboard-dot dot-${index}`} />{item.category}</span><strong className="text-[var(--foreground)]">{item.count}</strong></div>)}
            </div>
          </div>
          <div className="mt-6 grid gap-3">{categoryCounts.map((item) => <div key={item.category} className="flex items-center gap-3 text-xs"><span className="w-20 text-[var(--muted)]">{item.category}</span><div className="h-2 flex-1 rounded-full bg-[var(--surface-alt)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(item.count / maxCategory) * 100}%` }} /></div></div>)}</div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">读者与资产</h2>
          <div className="mt-5 grid gap-4">{[["活跃订阅", leads.subscribers.filter((item) => item.status === "active").length], ["文章收藏", leads.readerFavorites.length], ["资源领取", leads.resourceLeads.length], ["资源总数", resources.length]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-sm last:border-0"><span className="text-[var(--secondary)]">{label}</span><strong className="text-[var(--foreground)]">{value}</strong></div>)}</div>
        </div>
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">RSS 运行状态</h2>
          <div className="mt-5 grid gap-4">{[["来源总数", feeds.length], ["已启用来源", activeFeeds.length], ["最近抓取", latestRun ? (latestRun.status === "success" ? "成功" : "异常") : "暂无记录"], ["最近新增", latestRun?.itemCount ?? 0]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-sm last:border-0"><span className="text-[var(--secondary)]">{label}</span><strong className="text-[var(--foreground)]">{value}</strong></div>)}</div>
        </div>
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">最近发布</h2>
          <div className="mt-4 grid gap-3">{recentArticles.map((article) => <div key={article.slug} className="border-b border-[var(--border)] pb-3 last:border-0"><p className="line-clamp-1 text-sm font-medium text-[var(--foreground)]">{article.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(article.date)} · {article.published ? "已发布" : "草稿"}</p></div>)}</div>
        </div>
      </section>
    </main>
  );
}
