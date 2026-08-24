import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createLoginUrl,
  createReaderLoginToken,
  isReaderAuthConfigured,
  sendReaderLoginEmail
} from "@/lib/reader-auth";

const requestSchema = z.object({
  email: z.email("请输入有效邮箱")
});

export async function POST(request: Request) {
  const payload = await request.json();
  const result = requestSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? "发送失败" },
      { status: 400 }
    );
  }

  if (!isReaderAuthConfigured()) {
    return NextResponse.json(
      { message: "请先配置 AUTH_SECRET，再启用读者登录。" },
      { status: 500 }
    );
  }

  const email = result.data.email.toLowerCase();
  const token = createReaderLoginToken(email);
  const loginUrl = createLoginUrl(token);

  try {
    const sent = await sendReaderLoginEmail(email, loginUrl);

    return NextResponse.json({
      message: sent
        ? "登录链接已发送，请查收邮箱。"
        : "开发模式：邮件未配置，使用返回的登录链接。",
      devLink: sent ? undefined : loginUrl
    });
  } catch {
    return NextResponse.json(
      { message: "登录邮件发送失败，请稍后再试。" },
      { status: 500 }
    );
  }
}
