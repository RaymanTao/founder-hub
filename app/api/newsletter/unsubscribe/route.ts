import { NextResponse } from "next/server";
import { unsubscribeNewsletter } from "@/lib/newsletter";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    const result = await unsubscribeNewsletter(token);
    const title = result === "unsubscribed" ? "已取消订阅" : "链接无效或已过期";
    const message = result === "unsubscribed" ? "你将不会再收到 Founder Hub 的订阅更新。" : "请联系站点管理员处理。";
    return new NextResponse(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;background:#f3ece2;color:#211c18;padding:48px"><main style="max-width:560px;margin:10vh auto;background:#fffaf4;border:1px solid #ded2c3;border-radius:20px;padding:32px"><h1>${title}</h1><p>${message}</p><a href="/" style="color:#ee4f34">返回首页</a></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return NextResponse.json({ message: "取消订阅失败，请稍后重试。" }, { status: 500 });
  }
}
