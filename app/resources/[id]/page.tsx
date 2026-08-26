import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { getAllResources } from "@/lib/resources";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = (await getAllResources()).find((item) => item.id === id);
  return createMetadata({ title: resource?.title ?? "资源详情", description: resource?.description ?? "Founder Hub 虚拟资料库。", path: `/resources/${resource?.id ?? ""}` });
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = (await getAllResources()).find((item) => item.id === id);
  if (!resource) notFound();

  return <Section>
    <Link href="/resources" className="text-sm font-medium text-[var(--accent)]">← 返回资源库</Link>
    <div className="mt-8 max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{resource.category} · {resource.access === "Member" ? "Member Only" : "Free"}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">{resource.title}</h1>
      <p className="mt-5 text-base leading-8 text-[var(--secondary)]">{resource.description}</p>
    </div>
    <div className="mt-10 grid gap-5 md:grid-cols-2">
      <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6"><p className="text-sm text-[var(--muted)]">适合人群</p><p className="mt-2 text-lg font-medium text-[var(--foreground)]">{resource.audience}</p><p className="mt-6 text-sm text-[var(--muted)]">资料格式</p><p className="mt-2 text-lg font-medium text-[var(--foreground)]">{resource.format}</p></div>
      <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6"><p className="text-sm leading-7 text-[var(--secondary)]">{resource.access === "Member" ? "这是会员专属资料。完成会员解锁后，将在这里提供安全下载地址和必要的访问信息。" : "这是免费资料。提交邮箱后即可领取，后续更新会同步通知。"}</p>{resource.access === "Member" ? <Link href="/login" className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white">登录并解锁</Link> : resource.status === "Free" ? <Link href={`/api/resources/download/${resource.id}`} className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white">打开资料</Link> : <p className="mt-6 text-sm text-[var(--muted)]">即将开放</p>}</div>
    </div>
    <div className="mt-8 flex flex-wrap gap-2">{resource.tags.map((tag) => <span key={tag} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--secondary)]">#{tag}</span>)}</div>
  </Section>;
}
