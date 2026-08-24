import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createMediaAsset } from "@/lib/media-assets";

const bodySchema = z.object({
  key: z.string().min(1).max(600),
  url: z.string().url(),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative().optional(),
  alt: z.string().max(240).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  context: z.string().max(80).optional()
});

export async function POST(request: Request) {
  await requireAdmin();

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "媒体登记参数不完整。" },
      { status: 400 }
    );
  }

  const result = await createMediaAsset(parsed.data);

  return NextResponse.json({
    ok: true,
    configured: result.configured
  });
}
