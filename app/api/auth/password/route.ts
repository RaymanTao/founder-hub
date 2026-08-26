import { NextResponse } from "next/server";
import { z } from "zod";
import { setReaderSession } from "@/lib/reader-auth";
import { isSupabaseAuthConfigured, supabaseAuthFetch } from "@/lib/supabase-auth";

const schema = z.object({
  mode: z.enum(["login", "register"]),
  email: z.email("请输入有效邮箱"),
  password: z.string().min(8, "密码至少需要 8 位")
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "请检查输入" }, { status: 400 });
  if (!isSupabaseAuthConfigured()) return NextResponse.json({ message: "请先配置 Supabase Auth 环境变量。" }, { status: 500 });

  const { mode, email, password } = parsed.data;
  const response = await supabaseAuthFetch(mode === "login" ? "token?grant_type=password" : "signup", {
    method: "POST",
    body: JSON.stringify({ email: email.toLowerCase(), password })
  });
  const payload = (await response.json()) as { msg?: string; error_description?: string; user?: { email?: string }; session?: { user?: { email?: string } } };

  if (!response.ok) return NextResponse.json({ message: payload.error_description || payload.msg || (mode === "login" ? "邮箱或密码不正确。" : "注册失败，请稍后再试。") }, { status: response.status });

  const resolvedEmail = payload.user?.email || payload.session?.user?.email || email.toLowerCase();
  if (mode === "login") await setReaderSession(resolvedEmail);
  return NextResponse.json({ ok: true, needsEmailConfirmation: mode === "register" && !payload.session, email: resolvedEmail, message: mode === "login" ? "登录成功。" : payload.session ? "注册成功，已自动登录。" : "注册成功，请查收邮箱完成验证。" });
}
