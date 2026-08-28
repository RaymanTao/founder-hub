import { Metadata } from "next";
import Link from "next/link";
import {
  analyzeRssCandidateAction,
  createArticleFromRssCandidateAction,
  importArticleFromUrl,
  setRssCandidateStatusAction,
  runRssImportAction
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { listRssCandidates } from "@/lib/rss-items";
import { formatDate } from "@/lib/utils";
import type { ArticleCategory } from "@/types/article";
import type { RssItemStatus } from "@/types/rss";
import { listRssRuns } from "@/lib/rss-runs";

type Props = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    error?: string;
    run?: string;
    items?: string;
  }>;
};

const statuses: Array<RssItemStatus | "All"> = [
  "All",
  "pending",
  "selected",
  "rejected",
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
  const status = statuses.includes(params.status as RssItemStatus)
    ? (params.status as RssItemStatus)
    : "All";
  const category = categories.includes(params.category as ArticleCategory)
    ? (params.category as ArticleCategory)
    : "All";

  const candidates = await listRssCandidates({
    q,
    status,
    category,
    limit: 120
  });
  const runs = await listRssRuns(5);
  const returnTo = buildRssHref({ q, status, category });
  const errorCopy: Record<string, string> = {
    "invalid-rss-status": "候选状态无效。",
    "invalid-rss-item": "RSS 候选 ID 无效。",
    "rss-item-not-found": "没有找到这条 RSS 候选。",
    "rss-import-failed": "生成文章草稿失败，请稍后重试。",
    "rss-ai-failed": "AI 初筛失败，请检查 DeepSeek 配置或稍后重试。",
    "invalid-url": "请输入有效的 http 或 https 链接。",
    "import-failed": "采集失败，目标网站可能阻止访问或没有可读取的页面信息。"
  };

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] px-4 py-3 text-sm">
        <span className="text-[var(--secondary)]">RSS 来源由后台维护，Cron 会优先读取 Supabase 配置。</span>
        <Link href="/admin/rss/sources" className="font-medium text-[var(--accent)]">管理来源 →</Link>
      </div>

      <form action={importArticleFromUrl} className="mt-5 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-4">
        <input type="hidden" name="returnTo" value="/admin/rss" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input name="url" type="url" required placeholder="手动采集文章 URL" className="min-h-11 min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          <button type="submit" className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]">采集为草稿</button>
        </div>
      </form>

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

      {error ? (
        <div className="mt-5 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          {errorCopy[error] ?? "操作失败，请重试。"}
        </div>
      ) : null}
      {params.run ? <div className={`mt-5 rounded-[1rem] p-4 text-sm ${params.run === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{params.run === "success" ? `抓取完成，新增 ${params.items ?? 0} 条候选。` : "抓取失败，请查看运行记录。"}</div> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] px-4 py-3">
        <div><p className="text-sm font-medium text-[var(--foreground)]">自动抓取</p><p className="mt-1 text-xs text-[var(--muted)]">Vercel Cron 每天运行，也可以立即手动执行。</p></div>
        <form action={runRssImportAction}><button className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white">立即抓取</button></form>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <span>当前显示 {candidates?.length ?? 0} 条候选</span>
        {(q || status !== "All" || category !== "All") ? (
          <Link
            href="/admin/rss"
            className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            清空筛选
          </Link>
        ) : null}
      </div>

      {runs?.length ? <div className="mt-5 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">最近运行</p><div className="mt-3 grid gap-2 text-xs text-[var(--secondary)] sm:grid-cols-2 lg:grid-cols-5">{runs.map((run) => <div key={run.id} className="rounded-lg bg-white/50 p-3"><p className="font-medium">{run.trigger === "cron" ? "Cron" : "手动"} · {run.status === "success" ? "成功" : run.status === "failed" ? "失败" : "运行中"}</p><p className="mt-1">{new Date(run.startedAt).toLocaleString("zh-CN")} · {run.itemCount} 条</p></div>)}</div></div> : null}

      {!candidates ? (
        <div className="mt-6 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-6 text-sm leading-7 text-[var(--secondary)]">
          当前还没有连接 Supabase。配置 `NEXT_PUBLIC_SUPABASE_URL`、
          `SUPABASE_SERVICE_ROLE_KEY` 并执行 `supabase/schema.sql` 后，这里会显示 RSS
          候选资讯。
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
          {candidates.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1fr_180px_120px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>{item.feedTitle}</span>
                  <span>/</span>
                  <span>{item.category}</span>
                  <span>/</span>
                  <span>{statusLabel(item.status)}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-7 text-[var(--foreground)]">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--secondary)]">
                  {item.aiSummary || item.description || "暂无摘要。"}
                </p>
                {item.founderTakeaway ? (
                  <p className="mt-3 rounded-[0.9rem] border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.48)] px-3 py-2 text-sm leading-6 text-[var(--foreground)]">
                    {item.founderTakeaway}
                  </p>
                ) : null}
                {item.aiReason ? (
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    AI 判断：{item.aiReason}
                  </p>
                ) : null}
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
              </div>

              <div className="text-sm leading-7 text-[var(--muted)]">
                <p>{item.publishedAt ? formatDate(item.publishedAt) : "未知日期"}</p>
                <p>综合评分：{item.score ?? "待评分"}</p>
                <p>价值：{item.founderValueScore ?? "-"}</p>
                <p>{item.analyzedAt ? "已 AI 初筛" : "未 AI 初筛"}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                >
                  原文
                </a>
                {item.status === "imported" && item.articleSlug ? (
                  <Link
                    href={`/admin/articles/${item.articleSlug}`}
                    className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
                  >
                    编辑文章
                  </Link>
                ) : (
                  <>
                    <form action={analyzeRssCandidateAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                      >
                        AI 初筛
                      </button>
                    </form>
                    {item.status !== "selected" ? (
                      <form action={setRssCandidateStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="selected" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                        >
                          入选
                        </button>
                      </form>
                    ) : null}
                    {item.status !== "rejected" ? (
                      <form action={setRssCandidateStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                        >
                          拒绝
                        </button>
                      </form>
                    ) : (
                      <form action={setRssCandidateStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="pending" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                        >
                          恢复
                        </button>
                      </form>
                    )}
                    <form action={createArticleFromRssCandidateAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
                      >
                        生成草稿
                      </button>
                    </form>
                  </>
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
      )}
    </main>
  );
}
