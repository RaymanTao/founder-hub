import { NextResponse } from "next/server";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.email("请输入有效邮箱"),
  source: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await request.json();
  const result = newsletterSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? "提交失败" },
      { status: 400 }
    );
  }

  const { email } = result.data;

  if (email.endsWith("@already-subscribed.test")) {
    return NextResponse.json({ message: "你已经订阅过了。" });
  }

  return NextResponse.json({
    message:
      "订阅成功。当前为本地演示模式；配置 Supabase / Resend 后可启用真实存储与欢迎邮件。"
  });
}
