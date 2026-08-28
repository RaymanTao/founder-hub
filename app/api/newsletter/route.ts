import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeToNewsletter } from "@/lib/newsletter";

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

  const { email, source } = result.data;

  if (email.endsWith("@already-subscribed.test")) {
    return NextResponse.json({ message: "你已经订阅过了。" });
  }

  try {
    const subscription = await subscribeToNewsletter({
      email: email.toLowerCase(),
      source
    });

    if (!subscription.configured) {
      return NextResponse.json({
        message:
          "订阅成功。当前为本地演示模式；配置 Supabase / Resend 后可启用真实存储与欢迎邮件。"
      });
    }

    if (subscription.alreadySubscribed) {
      return NextResponse.json({ message: "你已经订阅过了。" });
    }

    return NextResponse.json({
      message: subscription.confirmationSent
        ? "确认邮件已发送，请点击邮件中的链接完成订阅。"
        : "订阅已记录，但确认邮件服务尚未配置。"
    });
  } catch {
    return NextResponse.json(
      { message: "订阅暂时失败，请稍后再试。" },
      { status: 500 }
    );
  }
}
