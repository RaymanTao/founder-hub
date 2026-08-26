import { Metadata } from "next";
import Link from "next/link";
import { logoutAdmin, setArticleArchivedAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllResources } from "@/lib/resources";
import { listRssCandidates } from "@/lib/rss-items";
import { formatDate } from "@/lib/utils";
import { getAllArticles } from "@/lib/writing";
import type { ArticleAccess, ArticleCategory } from "@/types/article";

type Props = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    access?: string;
  }>;
};

const categories: Array<ArticleCategory | "All"> = [
  "All",
  "Build",
  "AI",
  "Growth",
  "Solopreneur"
];
const accessOptions: Array<ArticleAccess | "All"> = ["All", "Free", "Deep Dive"];
const statusOptions = ["All", "Published", "Draft", "Featured", "Archived"] as const;

export const metadata: Metadata = {
  title: "后台 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function buildAdminHref(params: {
  q?: string;
  status?: string;
  category?: string;
  access?: string;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params.access && params.access !== "All") query.set("access", params.access);
  const qs = query.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function AdminPage({ searchParams }: Props) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "All";
  const category = params.category ?? "All";
  const access = params.access ?? "All";
  const [articles, resources, rssCandidates] = await Promise.all([
    getAllArticles({ includeDrafts: true, includeArchived: true }),
    getAllResources({ includeArchived: true }),
    listRssCandidates({ status: "pending", limit: 1 })
  ]);
  const featuredCount = articles.filter((article) => article.featured).length;
  const deepCount = articles.filter((article) => article.access === "Deep Dive").length;
  const draftCount = articles.filter((article) => !article.published).length;
  const archivedCount = articles.filter((article) => article.archived).length;
  const filteredArticles = articles.filter((article) => {
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
    const qMatch = !q || haystack.includes(q.toLowerCase());
    const statusMatch =
      status === "All" ||
      (status === "Published" && article.published) ||
      (status === "Draft" && !article.published) ||
      (status === "Featured" && article.featured) ||
      (status === "Archived" && article.archived);
    const categoryMatch = category === "All" || article.category === category;
    const accessMatch = access === "All" || article.access === access;
    return qMatch && statusMatch && categoryMatch && accessMatch;
  });

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            内容后台
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            支持从第三方 URL 采集为草稿，也可以手动新建，并在后台完成正文编辑、预览和发布。
          </p>
        </div>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            退出登录
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {[
          ["文章", articles.length, "/admin"],
          ["精选", featuredCount, "/admin?status=Featured"],
          ["深度", deepCount, "/admin?access=Deep+Dive"],
          ["草稿", draftCount, "/admin?status=Draft"],
          ["归档", archivedCount, "/admin?status=Archived"],
          ["资源", resources.length, "/admin/resources"],
          ["媒体", "R2", "/admin/media"],
          ["RSS", rssCandidates ? "候选池" : "配置", "/admin/rss"]
        ].map(([label, value, href]) => (
          <Link
            key={label}
            href={String(href)}
            className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            文章管理
          </h2>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/insights"
              className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              内容洞察
            </Link>
            <Link
              href="/admin/media"
              className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              媒体库
            </Link>
            <Link
              href="/admin/leads"
              className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              查看线索
            </Link>
            <Link
              href="/admin/new"
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
            >
              新建 / 采集
            </Link>
            <Link
              href="/writing"
              className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              查看前台
            </Link>
          </div>
        </div>

        <form
          action="/admin"
          className="mt-5 grid gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-4 lg:grid-cols-[1fr_160px_160px_160px_auto]"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索标题、摘要、标签、来源..."
            className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
          <select
            name="status"
            defaultValue={status}
            className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item === "All"
                  ? "全部状态"
                  : item === "Published"
                    ? "已发布"
                    : item === "Draft"
                      ? "草稿"
                      : item === "Featured"
                        ? "精选"
                        : "归档"}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category}
            className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "全部分类" : item}
              </option>
            ))}
          </select>
          <select
            name="access"
            defaultValue={access}
            className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            {accessOptions.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "全部层级" : item === "Free" ? "免费" : "深度"}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            筛选
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <span>当前显示 {filteredArticles.length} 篇</span>
          {(q || status !== "All" || category !== "All" || access !== "All") ? (
            <Link
              href="/admin"
              className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              清空筛选
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((item) => (
            <Link
              key={item}
              href={buildAdminHref({ q, status: item, category, access })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                status === item
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                  : "border-[var(--border)] bg-[rgba(255,255,255,0.55)] text-[var(--secondary)]"
              }`}
            >
              {item === "All"
                ? "全部"
                : item === "Published"
                  ? "已发布"
                    : item === "Draft"
                      ? "草稿"
                      : item === "Featured"
                        ? "精选"
                        : "归档"}
            </Link>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
          {filteredArticles.map((article) => (
            <div
              key={article.slug}
              className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1fr_180px_100px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  <span>№ {String(article.number).padStart(3, "0")}</span>
                  <span>/</span>
                  <span>{article.category}</span>
                  <span>/</span>
                  <span>{article.access === "Free" ? "免费" : "深度"}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 tracking-normal ${
                      article.published
                        ? "bg-[rgba(74,106,84,0.1)] text-[var(--success)]"
                        : "bg-[rgba(154,106,51,0.12)] text-[var(--warning)]"
                    }`}
                  >
                    {article.published ? "已发布" : "草稿"}
                  </span>
                  {article.featured ? (
                    <span className="rounded-full bg-[rgba(138,106,82,0.1)] px-2 py-0.5 tracking-normal text-[var(--accent-strong)]">
                      精选
                    </span>
                  ) : null}
                  {article.archived ? (
                    <span className="rounded-full bg-[rgba(139,126,114,0.12)] px-2 py-0.5 tracking-normal text-[var(--muted)]">
                      归档
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                  {article.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--secondary)]">
                  {article.description}
                </p>
              </div>
              <div className="text-sm leading-7 text-[var(--muted)]">
                <p>{formatDate(article.date)}</p>
                <p>{article.readingTime}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <Link
                  href={`/admin/articles/${article.slug}/preview`}
                  className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                >
                  预览
                </Link>
                <Link
                  href={`/admin/articles/${article.slug}`}
                  className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
                >
                  编辑
                </Link>
                <form action={setArticleArchivedAction}>
                  <input type="hidden" name="slug" value={article.slug} />
                  <input
                    type="hidden"
                    name="archived"
                    value={article.archived ? "false" : "true"}
                  />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={buildAdminHref({ q, status, category, access })}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                  >
                    {article.archived ? "恢复" : "归档"}
                  </button>
                </form>
              </div>
            </div>
          ))}
          {!filteredArticles.length ? (
            <div className="p-6 text-sm text-[var(--secondary)]">
              没有找到符合条件的文章。
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
