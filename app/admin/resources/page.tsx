import { Metadata } from "next";
import Link from "next/link";
import { setResourceArchivedAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminResources } from "@/lib/admin-resources";

type Props = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    error?: string;
  }>;
};

const categories = ["All", "Toolkit", "Template", "Workflow", "Checklist"] as const;
const statuses = ["All", "Free", "Coming Soon", "Featured", "Archived"] as const;

export const metadata: Metadata = {
  title: "资源管理 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function buildHref(params: { q?: string; status?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.category && params.category !== "All") query.set("category", params.category);
  const qs = query.toString();
  return qs ? `/admin/resources?${qs}` : "/admin/resources";
}

export default async function AdminResourcesPage({ searchParams }: Props) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "All";
  const category = params.category ?? "All";
  const resources = await getAdminResources();
  const filtered = resources.filter((resource) => {
    const haystack = [
      resource.title,
      resource.description,
      resource.id,
      resource.category,
      resource.status,
      resource.format,
      resource.audience,
      resource.href,
      ...resource.tags
    ]
      .join(" ")
      .toLowerCase();
    const qMatch = !q || haystack.includes(q.toLowerCase());
    const statusMatch =
      status === "All" ||
      resource.status === status ||
      (status === "Featured" && resource.featured) ||
      (status === "Archived" && resource.archived);
    const categoryMatch = category === "All" || resource.category === category;
    return qMatch && statusMatch && categoryMatch;
  });

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      {params.error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          操作失败：{params.error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Link
          href="/admin/resources/new"
          className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
        >
          新建资源
        </Link>
      </div>

      <form
        action="/admin/resources"
        className="mt-5 grid gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-4 lg:grid-cols-[1fr_180px_180px_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索资源标题、标签、链接..."
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        />
        <select
          name="status"
          defaultValue={status}
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "All"
                ? "全部状态"
                : item === "Featured"
                  ? "精选"
                  : item === "Archived"
                    ? "归档"
                    : item}
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
        <button
          type="submit"
          className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
        >
          筛选
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <span>当前显示 {filtered.length} 个资源</span>
        {(q || status !== "All" || category !== "All") ? (
          <Link
            href="/admin/resources"
            className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            清空筛选
          </Link>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
        {filtered.map((resource) => (
          <div
            key={resource.id}
            className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1fr_170px_90px]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>{resource.category}</span>
                <span>/</span>
                <span>{resource.status}</span>
                {resource.featured ? (
                  <span className="rounded-full bg-[rgba(138,106,82,0.1)] px-2 py-0.5 tracking-normal text-[var(--accent-strong)]">
                    精选
                  </span>
                ) : null}
                {resource.archived ? (
                  <span className="rounded-full bg-[rgba(139,126,114,0.12)] px-2 py-0.5 tracking-normal text-[var(--muted)]">
                    归档
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {resource.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--secondary)]">
                {resource.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-2.5 py-1 text-[11px] text-[var(--secondary)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-sm leading-7 text-[var(--muted)]">
              <p>{resource.format}</p>
              <p>{resource.href}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Link
                href={`/admin/resources/${resource.id}`}
                className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
              >
                编辑
              </Link>
              <form action={setResourceArchivedAction}>
                <input type="hidden" name="id" value={resource.id} />
                <input
                  type="hidden"
                  name="archived"
                  value={resource.archived ? "false" : "true"}
                />
                <input
                  type="hidden"
                  name="returnTo"
                  value={buildHref({ q, status, category })}
                />
                <button
                  type="submit"
                  className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                >
                  {resource.archived ? "恢复" : "归档"}
                </button>
              </form>
            </div>
          </div>
        ))}
        {!filtered.length ? (
          <div className="p-6 text-sm text-[var(--secondary)]">
            没有找到符合条件的资源。
          </div>
        ) : null}
      </div>
    </main>
  );
}
