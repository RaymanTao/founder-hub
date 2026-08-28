import { NextResponse } from "next/server";
import { z } from "zod";
import { getReaderEmail } from "@/lib/reader-auth";
import { createMediaAsset } from "@/lib/media-assets";
import { getReaderProfile, upsertReaderProfile } from "@/lib/profiles";

const schema = z.object({ key: z.string().min(1).max(600), url: z.string().url(), contentType: z.string().startsWith("image/"), sizeBytes: z.number().int().positive().max(5 * 1024 * 1024), alt: z.string().max(240).optional() });

export async function POST(request: Request) {
  const email = await getReaderEmail();
  if (!email) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, message: "头像参数不完整。" }, { status: 400 });
  const currentProfile = await getReaderProfile(email);
  await upsertReaderProfile({
    email,
    name: currentProfile.display_name,
    avatarUrl: parsed.data.url,
    provider: currentProfile.provider
  });
  let mediaConfigured = false;
  try {
    const result = await createMediaAsset({ ...parsed.data, context: "profile-avatar" });
    mediaConfigured = result.configured;
  } catch {
    // Avatar persistence should not fail just because the optional media index is unavailable.
  }
  return NextResponse.json({ ok: true, configured: mediaConfigured, avatarUrl: parsed.data.url });
}
