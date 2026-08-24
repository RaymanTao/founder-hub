import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseArticleRevision } from "@/lib/article-db";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { getArticleBySlug } from "@/lib/writing";

type Props = {
  params: Promise<{ slug: string; revisionId: string }>;
};

export const metadata: Metadata = {
  title: "版本详情 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminArticleRevisionDetailPage({ params }: Props) {
  await requireAdmin();

  const { slug, revisionId } = await params;
  const [article, revision] = await Promise.all([
    getArticleBySlug(slug),
    getSupabaseArticleRevision(slug, revisionId)
  ]);

  if (!article || !revision) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
        <div>
          <Link
            href={`/admin/articles/${article.slug}/revisions`}
            className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            返回版本列表
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            版本详情
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            {formatDate(revision.created_at)} /{" "}
            {new Date(revision.created_at).toLocaleTimeString("zh-CN")} /{" "}
            {revision.created_by}
          </p>
        </div>
        <Link
          href={`/admin/articles/${article.slug}`}
          className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
        >
          返回编辑
        </Link>
      </div>

      <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>Revision</span>
          <span>/</span>
          <span>{revision.id}</span>
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {revision.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
          {revision.description}
        </p>
        <pre className="mt-5 max-h-[260px] overflow-auto rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.66)] p-4 text-xs leading-6 text-[var(--secondary)]">
          {JSON.stringify(revision.meta, null, 2)}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          渲染预览
        </h2>
        <div className="prose-content mt-5 rounded-[1.5rem] border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-soft)] sm:p-10">
          {renderMarkdown(revision.body)}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          原始正文
        </h2>
        <textarea
          readOnly
          value={revision.body}
          rows={24}
          spellCheck={false}
          className="mt-5 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.82)] px-4 py-3 font-mono text-sm leading-7 outline-none"
        />
      </section>
    </main>
  );
}
