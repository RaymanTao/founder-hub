import { Metadata } from "next";
import { deleteRssFeedAction, enableRssFeedsAction, importRssOpmlAction, saveRssFeedAction, testRssFeedAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getRssFeeds } from "@/lib/rss-feeds";
import { RssSourceManager } from "./rss-source-manager";

export const metadata: Metadata = { title: "RSS 来源管理 | Founder Hub", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RssSourcesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const feeds = await getRssFeeds({ useFallback: false });
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <RssSourceManager feeds={feeds} initialPage={page} feedback={params.error ? { tone: "error", message: params.error === "delete-failed" ? "删除失败，请确认数据库迁移和 Supabase 连接。" : params.error === "enable-failed" ? "批量开启失败，请检查 Supabase 连接或权限。" : params.error === "enable-empty" ? "请先选择要开启的订阅源。" : params.error === "save-failed" ? "来源解析成功，但保存到数据库失败，请检查 Supabase 连接或权限后重试。" : params.error === "no-feeds" ? "OPML 中没有找到有效的 RSS 来源。" : params.error === "empty-opml" ? "请选择 OPML 文件。" : "OPML 文件格式无效，请检查文件内容。" } : params.enabled ? { tone: "success", message: `已开启 ${params.enabled} 个订阅源。` } : params.imported ? { tone: "success", message: `已发现 ${params.found ?? 0} 个来源，新增 ${params.imported} 个。新来源默认关闭。` } : params.test ? { tone: params.test === "ok" ? "success" : "error", message: params.test === "ok" ? `连接成功（HTTP ${params.status ?? 200}）。` : "连接失败，请检查地址或来源是否支持 RSS。" } : params.saved || params.deleted ? { tone: "success", message: "操作已完成。" } : null} importAction={importRssOpmlAction} saveAction={saveRssFeedAction} enableAction={enableRssFeedsAction} testAction={testRssFeedAction} deleteAction={deleteRssFeedAction} />
      <style>{`.field{min-height:2.75rem;border:1px solid var(--border);border-radius:9999px;background:rgba(255,255,255,.78);padding:0 1rem;font-size:.875rem;outline:none}.field:focus{border-color:var(--accent)}table td:last-child>div{flex-wrap:nowrap;white-space:nowrap}`}</style>
    </main>
  );
}
