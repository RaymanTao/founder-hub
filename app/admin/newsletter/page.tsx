import { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminLeads } from "@/lib/admin-leads";
import { deleteNewsletterTemplateAction, retryNewsletterAction, sendNewsletterAction } from "@/app/admin/newsletter/actions";
import { NewsletterComposer } from "@/app/admin/newsletter/newsletter-composer";
import { listNewsletterCampaigns, listNewsletterTemplates } from "@/lib/newsletter";

export const metadata: Metadata = { title: "Newsletter | Founder Hub", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ error?: string; sent?: string; failed?: string; saved?: string; scheduled?: string; template?: string; templateDeleted?: string }> };

export default async function AdminNewsletterPage({ searchParams }: Props) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const leads = await getAdminLeads();
  const campaigns = await listNewsletterCampaigns();
  const templates = await listNewsletterTemplates();
  const activeCount = leads.subscribers.filter((subscriber) => subscriber.status === "active").length;
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">运营</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Newsletter</h1><p className="mt-2 text-sm text-[var(--secondary)]">向已确认订阅的用户发送最新内容。</p></div>
        <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--secondary)]">当前可发送：<strong className="text-[var(--foreground)]">{activeCount}</strong> 人</div>
      </div>
      {params.error === "empty" ? <p className="mt-6 rounded-xl bg-[rgba(143,78,69,0.08)] p-4 text-sm text-[var(--danger)]">请填写邮件主题和正文。</p> : null}
      {params.error === "config" ? <p className="mt-6 rounded-xl bg-[rgba(143,78,69,0.08)] p-4 text-sm text-[var(--danger)]">请先配置 Supabase 和 Resend。</p> : null}
      {params.sent ? <p className="mt-6 rounded-xl bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">已发送 {params.sent} 封，失败 {params.failed || "0"} 封。</p> : null}
      {params.saved ? <p className="mt-6 rounded-xl bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">草稿已保存。</p> : null}
      {params.scheduled ? <p className="mt-6 rounded-xl bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">Newsletter 已加入定时发送。</p> : null}
      {params.error === "schedule" ? <p className="mt-6 rounded-xl bg-[rgba(143,78,69,0.08)] p-4 text-sm text-[var(--danger)]">定时发送时间无效。</p> : null}
      {params.error === "retry" ? <p className="mt-6 rounded-xl bg-[rgba(143,78,69,0.08)] p-4 text-sm text-[var(--danger)]">该发送活动不存在或当前不可重试。</p> : null}
      {params.error === "template" ? <p className="mt-6 rounded-xl bg-[rgba(143,78,69,0.08)] p-4 text-sm text-[var(--danger)]">请输入模板名称。</p> : null}
      {params.template || params.templateDeleted ? <p className="mt-6 rounded-xl bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">模板已更新。</p> : null}
      <NewsletterComposer action={sendNewsletterAction} templates={templates} />
      <section className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-[var(--foreground)]">邮件模板</h2><span className="text-xs text-[var(--muted)]">点击模板名称可回填编辑器</span></div><div className="mt-4 divide-y divide-[var(--border)]">{templates.map((template) => <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"><div><p className="font-medium text-[var(--foreground)]">{template.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{template.subject}</p></div><form action={deleteNewsletterTemplateAction}><input type="hidden" name="id" value={template.id} /><button type="submit" className="text-xs text-[var(--danger)]">删除</button></form></div>)}{!templates.length ? <p className="py-3 text-sm text-[var(--secondary)]">暂无模板。</p> : null}</div></section>
      <section className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-[var(--foreground)]">发送记录</h2><span className="text-xs text-[var(--muted)]">最近 50 条</span></div><div className="mt-4 divide-y divide-[var(--border)]">{campaigns.map((campaign) => <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"><div><p className="font-medium text-[var(--foreground)]">{campaign.subject}</p><p className="mt-1 text-xs text-[var(--muted)]">{campaign.status} · 成功 {campaign.sent_count} · 失败 {campaign.failed_count} · 重试 {campaign.retry_count}</p></div><div className="flex items-center gap-3"><time className="text-xs text-[var(--muted)]">{campaign.scheduled_at ? `计划 ${new Date(campaign.scheduled_at).toLocaleString("zh-CN")}` : new Date(campaign.sent_at || campaign.created_at).toLocaleString("zh-CN")}</time>{campaign.status === "failed" ? <form action={retryNewsletterAction}><input type="hidden" name="id" value={campaign.id} /><button type="submit" className="min-h-9 rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground)]">重试</button></form> : null}</div></div>)}{!campaigns.length ? <p className="py-3 text-sm text-[var(--secondary)]">暂无发送记录。</p> : null}</div></section>
    </main>
  );
}
