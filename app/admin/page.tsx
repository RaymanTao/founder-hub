import { Metadata } from "next";
import Link from "next/link";
import { setArticleArchivedAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/utils";
import { getAllArticles } from "@/lib/writing";
import type { ArticleAccess, ArticleCategory } from "@/types/article";

type Props = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    access?: string;
    page?: string;
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
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params.access && params.access !== "All") query.set("access", params.access);
  if (params.page && params.page > 1) query.set("page", String(params.page));
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
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const articles = await getAllArticles({ includeDrafts: true, includeArchived: true });
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
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            文章管理
          </h2>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/new"
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
            >
              新建文章
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
          <span>
            当前显示 {filteredArticles.length ? (currentPage - 1) * pageSize + 1 : 0}-
            {Math.min(currentPage * pageSize, filteredArticles.length)} / 共 {filteredArticles.length} 篇
          </span>
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
              href={buildAdminHref({ q, status: item, category, access, page: 1 })}
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
          {paginatedArticles.map((article) => (
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
                    value={buildAdminHref({ q, status, category, access, page: currentPage })}
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

        {pageCount > 1 ? (
          <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="文章分页">
            <Link
              href={buildAdminHref({ q, status, category, access, page: currentPage - 1 })}
              aria-disabled={currentPage === 1}
              className={`rounded-full border px-3 py-2 text-sm ${currentPage === 1 ? "pointer-events-none opacity-40" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"}`}
            >
              上一页
            </Link>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <Link
                key={page}
                href={buildAdminHref({ q, status, category, access, page })}
                className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${currentPage === page ? "border-[var(--foreground)] bg-[var(--foreground)] text-white" : "border-[var(--border)] bg-[var(--surface)] text-[var(--secondary)]"}`}
              >
                {page}
              </Link>
            ))}
            <Link
              href={buildAdminHref({ q, status, category, access, page: currentPage + 1 })}
              aria-disabled={currentPage === pageCount}
              className={`rounded-full border px-3 py-2 text-sm ${currentPage === pageCount ? "pointer-events-none opacity-40" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"}`}
            >
              下一页
            </Link>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
