"use client";

import { useState } from "react";
import type { NewsletterTemplate } from "@/lib/newsletter";

export function NewsletterComposer({ action, templates }: { action: (formData: FormData) => void | Promise<void>; templates: NewsletterTemplate[] }) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <>
      <form action={action} className="mt-8 grid gap-5 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        {templates.length ? <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-[var(--muted)]">使用模板</span>{templates.map((template) => <button key={template.id} type="button" onClick={() => { setSubject(template.subject); setHtml(template.html); }} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground)] transition hover:border-[var(--accent)]">{template.name}</button>)}</div> : null}
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">邮件主题<input name="subject" required maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="例如：本周 Founder Hub 精选" className="min-h-12 rounded-[10px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 outline-none focus:border-[var(--accent)]" /></label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">HTML 正文<textarea name="html" required maxLength={100000} rows={18} value={html} onChange={(event) => setHtml(event.target.value)} placeholder="输入邮件 HTML 正文" className="rounded-[10px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--accent)]" /></label>
        <label className="grid max-w-sm gap-2 text-sm font-medium text-[var(--foreground)]">定时发送（可选）<input name="scheduledAt" type="datetime-local" className="min-h-12 rounded-[10px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 outline-none focus:border-[var(--accent)]" /></label>
        <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-[var(--muted)]">系统会自动附加取消订阅链接。</p><div className="flex flex-wrap gap-3"><button type="button" disabled={!html} onClick={() => setPreview(true)} className="min-h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50">预览邮件</button><input name="templateName" maxLength={100} placeholder="模板名称" className="min-h-11 w-32 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 text-sm outline-none focus:border-[var(--accent)]" /><button type="submit" name="intent" value="template" className="min-h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)]">保存为模板</button><button type="submit" name="intent" value="save" className="min-h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)]">保存草稿</button><button type="submit" name="intent" value="send" onClick={(event) => { if (!window.confirm("确认发送给所有已确认订阅用户吗？")) event.preventDefault(); }} className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]">发送 Newsletter</button></div></div>
      </form>
      {preview ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(false); }}><section role="dialog" aria-modal="true" aria-label="邮件预览" className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] shadow-2xl"><div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><p className="text-xs text-[var(--muted)]">邮件预览</p><h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{subject || "无主题"}</h2></div><button type="button" onClick={() => setPreview(false)} aria-label="关闭预览" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-lg text-[var(--secondary)]">×</button></div><div className="overflow-y-auto bg-white p-6 text-black" dangerouslySetInnerHTML={{ __html: html || "<p>暂无正文</p>" }} /></section></div> : null}
    </>
  );
}
