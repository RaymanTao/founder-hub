import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  completeArticleTemplateAction,
  generateArticleDraftAction,
  saveArticleMeta
} from "@/app/admin/actions";
import { ArticleCoverField } from "@/app/admin/articles/[slug]/article-cover-field";
import { requireAdmin } from "@/lib/admin-auth";
import { listMediaAssets } from "@/lib/media-assets";
import { getArticleBySlug } from "@/lib/writing";
import type { ArticleAccess, ArticleCategory, ArticleType } from "@/types/article";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    saved?: string;
    created?: string;
    imported?: string;
    templated?: string;
    aiDraft?: string;
    restored?: string;
    error?: string;
  }>;
};

const categories: ArticleCategory[] = ["Build", "AI", "Growth", "Solopreneur"];
const articleTypes: ArticleType[] = [
  "Tutorial",
  "Case Study",
  "Essay",
  "Build Log",
  "Product Review",
  "Founder Analysis",
  "Experiment"
];
const accessOptions: ArticleAccess[] = ["Free", "Deep Dive"];

export const metadata: Metadata = {
  title: "编辑文章 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = true,
  help
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
      />
      {help ? <span className="mt-1 block text-xs text-[var(--muted)]">{help}</span> : null}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: T;
  options: T[];
}) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminArticleEditPage({ params, searchParams }: Props) {
  await requireAdmin();

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const mediaAssets = await listMediaAssets();
  const query = (await searchParams) ?? {};

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            返回后台
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            编辑文章
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            在这里维护 frontmatter 和正文内容。采集来的第三方内容默认是草稿，请补充自己的解读后再发布。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={generateArticleDraftAction}>
            <input type="hidden" name="slug" value={article.slug} />
            <button
              type="submit"
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
            >
              AI 生成初稿
            </button>
          </form>
          <form action={completeArticleTemplateAction}>
            <input type="hidden" name="slug" value={article.slug} />
            <button
              type="submit"
              className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              补全解读模板
            </button>
          </form>
          <Link
            href={`/admin/articles/${article.slug}/preview`}
            className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            预览草稿
          </Link>
          <Link
            href={`/admin/articles/${article.slug}/revisions`}
            className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            版本历史
          </Link>
          <Link
            href={`/writing/${article.slug}`}
            className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            查看前台
          </Link>
        </div>
      </div>

      {query.saved ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">
          已保存文章元数据。
        </div>
      ) : null}

      {query.created ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">
          已创建草稿，可以继续补充元数据和正文。
        </div>
      ) : null}

      {query.imported ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm leading-6 text-[var(--success)]">
          已从第三方 URL 采集标题、摘要和来源链接，并保存为草稿。请补充自己的解读后再发布。
        </div>
      ) : null}

      {query.templated ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">
          已补全缺失的解读模板章节，原有正文已保留。
        </div>
      ) : null}

      {query.aiDraft ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm leading-6 text-[var(--success)]">
          已生成 AI 解读初稿，并保持为草稿状态。请核对事实后再发布。
        </div>
      ) : null}

      {query.restored ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm leading-6 text-[var(--success)]">
          已恢复到所选版本，并生成新的版本记录。
        </div>
      ) : null}

      {query.error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          操作失败：{query.error === "ai-draft-failed" ? "AI 初稿生成失败，请检查 API Key、模型和网络。" : query.error}
        </div>
      ) : null}

      <form
        action={saveArticleMeta}
        className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8"
      >
        <input type="hidden" name="slug" value={article.slug} />

        <div className="grid gap-5">
          <Field label="标题" name="title" defaultValue={article.title} />
          <label className="block text-sm font-medium text-[var(--foreground)]">
            摘要
            <textarea
              name="description"
              required
              defaultValue={article.description}
              rows={4}
              className="mt-2 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label="编号" name="number" type="number" defaultValue={article.number} />
            <Field label="日期" name="date" type="date" defaultValue={article.date} />
            <Field label="阅读时间" name="readingTime" defaultValue={article.readingTime} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <SelectField
              label="分类"
              name="category"
              defaultValue={article.category}
              options={categories}
            />
            <SelectField
              label="类型"
              name="type"
              defaultValue={article.type}
              options={articleTypes}
            />
            <SelectField
              label="访问层级"
              name="access"
              defaultValue={article.access}
              options={accessOptions}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="来源" name="source" defaultValue={article.source} />
            <Field
              label="来源链接"
              name="sourceUrl"
              type="url"
              required={false}
              defaultValue={article.sourceUrl}
            />
          </div>

          <Field
            label="标签"
            name="tags"
            defaultValue={article.tags.join(", ")}
            help="多个标签用英文逗号分隔。"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="音频链接"
              name="audioUrl"
              type="url"
              required={false}
              defaultValue={article.audioUrl}
            />
            <div className="md:col-span-2">
              <ArticleCoverField
                defaultValue={article.cover}
                mediaAssets={mediaAssets.map((asset) => ({
                  id: asset.id,
                  key: asset.key,
                  url: asset.url,
                  alt: asset.alt
                }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 border-t border-[var(--border)] pt-5">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <input name="featured" type="checkbox" defaultChecked={article.featured} />
              设为精选
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <input name="published" type="checkbox" defaultChecked={article.published} />
              发布到前台
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <input name="archived" type="checkbox" defaultChecked={article.archived} />
              归档隐藏
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <input name="verified" type="checkbox" defaultChecked={article.verified} />
              已核对来源
            </label>
          </div>

          <label className="block border-t border-[var(--border)] pt-6 text-sm font-medium text-[var(--foreground)]">
            正文 Markdown / MDX
            <textarea
              name="content"
              required
              defaultValue={article.content}
              rows={24}
              spellCheck={false}
              className="mt-2 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.82)] px-4 py-3 font-mono text-sm leading-7 outline-none transition focus:border-[var(--accent)]"
            />
            <span className="mt-2 block text-xs leading-6 text-[var(--muted)]">
              支持 Markdown 标题、列表、引用和代码块。AI 生成初稿会覆盖当前正文，保存后会写回当前内容源。
            </span>
          </label>

          <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
            <button
              type="submit"
              className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
            >
              保存文章
            </button>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              取消
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
