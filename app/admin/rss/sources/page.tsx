import Link from "next/link";
import { Metadata } from "next";
import { deleteRssFeedAction, importRssOpmlAction, saveRssFeedAction, testRssFeedAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getRssFeeds } from "@/lib/rss-feeds";
import type { ArticleCategory, ArticleType } from "@/types/article";

export const metadata: Metadata = { title: "RSS 来源管理 | Founder Hub", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const categories: ArticleCategory[] = ["Build", "AI", "Growth", "Solopreneur"];
const types: ArticleType[] = ["Founder Analysis", "Case Study", "Product Review", "Tutorial", "Essay", "Build Log", "Experiment"];

export default async function RssSourcesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const feeds = await getRssFeeds();
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      {params.error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{params.error === "delete-failed" ? "删除失败，请确认已执行数据库迁移。" : "请检查来源信息。"}</p> : null}
      {params.saved || params.deleted ? <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">操作已完成。</p> : null}
      {params.imported ? <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">已发现 {params.found ?? 0} 个来源，新增 {params.imported} 个。新来源默认关闭，请测试后再启用。</p> : null}
      {params.test ? <p className={`mt-5 rounded-xl p-4 text-sm ${params.test === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{params.test === "ok" ? `连接成功（HTTP ${params.status ?? 200}）。` : "连接失败，请检查地址或来源是否支持 RSS。"}</p> : null}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <form action={importRssOpmlAction} className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">批量导入 OPML</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">支持上传 `.opml` 文件或粘贴 OPML 内容。导入后来源默认关闭，请先测试连接，再开启自动抓取。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="file" type="file" accept=".opml,.xml,text/xml,application/xml" className="field file:mr-3 file:border-0 file:bg-transparent file:text-sm" />
            <textarea name="opml" rows={3} placeholder="也可以把 OPML XML 粘贴到这里" className="field min-h-28 rounded-2xl py-3" />
          </div>
          <button className="mt-4 rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-medium text-white">导入订阅源</button>
        </form>
        <form action={saveRssFeedAction} className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
          <h2 className="text-lg font-semibold">新增来源</h2>
          <div className="mt-4 grid gap-3">
            <input name="id" required placeholder="唯一 ID，例如 ai-product-news" className="field" />
            <input name="title" required placeholder="来源名称" className="field" />
            <input name="url" required type="url" placeholder="https://example.com/feed.xml" className="field" />
            <div className="grid gap-3 sm:grid-cols-2"><select name="category" defaultValue="AI" className="field">{categories.map((item) => <option key={item}>{item}</option>)}</select><select name="type" defaultValue="Founder Analysis" className="field">{types.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="grid gap-3 sm:grid-cols-2"><input name="trustScore" type="number" min="0" max="100" defaultValue="70" placeholder="可信度" className="field" /><input name="tags" placeholder="标签，用逗号分隔" className="field" /></div>
            <label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" />立即启用</label>
          </div>
          <button className="mt-5 rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-medium text-white">保存来源</button>
        </form>
        <div className="space-y-3">
          {feeds.map((feed) => (
            <article key={feed.id} className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
              <form action={saveRssFeedAction} className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{feed.title}</h2>
                  <label className="flex items-center gap-2 text-xs"><input name="enabled" type="checkbox" defaultChecked={feed.enabled} />启用</label>
                </div>
                <input type="hidden" name="id" value={feed.id} />
                <input name="title" defaultValue={feed.title} required className="field" />
                <input name="url" defaultValue={feed.url} required type="url" placeholder="RSS 地址" className="field" />
                <div className="grid gap-3 sm:grid-cols-2"><select name="category" defaultValue={feed.category} className="field">{categories.map((item) => <option key={item}>{item}</option>)}</select><select name="type" defaultValue={feed.type} className="field">{types.map((item) => <option key={item}>{item}</option>)}</select></div>
                <div className="grid gap-3 sm:grid-cols-2"><input name="trustScore" type="number" min="0" max="100" defaultValue={feed.trustScore} className="field" /><input name="tags" defaultValue={feed.tags.join(", ")} placeholder="标签，用逗号分隔" className="field" /></div>
                <button className="w-fit rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white">保存修改</button>
              </form>
              <div className="mt-3 flex gap-4"><form action={testRssFeedAction}><input type="hidden" name="url" value={feed.url} /><button className="text-sm text-[var(--accent)]">测试连接</button></form><form action={deleteRssFeedAction}><input type="hidden" name="id" value={feed.id} /><button className="text-sm text-red-700">删除</button></form></div>
            </article>
          ))}
          {!feeds.length ? <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--secondary)]">暂无 RSS 来源。</p> : null}
        </div>
      </div>
      <style>{`.field{min-height:2.75rem;border:1px solid var(--border);border-radius:9999px;background:rgba(255,255,255,.78);padding:0 1rem;font-size:.875rem;outline:none}.field:focus{border-color:var(--accent)}`}</style>
    </main>
  );
}
