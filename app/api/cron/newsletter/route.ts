import { NextResponse } from "next/server";
import { listDueNewsletterCampaigns, sendNewsletterCampaign, updateNewsletterCampaign } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const campaigns = await listDueNewsletterCampaigns();
  const results = [] as Array<{ id: string; sent: number; failed: number }>;
  for (const campaign of campaigns) {
    await updateNewsletterCampaign(campaign.id, { status: "sending" });
    try {
      const result = await sendNewsletterCampaign({ subject: campaign.subject, html: campaign.html });
      await updateNewsletterCampaign(campaign.id, { status: result.failed ? "failed" : "sent", sent_count: result.sent, failed_count: result.failed, sent_at: new Date().toISOString() });
      results.push({ id: campaign.id, sent: result.sent, failed: result.failed });
    } catch {
      await updateNewsletterCampaign(campaign.id, { status: "failed", failed_count: campaign.failed_count + 1, retry_count: campaign.retry_count + 1 });
      results.push({ id: campaign.id, sent: 0, failed: campaign.failed_count + 1 });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
