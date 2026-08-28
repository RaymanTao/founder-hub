import { NextResponse } from "next/server";
import { confirmNewsletterSubscription } from "@/lib/newsletter";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    const result = await confirmNewsletterSubscription(token);
    const title = result === "confirmed" ? "订阅已确认" : "链接无效或已过期";
    const message = result === "confirmed" ? "感谢订阅 Founder Hub，之后你会收到最新资讯。" : "请重新提交邮箱获取新的确认邮件。";
    return new NextResponse(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;background:#f3ece2;color:#211c18;padding:48px"><main style="max-width:560px;margin:10vh auto;background:#fffaf4;border:1px solid #ded2c3;border-radius:20px;padding:32px"><h1>${title}</h1><p>${message}</p><a href="/" style="color:#ee4f34">返回首页</a></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return NextResponse.json({ message: "订阅确认失败，请稍后重试。" }, { status: 500 });
  }
}
