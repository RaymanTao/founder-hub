import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllArticles } from "@/lib/writing";
import { getAllResources } from "@/lib/resources";
import { getRssFeeds } from "@/lib/rss-feeds";
import { listRssCandidates } from "@/lib/rss-items";

export async function GET(request: Request) {
  await requireAdmin();
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase().slice(0, 100) ?? "";
  if (!query) return NextResponse.json({ results: [] });

  const [articles, resources, feeds, candidates] = await Promise.all([
    getAllArticles({ includeDrafts: true, includeArchived: true }),
    getAllResources({ includeArchived: true }),
    getRssFeeds(),
    listRssCandidates({ q: query, status: "All", limit: 40 }).catch(() => null)
  ]);
  const matches = (values: string[]) => values.join(" ").toLowerCase().includes(query);
  const results = [
    ...articles.filter((item) => matches([item.title, item.description, item.source, item.category, item.type, ...item.tags])).map((item) => ({ kind: "文章", title: item.title, description: item.description, href: `/admin/articles/${item.slug}`, meta: item.category })),
    ...resources.filter((item) => matches([item.title, item.description, item.category, item.format, ...item.tags])).map((item) => ({ kind: "资源", title: item.title, description: item.description, href: `/admin/resources/${item.id}`, meta: item.category })),
    ...feeds.filter((item) => matches([item.title, item.url, item.category, ...item.tags])).map((item) => ({ kind: "RSS 来源", title: item.title, description: item.url, href: "/admin/rss/sources", meta: item.category })),
    ...(candidates ?? []).filter((item) => matches([item.title, item.description, item.feedTitle, ...item.suggestedTags])).map((item) => ({ kind: "RSS 候选", title: item.title, description: item.description, href: `/admin/rss?q=${encodeURIComponent(item.title)}`, meta: item.feedTitle }))
  ].slice(0, 30);

  return NextResponse.json({ results });
}
