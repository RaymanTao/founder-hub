import { Metadata } from "next";
import Link from "next/link";
import {
  deleteRssCandidatesAction,
  runRssImportAction
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { listRssCandidates } from "@/lib/rss-items";
import type { ArticleCategory } from "@/types/article";
import type { RssItemStatus } from "@/types/rss";
import { RssBatchDelete } from "./rss-batch-delete";
import { RssRunFeedback } from "./rss-run-feedback";

type Props = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    error?: string;
    run?: string;
    items?: string;
    reason?: string;
    deleted?: string;
  }>;
};

const statuses: Array<Exclude<RssItemStatus, "rejected"> | "All"> = [
  "All",
  "pending",
  "selected",
  "imported"
];
const categories: Array<ArticleCategory | "All"> = [
  "All",
  "Build",
  "AI",
  "Growth",
  "Solopreneur"
];

export const metadata: Metadata = {
  title: "RSS 候选池 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function statusLabel(status: RssItemStatus | "All") {
  const labels = {
    All: "全部状态",
    pending: "待筛选",
    selected: "已入选",
    rejected: "已拒绝",
    imported: "已生成文章"
  };
  return labels[status];
}

function buildRssHref(params: {
  q?: string;
  status?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.category && params.category !== "All") {
    query.set("category", params.category);
  }
  const qs = query.toString();
  return qs ? `/admin/rss?${qs}` : "/admin/rss";
}

export default async function AdminRssPage({ searchParams }: Props) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const error = params.error ?? "";
  const status = statuses.includes(params.status as Exclude<RssItemStatus, "rejected">)
    ? (params.status as Exclude<RssItemStatus, "rejected">)
    : "All";
  const category = categories.includes(params.category as ArticleCategory)
    ? (params.category as ArticleCategory)
    : "All";

  const candidates = await listRssCandidates({
    q,
    status,
    excludeStatus: "rejected",
    category,
    limit: 120
  });
  const returnTo = buildRssHref({ q, status, category });
  const errorCopy: Record<string, string> = {
    "invalid-rss-status": "候选状态无效。",
    "invalid-rss-item": "RSS 候选 ID 无效。",
    "rss-item-not-found": "没有找到这条 RSS 候选。",
    "rss-import-failed": "RSS 文章发布失败，请稍后重试。",
    "rss-ai-failed": "AI 初筛失败，请检查 DeepSeek 配置或稍后重试。",
    "delete-empty": "请先选择要删除的候选文章。",
    "delete-failed": "批量删除失败，请检查 Supabase 连接和权限。"
  };

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex justify-end gap-3">
        <form action={runRssImportAction}>
          <button type="submit" className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]">
            立即抓取
          </button>
        </form>
        <Link href="/admin/rss/sources" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]">
          RSS源
        </Link>
      </div>

      <form
        action="/admin/rss"
        className="mt-8 grid gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-4 lg:grid-cols-[1fr_160px_160px_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索标题、摘要、来源..."
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        />
        <select
          name="status"
          defaultValue={status}
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {statusLabel(item)}
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

      {error && error !== "delete-failed" ? (
        <div className="mt-5 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          {errorCopy[error] ?? "操作失败，请重试。"}
        </div>
      ) : null}
      <RssRunFeedback
        status={params.run ?? (params.deleted ? "success" : error === "delete-failed" ? "failed" : undefined)}
        items={params.items}
        reason={params.reason}
        title={params.deleted || error === "delete-failed" ? (params.deleted ? "删除完成" : "删除失败") : undefined}
        message={params.deleted ? `已删除 ${params.deleted} 条候选文章。` : error === "delete-failed" ? "批量删除失败，请检查 Supabase 连接和权限。" : undefined}
      />

      {candidates ? (
        <>
        <RssBatchDelete action={deleteRssCandidatesAction} returnTo={returnTo} />
        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
          {candidates.map((item) => (
            <article
              key={item.id}
              className="relative grid gap-4 border-b border-[var(--border)] p-5 pl-20 last:border-b-0 lg:grid-cols-[1fr_180px]"
            >
              {item.articleSlug ? (
                <Link
                  href={`/writing/${item.articleSlug}`}
                  aria-label={`查看文章：${item.title}`}
                  className="absolute inset-0 z-0 rounded-[inherit]"
                />
              ) : null}
              <label className="absolute left-5 top-5 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"><input type="checkbox" value={item.id} data-rss-candidate-checkbox="true" aria-label={`选择候选：${item.title}`} /></label>
              <div className="pointer-events-none relative z-[1]">
                <h2 className="mt-2 text-lg font-semibold leading-7 text-[var(--foreground)]">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--secondary)]">
                  {item.description || item.content || "暂无摘要。"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.suggestedTags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.58)] px-2.5 py-1 text-xs text-[var(--secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm leading-7 text-[var(--muted)]">
                  <span>综合评分：{item.score ?? "待评分"}</span>
                  <span>价值评分：{item.founderValueScore ?? "-"}</span>
                </div>
              </div>

              <div className="pointer-events-none relative z-[1] overflow-hidden rounded-[0.9rem] border border-[var(--border)] bg-[rgba(255,255,255,0.5)] aspect-[16/10]">
                {item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={`${item.title}封面`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(138,106,82,0.14),rgba(255,255,255,0.45))]" aria-label="暂无封面" />
                )}
              </div>

            </article>
          ))}
          {!candidates.length ? (
            <div className="p-6 text-sm text-[var(--secondary)]">
              没有找到符合条件的 RSS 候选。
            </div>
          ) : null}
        </div>
        </>
      ) : null}
    </main>
  );
}
