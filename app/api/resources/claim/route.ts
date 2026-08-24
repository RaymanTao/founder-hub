import { NextResponse } from "next/server";
import { z } from "zod";
import { claimResource } from "@/lib/resource-leads";

const claimSchema = z.object({
  email: z.email("请输入有效邮箱"),
  resourceId: z.string().min(1),
  source: z.string().min(1).default("resources")
});

export async function POST(request: Request) {
  const payload = await request.json();
  const result = claimSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? "领取失败" },
      { status: 400 }
    );
  }

  try {
    const claimed = await claimResource({
      email: result.data.email.toLowerCase(),
      resourceId: result.data.resourceId,
      source: result.data.source
    });

    return NextResponse.json(
      {
        message: claimed.message,
        href: claimed.href
      },
      { status: claimed.status }
    );
  } catch {
    return NextResponse.json(
      { message: "领取暂时失败，请稍后再试。" },
      { status: 500 }
    );
  }
}
