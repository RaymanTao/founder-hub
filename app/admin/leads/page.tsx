import { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminLeads } from "@/lib/admin-leads";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "线索 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function countByResource(leads: Array<{ resource_title: string }>) {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    counts.set(lead.resource_title, (counts.get(lead.resource_title) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function countByArticle(favorites: Array<{ article_slug: string; article_title: string }>) {
  const counts = new Map<string, { title: string; slug: string; count: number }>();

  for (const favorite of favorites) {
    const current = counts.get(favorite.article_slug);
    counts.set(favorite.article_slug, {
      title: favorite.article_title,
      slug: favorite.article_slug,
      count: (current?.count ?? 0) + 1
    });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export default async function AdminLeadsPage() {
  await requireAdmin();

  const leads = await getAdminLeads();
  const activeSubscribers = leads.subscribers.filter(
    (subscriber) => subscriber.status === "active"
  );
  const topResources = countByResource(leads.resourceLeads);
  const topFavorites = countByArticle(leads.readerFavorites);

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      {!leads.configured ? (
        <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            尚未配置 Supabase
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY，并执行 supabase/schema.sql 后，这里会显示真实线索。
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["订阅用户", leads.subscribers.length],
              ["活跃订阅", activeSubscribers.length],
              ["资源领取", leads.resourceLeads.length],
              ["文章收藏", leads.readerFavorites.length]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                热门资源
              </h2>
              <div className="mt-5 grid gap-3">
                {topResources.map((resource) => (
                  <div
                    key={resource.title}
                    className="flex items-center justify-between gap-4 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.48)] p-4"
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {resource.title}
                    </span>
                    <span className="text-sm text-[var(--muted)]">{resource.count}</span>
                  </div>
                ))}
                {!topResources.length ? (
                  <p className="text-sm text-[var(--secondary)]">暂时还没有资源领取记录。</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                收藏最多
              </h2>
              <div className="mt-5 grid gap-3">
                {topFavorites.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/writing/${article.slug}`}
                    className="flex items-center justify-between gap-4 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.48)] p-4 transition hover:border-[var(--accent)]"
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {article.title}
                    </span>
                    <span className="text-sm text-[var(--muted)]">{article.count}</span>
                  </Link>
                ))}
                {!topFavorites.length ? (
                  <p className="text-sm text-[var(--secondary)]">暂时还没有文章收藏记录。</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                最新订阅
              </h2>
              <div className="mt-5 grid gap-3">
                {leads.subscribers.slice(0, 8).map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.48)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {subscriber.email}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {formatDate(subscriber.subscribed_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {subscriber.source} / {subscriber.status}
                    </p>
                  </div>
                ))}
                {!leads.subscribers.length ? (
                  <p className="text-sm text-[var(--secondary)]">暂时还没有订阅记录。</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              最新文章收藏
            </h2>
            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
              {leads.readerFavorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1fr_1fr_140px]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {favorite.email}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {favorite.article_slug}
                    </p>
                  </div>
                  <Link
                    href={`/writing/${favorite.article_slug}`}
                    className="text-sm text-[var(--secondary)] transition hover:text-[var(--accent-strong)]"
                  >
                    {favorite.article_title}
                  </Link>
                  <div className="text-sm text-[var(--muted)]">
                    {formatDate(favorite.created_at)}
                  </div>
                </div>
              ))}
              {!leads.readerFavorites.length ? (
                <div className="p-6 text-sm text-[var(--secondary)]">
                  暂时还没有文章收藏记录。
                </div>
              ) : null}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              最新资源领取
            </h2>
            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
              {leads.resourceLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1fr_1fr_140px]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {lead.email}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{lead.source}</p>
                  </div>
                  <div className="text-sm text-[var(--secondary)]">
                    {lead.resource_title}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {formatDate(lead.created_at)}
                  </div>
                </div>
              ))}
              {!leads.resourceLeads.length ? (
                <div className="p-6 text-sm text-[var(--secondary)]">
                  暂时还没有资源领取记录。
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
