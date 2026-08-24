import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createMediaKey, createR2PresignedPutUrl, isR2Configured } from "@/lib/r2";

const bodySchema = z.object({
  filename: z.string().min(1).max(160),
  contentType: z.string().min(1).max(120),
  prefix: z.string().max(80).optional()
});

export async function POST(request: Request) {
  await requireAdmin();

  if (!isR2Configured()) {
    return NextResponse.json(
      { ok: false, message: "R2 尚未配置。" },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "上传参数不完整。" },
      { status: 400 }
    );
  }

  if (!parsed.data.contentType.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, message: "当前媒体库只允许上传图片。" },
      { status: 400 }
    );
  }

  const key = createMediaKey({
    prefix: parsed.data.prefix || "covers",
    filename: parsed.data.filename
  });

  return NextResponse.json({
    ok: true,
    upload: createR2PresignedPutUrl({
      key,
      contentType: parsed.data.contentType
    })
  });
}
