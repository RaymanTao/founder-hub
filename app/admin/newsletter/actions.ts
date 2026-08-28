"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createNewsletterCampaign, createNewsletterTemplate, deleteNewsletterTemplate, getNewsletterCampaign, sendNewsletterCampaign, updateNewsletterCampaign } from "@/lib/newsletter";

export async function sendNewsletterAction(formData: FormData) {
  await requireAdmin();
  const subject = String(formData.get("subject") || "").trim().slice(0, 160);
  const html = String(formData.get("html") || "").trim().slice(0, 100000);
  const scheduledAt = String(formData.get("scheduledAt") || "").trim();
  if (!subject || !html) redirect("/admin/newsletter?error=empty");
  if (String(formData.get("intent")) === "save") {
    await createNewsletterCampaign({ subject, html });
    redirect("/admin/newsletter?saved=1");
  }
  if (String(formData.get("intent")) === "template") {
    const name = String(formData.get("templateName") || subject).trim().slice(0, 100);
    if (!name) redirect("/admin/newsletter?error=template");
    await createNewsletterTemplate({ name, subject, html });
    redirect("/admin/newsletter?template=1");
  }
  if (scheduledAt && Number.isNaN(Date.parse(scheduledAt))) redirect("/admin/newsletter?error=schedule");
  if (scheduledAt && Date.parse(scheduledAt) > Date.now()) {
    await createNewsletterCampaign({ subject, html, status: "scheduled", scheduledAt: new Date(scheduledAt).toISOString() });
    redirect("/admin/newsletter?scheduled=1");
  }
  const campaign = await createNewsletterCampaign({ subject, html });
  if (campaign) await updateNewsletterCampaign(campaign.id, { status: "sending" });
  const result = await sendNewsletterCampaign({ subject, html });
  if (!result.configured) redirect("/admin/newsletter?error=config");
  if (campaign) await updateNewsletterCampaign(campaign.id, { status: result.failed ? "failed" : "sent", sent_count: result.sent, failed_count: result.failed, sent_at: new Date().toISOString() });
  redirect(`/admin/newsletter?sent=${result.sent}&failed=${result.failed}`);
}

export async function deleteNewsletterTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) await deleteNewsletterTemplate(id);
  redirect("/admin/newsletter?templateDeleted=1");
}

export async function retryNewsletterAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const campaign = await getNewsletterCampaign(id);
  if (!campaign || campaign.status !== "failed") redirect("/admin/newsletter?error=retry");
  await updateNewsletterCampaign(id, { status: "sending", retry_count: campaign.retry_count + 1 });
  const result = await sendNewsletterCampaign({ subject: campaign.subject, html: campaign.html });
  await updateNewsletterCampaign(id, { status: result.failed ? "failed" : "sent", sent_count: result.sent, failed_count: result.failed, sent_at: new Date().toISOString() });
  redirect(`/admin/newsletter?sent=${result.sent}&failed=${result.failed}`);
}
