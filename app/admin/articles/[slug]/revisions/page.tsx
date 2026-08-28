import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { listSupabaseArticleRevisions } from "@/lib/article-db";
import { formatDate } from "@/lib/utils";
import { getArticleBySlug } from "@/lib/writing";

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "文章版本 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function getBodyStats(body: string) {
  return {
    chars: body.length,
    lines: body.split("\n").length
  };
}

export default async function AdminArticleRevisionsPage({ params }: Props) {
  await requireAdmin();

  const { slug } = await params;
  const [article, revisions] = await Promise.all([
    getArticleBySlug(slug),
    listSupabaseArticleRevisions(slug)
  ]);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      {revisions === null ? (
        <div className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6 text-sm leading-7 text-[var(--secondary)] shadow-[var(--shadow-soft)]">
          当前内容源不是 Supabase。切换到 ARTICLE_CONTENT_SOURCE=supabase 后，后台保存会自动生成版本历史。
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)]">
          {revisions.map((revision, index) => {
            const stats = getBodyStats(revision.body);
            return (
              <Link
                key={revision.id}
                href={`/admin/articles/${article.slug}/revisions/${revision.id}`}
                className="grid gap-4 border-b border-[var(--border)] p-5 transition last:border-b-0 hover:bg-[rgba(255,255,255,0.42)] md:grid-cols-[1fr_180px_120px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    <span>Version {revisions.length - index}</span>
                    <span>/</span>
                    <span>{revision.created_by}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {revision.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--secondary)]">
                    {revision.description}
                  </p>
                </div>
                <div className="text-sm leading-7 text-[var(--muted)]">
                  <p>{formatDate(revision.created_at)}</p>
                  <p>{new Date(revision.created_at).toLocaleTimeString("zh-CN")}</p>
                </div>
                <div className="text-sm leading-7 text-[var(--muted)] md:text-right">
                  <p>{stats.chars} 字符</p>
                  <p>{stats.lines} 行</p>
                </div>
              </Link>
            );
          })}
          {!revisions.length ? (
            <div className="p-6 text-sm text-[var(--secondary)]">
              暂时还没有版本记录。下一次在 Supabase 内容源下保存文章后，这里会出现版本。
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
