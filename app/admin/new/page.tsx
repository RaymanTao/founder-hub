import { Metadata } from "next";
import Link from "next/link";
import { createManualArticle } from "@/app/admin/actions";
import { ArticleCoverField } from "@/app/admin/articles/[slug]/article-cover-field";
import { MarkdownEditor } from "@/app/admin/articles/markdown-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { listMediaAssets } from "@/lib/media-assets";
import type { ArticleAccess, ArticleCategory, ArticleType } from "@/types/article";

type Props = { searchParams?: Promise<{ error?: string }> };

const categories: ArticleCategory[] = ["Build", "AI", "Growth", "Solopreneur"];
const articleTypes: ArticleType[] = [
  "Tutorial", "Case Study", "Essay", "Build Log", "Product Review", "Founder Analysis", "Experiment"
];
const accessOptions: ArticleAccess[] = ["Free", "Deep Dive"];

export const metadata: Metadata = {
  title: "新建文章 | Founder Hub",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

function SelectField<T extends string>({ label, name, defaultValue, options }: {
  label: string; name: string; defaultValue: T; options: T[];
}) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      {label}
      <select name={name} defaultValue={defaultValue} className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default async function AdminNewArticlePage({ searchParams }: Props) {
  await requireAdmin();
  const mediaAssets = await listMediaAssets();
  const params = (await searchParams) ?? {};

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      {params.error ? (
        <div className="mb-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          {params.error === "invalid-manual" ? "请填写标题、摘要和正文，并检查文章分类、类型与访问层级。" : "操作失败，请重试。"}
        </div>
      ) : null}
      <form action={createManualArticle} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="grid gap-5">
          <label className="block text-sm font-medium text-[var(--foreground)]">标题
            <input name="title" required className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label className="block text-sm font-medium text-[var(--foreground)]">摘要
            <textarea name="description" required rows={4} className="mt-2 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none transition focus:border-[var(--accent)]" />
          </label>
          <div className="grid gap-5 md:grid-cols-3">
            <SelectField label="分类" name="category" defaultValue="AI" options={categories} />
            <SelectField label="类型" name="type" defaultValue="Essay" options={articleTypes} />
            <SelectField label="访问层级" name="access" defaultValue="Free" options={accessOptions} />
          </div>
          <label className="block text-sm font-medium text-[var(--foreground)]">标签
            <input name="tags" placeholder="创业, AI, 一人公司" className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]" />
          </label>
          <ArticleCoverField mediaAssets={mediaAssets.map((asset) => ({ id: asset.id, key: asset.key, url: asset.url, alt: asset.alt }))} />
          <div className="flex flex-wrap gap-5 border-t border-[var(--border)] pt-5">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"><input name="featured" type="checkbox" />设为精选</label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"><input name="published" type="checkbox" />发布到前台</label>
          </div>
          <div className="block border-t border-[var(--border)] pt-6 text-sm font-medium text-[var(--foreground)]"><p>正文 Markdown / MDX</p>
            <MarkdownEditor name="content" enableDraftChoice />
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
            <button type="submit" className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]">创建文章</button>
            <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]">取消</Link>
          </div>
        </div>
      </form>
    </main>
  );
}
