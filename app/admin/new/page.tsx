import { Metadata } from "next";
import Link from "next/link";
import {
  createManualArticle,
  importArticleFromUrl
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import type { ArticleType } from "@/types/article";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const articleTypes: ArticleType[] = [
  "Tutorial",
  "Case Study",
  "Essay",
  "Build Log",
  "Product Review",
  "Founder Analysis",
  "Experiment"
];

export const metadata: Metadata = {
  title: "新建文章 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminNewArticlePage({ searchParams }: Props) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const errorCopy: Record<string, string> = {
    "invalid-url": "请输入有效的 http 或 https 链接。",
    "import-failed": "采集失败。目标网站可能阻止访问，或页面没有可读取的元信息。",
    "invalid-manual": "请填写标题、摘要并选择正确的文章类型。"
  };

  return (
    <main className="mx-auto max-w-[980px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[var(--border)] pb-8">
        <Link
          href="/admin"
          className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
        >
          返回后台
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          新建 / 采集文章
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--secondary)]">
          第三方链接会被采集为草稿，只保存标题、摘要、站点名和原文链接。正文区域会生成解读模板，方便你补充自己的判断。
        </p>
      </div>

      {params.error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          {errorCopy[params.error] ?? "操作失败，请重试。"}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          action={importArticleFromUrl}
          className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Import
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            从第三方 URL 采集
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            适合把值得解读的外部文章先收入草稿箱，再写成自己的分析。
          </p>
          <label className="mt-5 block text-sm font-medium text-[var(--foreground)]">
            原文链接
            <input
              name="url"
              type="url"
              required
              placeholder="https://example.com/article"
              className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            className="mt-5 min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            采集为草稿
          </button>
        </form>

        <form
          action={createManualArticle}
          className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Manual
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            手动新建草稿
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            适合原创文章、项目复盘、资源说明和服务案例。
          </p>
          <div className="mt-5 grid gap-4">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              标题
              <input
                name="title"
                required
                className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              摘要
              <textarea
                name="description"
                required
                rows={3}
                className="mt-2 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              类型
              <select
                name="type"
                defaultValue="Essay"
                className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
              >
                {articleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            创建草稿
          </button>
        </form>
      </div>
    </main>
  );
}
