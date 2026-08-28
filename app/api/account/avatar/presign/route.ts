import { NextResponse } from "next/server";
import { z } from "zod";
import { getReaderEmail } from "@/lib/reader-auth";
import { createMediaKey, createR2PresignedPutUrl, isR2Configured } from "@/lib/r2";

const schema = z.object({ filename: z.string().min(1).max(160), contentType: z.string().startsWith("image/") });

export async function POST(request: Request) {
  if (!await getReaderEmail()) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  if (!isR2Configured()) return NextResponse.json({ ok: false, message: "R2 尚未配置。" }, { status: 503 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, message: "只支持图片文件。" }, { status: 400 });
  const key = createMediaKey({ prefix: "avatars", filename: parsed.data.filename });
  return NextResponse.json({ ok: true, upload: createR2PresignedPutUrl({ key, contentType: parsed.data.contentType }) });
}
