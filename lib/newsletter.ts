import { createHmac, timingSafeEqual } from "node:crypto";
import { siteInfo } from "@/data/site";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

type SubscribeInput = { email: string; source: string };
type SubscriberAction = "confirm" | "unsubscribe";

export type SubscribeResult = {
  configured: boolean;
  alreadySubscribed: boolean;
  confirmationSent: boolean;
};

export type NewsletterCampaign = {
  id: string;
  subject: string;
  html: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  sent_count: number;
  failed_count: number;
  retry_count: number;
  created_at: string;
  sent_at: string | null;
  scheduled_at: string | null;
};

export type NewsletterTemplate = {
  id: string;
  name: string;
  subject: string;
  html: string;
  created_at: string;
  updated_at: string;
};

function getResendConfig() {
  return { apiKey: process.env.RESEND_API_KEY ?? "", from: process.env.NEWSLETTER_FROM_EMAIL ?? "", ownerEmail: process.env.OWNER_EMAIL ?? "" };
}

function isResendConfigured() {
  const config = getResendConfig();
  return Boolean(config.apiKey && config.from);
}

function getActionSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
}

function createActionToken(email: string, action: SubscriberAction) {
  const payload = Buffer.from(JSON.stringify({ email, action, exp: Date.now() + 24 * 60 * 60 * 1000 }), "utf8").toString("base64url");
  const signature = createHmac("sha256", getActionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyActionToken(token: string, action: SubscriberAction) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !getActionSecret()) return null;
  const expected = createHmac("sha256", getActionSecret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; action?: SubscriberAction; exp?: number };
    return parsed.action === action && parsed.email && parsed.exp && Date.now() <= parsed.exp ? parsed.email : null;
  } catch {
    return null;
  }
}

async function findSubscriber(email: string) {
  const response = await supabaseFetch(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=id,email,status`);
  if (!response.ok) throw new Error(`SUPABASE_FIND_FAILED_${response.status}`);
  const rows = (await response.json()) as Array<{ id: string; email: string; status: string }>;
  return rows[0] ?? null;
}

async function saveSubscriber(input: SubscribeInput, existing: boolean) {
  const response = await supabaseFetch(existing ? `newsletter_subscribers?email=eq.${encodeURIComponent(input.email)}` : "newsletter_subscribers", {
    method: existing ? "PATCH" : "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ email: input.email, source: input.source, status: "pending", subscribed_at: new Date().toISOString(), unsubscribed_at: null })
  });
  if (!response.ok) throw new Error(`SUPABASE_SAVE_FAILED_${response.status}`);
}

async function sendEmail(input: { to: string; subject: string; html: string }) {
  const config = getResendConfig();
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: config.from, to: input.to, subject: input.subject, html: input.html }) });
  if (!response.ok) throw new Error(`RESEND_FAILED_${response.status}`);
}

async function sendConfirmationEmail(email: string) {
  if (!isResendConfigured() || !getActionSecret()) return false;
  const confirmationUrl = `${siteInfo.url}/api/newsletter/confirm?token=${encodeURIComponent(createActionToken(email, "confirm"))}`;
  await sendEmail({ to: email, subject: "确认订阅 Founder Hub", html: `<p>你好，你刚刚提交了 Founder Hub 订阅申请。</p><p><a href="${confirmationUrl}">确认订阅</a></p><p>确认链接 24 小时内有效。如果不是你本人操作，可以忽略这封邮件。</p>` });
  return true;
}

async function sendWelcomeEmail(email: string) {
  if (!isResendConfigured()) return;
  const unsubscribeUrl = `${siteInfo.url}/api/newsletter/unsubscribe?token=${encodeURIComponent(createActionToken(email, "unsubscribe"))}`;
  await sendEmail({ to: email, subject: "欢迎订阅 Founder Hub", html: `<p>你好，欢迎订阅 Founder Hub。</p><p>之后我会把 AI 产品、Agent 自动化、增长系统和一人公司相关的新文章与资源整理后发给你。</p><p><a href="${unsubscribeUrl}">取消订阅</a></p>` });
}

async function notifyOwner(input: SubscribeInput) {
  const config = getResendConfig();
  if (!isResendConfigured() || !config.ownerEmail) return;
  await sendEmail({ to: config.ownerEmail, subject: "Founder Hub 新订阅", html: `<p>新订阅：${input.email}</p><p>来源：${input.source}</p>` });
}

export async function sendNewsletterCampaign(input: { subject: string; html: string }) {
  if (!isSupabaseConfigured() || !isResendConfigured()) return { configured: false, sent: 0, failed: 0 };
  const response = await supabaseFetch("newsletter_subscribers?status=eq.active&select=email&order=subscribed_at.asc&limit=1000");
  if (!response.ok) throw new Error(`NEWSLETTER_RECIPIENTS_FAILED_${response.status}`);
  const recipients = (await response.json()) as Array<{ email: string }>;
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const unsubscribeUrl = `${siteInfo.url}/api/newsletter/unsubscribe?token=${encodeURIComponent(createActionToken(recipient.email, "unsubscribe"))}`;
    try {
      await sendEmail({ to: recipient.email, subject: input.subject, html: `${input.html}<hr><p style="font-size:12px;color:#888"><a href="${unsubscribeUrl}">取消订阅</a></p>` });
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return { configured: true, sent, failed };
}

export async function createNewsletterCampaign(input: { subject: string; html: string; status?: NewsletterCampaign["status"]; scheduledAt?: string | null }) {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseFetch("newsletter_campaigns", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ subject: input.subject, html: input.html, status: input.status || "draft", scheduled_at: input.scheduledAt || null }) });
  if (!response.ok) throw new Error(`NEWSLETTER_CAMPAIGN_CREATE_FAILED_${response.status}`);
  const rows = (await response.json()) as NewsletterCampaign[];
  return rows[0] ?? null;
}

export async function updateNewsletterCampaign(id: string, input: Partial<Pick<NewsletterCampaign, "status" | "sent_count" | "failed_count" | "retry_count" | "sent_at" | "scheduled_at">>) {
  if (!isSupabaseConfigured()) return;
  const response = await supabaseFetch(`newsletter_campaigns?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error(`NEWSLETTER_CAMPAIGN_UPDATE_FAILED_${response.status}`);
}

export async function listNewsletterCampaigns() {
  if (!isSupabaseConfigured()) return [] as NewsletterCampaign[];
  const response = await supabaseFetch("newsletter_campaigns?select=id,subject,html,status,sent_count,failed_count,retry_count,created_at,sent_at,scheduled_at&order=created_at.desc&limit=50");
  if (!response.ok) throw new Error(`NEWSLETTER_CAMPAIGNS_FAILED_${response.status}`);
  return (await response.json()) as NewsletterCampaign[];
}

export async function listNewsletterTemplates() {
  if (!isSupabaseConfigured()) return [] as NewsletterTemplate[];
  const response = await supabaseFetch("newsletter_templates?select=id,name,subject,html,created_at,updated_at&order=created_at.desc&limit=50");
  if (!response.ok) throw new Error(`NEWSLETTER_TEMPLATES_FAILED_${response.status}`);
  return (await response.json()) as NewsletterTemplate[];
}

export async function createNewsletterTemplate(input: { name: string; subject: string; html: string }) {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseFetch("newsletter_templates", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error(`NEWSLETTER_TEMPLATE_CREATE_FAILED_${response.status}`);
  const rows = (await response.json()) as NewsletterTemplate[];
  return rows[0] ?? null;
}

export async function deleteNewsletterTemplate(id: string) {
  if (!isSupabaseConfigured()) return;
  const response = await supabaseFetch(`newsletter_templates?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  if (!response.ok) throw new Error(`NEWSLETTER_TEMPLATE_DELETE_FAILED_${response.status}`);
}

export async function getNewsletterCampaign(id: string) {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseFetch(`newsletter_campaigns?id=eq.${encodeURIComponent(id)}&select=id,subject,html,status,sent_count,failed_count,retry_count,created_at,sent_at,scheduled_at&limit=1`);
  if (!response.ok) throw new Error(`NEWSLETTER_CAMPAIGN_FAILED_${response.status}`);
  const rows = (await response.json()) as NewsletterCampaign[];
  return rows[0] ?? null;
}

export async function listDueNewsletterCampaigns() {
  if (!isSupabaseConfigured()) return [] as NewsletterCampaign[];
  const now = new Date().toISOString();
  const response = await supabaseFetch(`newsletter_campaigns?status=eq.scheduled&scheduled_at=lte.${encodeURIComponent(now)}&select=id,subject,html,status,sent_count,failed_count,retry_count,created_at,sent_at,scheduled_at&order=scheduled_at.asc&limit=20`);
  if (!response.ok) throw new Error(`NEWSLETTER_DUE_CAMPAIGNS_FAILED_${response.status}`);
  return (await response.json()) as NewsletterCampaign[];
}

export async function subscribeToNewsletter(input: SubscribeInput): Promise<SubscribeResult> {
  if (!isSupabaseConfigured()) return { configured: false, alreadySubscribed: false, confirmationSent: false };
  const existing = await findSubscriber(input.email);
  if (existing?.status === "active") return { configured: true, alreadySubscribed: true, confirmationSent: false };
  await saveSubscriber(input, Boolean(existing));
  return { configured: true, alreadySubscribed: false, confirmationSent: await sendConfirmationEmail(input.email) };
}

export async function confirmNewsletterSubscription(token: string) {
  const email = verifyActionToken(token, "confirm");
  if (!email || !isSupabaseConfigured()) return "invalid" as const;
  const response = await supabaseFetch(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "active", unsubscribed_at: null }) });
  if (!response.ok) throw new Error(`SUPABASE_CONFIRM_FAILED_${response.status}`);
  await Promise.allSettled([sendWelcomeEmail(email), notifyOwner({ email, source: "confirmed-email" })]);
  return "confirmed" as const;
}

export async function unsubscribeNewsletter(token: string) {
  const email = verifyActionToken(token, "unsubscribe");
  if (!email || !isSupabaseConfigured()) return "invalid" as const;
  const response = await supabaseFetch(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }) });
  if (!response.ok) throw new Error(`SUPABASE_UNSUBSCRIBE_FAILED_${response.status}`);
  return "unsubscribed" as const;
}
