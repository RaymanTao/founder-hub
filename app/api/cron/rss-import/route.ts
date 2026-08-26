import { NextResponse } from "next/server";
import { importRssCandidates } from "@/lib/rss-import";
import { finishRssRun, startRssRun } from "@/lib/rss-runs";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const runId = await startRssRun("cron");
  try {
    const result = await importRssCandidates(5);
    await finishRssRun(runId, { status: "success", ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("RSS cron import failed", error);
    await finishRssRun(runId, { status: "failed", message: error instanceof Error ? error.message : "RSS import failed" });
    return NextResponse.json({ ok: false, message: "RSS import failed" }, { status: 500 });
  }
}
