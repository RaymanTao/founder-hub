import { NextResponse } from "next/server";
import { z } from "zod";
import { setReaderSession } from "@/lib/reader-auth";
import { profileDefaults, syncReaderProfileFromAuthUser } from "@/lib/profiles";
import { getSupabaseAuthConfig, isSupabaseAuthConfigured, supabaseAuthFetch } from "@/lib/supabase-auth";

const schema = z.object({
  mode: z.enum(["login", "register", "send-register-code", "send-reset-code", "reset-password"]),
  email: z.email("请输入有效邮箱").optional(),
  password: z.string().min(8, "密码至少需要 8 位").optional(),
  token: z.string().regex(/^\d{6,8}$/, "请输入 6-8 位验证码").optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "请检查输入" }, { status: 400 });
  if (!isSupabaseAuthConfigured()) return NextResponse.json({ message: "请先配置 Supabase Auth 环境变量。" }, { status: 500 });

  const { mode, email, password, token } = parsed.data;
  if (!email) return NextResponse.json({ message: "请输入邮箱地址。" }, { status: 400 });

  if (mode === "send-register-code") {
    const response = await supabaseAuthFetch("otp", {
      method: "POST",
      body: JSON.stringify({ email: email.toLowerCase(), create_user: true })
    });
    const payload = (await response.json()) as { msg?: string; error_description?: string };
    if (!response.ok) return NextResponse.json({ message: payload.error_description || payload.msg || "验证码发送失败，请稍后再试。" }, { status: response.status });
    return NextResponse.json({ ok: true, message: "验证码已发送，请查收邮箱。" });
  }

  if (mode === "send-reset-code") {
    const response = await supabaseAuthFetch("recover", {
      method: "POST",
      body: JSON.stringify({ email: email.toLowerCase() })
    });
    const payload = (await response.json()) as { msg?: string; error_description?: string };
    if (!response.ok) return NextResponse.json({ message: payload.error_description || payload.msg || "验证码发送失败，请稍后再试。" }, { status: response.status });
    return NextResponse.json({ ok: true, message: "验证码已发送，请查收邮箱。" });
  }

  if (mode === "reset-password") {
    if (!token) return NextResponse.json({ message: "请输入邮箱验证码。" }, { status: 400 });
    if (!password) return NextResponse.json({ message: "请输入新密码。" }, { status: 400 });
    const response = await supabaseAuthFetch("verify", {
      method: "POST",
      body: JSON.stringify({ email: email.toLowerCase(), token, type: "recovery" })
    });
    const payload = (await response.json()) as { msg?: string; error_description?: string; access_token?: string };
    if (!response.ok || !payload.access_token) return NextResponse.json({ message: payload.error_description || payload.msg || "验证码不正确或已过期。" }, { status: response.status || 400 });
    const config = getSupabaseAuthConfig();
    const passwordResponse = await fetch(`${config.url}/auth/v1/user`, {
      method: "PUT",
      headers: { apikey: config.anonKey, Authorization: `Bearer ${payload.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!passwordResponse.ok) return NextResponse.json({ message: "验证码已验证，但密码修改失败，请稍后重试。" }, { status: 502 });
    return NextResponse.json({ ok: true, message: "密码已更新，请重新登录。" });
  }

  if (mode === "register" && token) {
    if (!token) return NextResponse.json({ message: "请输入 6 位验证码。" }, { status: 400 });
    const response = await supabaseAuthFetch("verify", {
      method: "POST",
      body: JSON.stringify({ email: email.toLowerCase(), token, type: "email" })
    });
    const payload = (await response.json()) as { msg?: string; error_description?: string; access_token?: string; user?: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: { provider?: string } } };
    if (!response.ok) return NextResponse.json({ message: payload.error_description || payload.msg || "验证码不正确或已过期。" }, { status: response.status });
    if (!password || !payload.access_token) return NextResponse.json({ message: "请输入密码。" }, { status: 400 });
    const config = getSupabaseAuthConfig();
    const passwordResponse = await fetch(`${config.url}/auth/v1/user`, {
      method: "PUT",
      headers: { apikey: config.anonKey, Authorization: `Bearer ${payload.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!passwordResponse.ok) return NextResponse.json({ message: "验证码已验证，但密码设置失败，请稍后重试。" }, { status: 502 });
    const resolvedEmail = payload.user?.email || email.toLowerCase();
    await setReaderSession(resolvedEmail);
    void syncReaderProfileFromAuthUser(payload.user ?? { email: resolvedEmail });
    return NextResponse.json({ ok: true, email: resolvedEmail, profile: profileDefaults({ email: resolvedEmail }), message: "邮箱验证成功，已登录。" });
  }

  if (mode === "register") {
    return NextResponse.json({ message: "请输入邮箱验证码。" }, { status: 400 });
  }

  if (!password) return NextResponse.json({ message: "请输入密码。" }, { status: 400 });
  const response = await supabaseAuthFetch("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email.toLowerCase(), password })
  });
  const payload = (await response.json()) as { msg?: string; error_description?: string; user?: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: { provider?: string } }; session?: { user?: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: { provider?: string } } } };

  if (!response.ok) return NextResponse.json({ message: payload.error_description || payload.msg || (mode === "login" ? "邮箱或密码不正确。" : "注册失败，请稍后再试。") }, { status: response.status });

  const resolvedEmail = payload.user?.email || payload.session?.user?.email || email.toLowerCase();
  if (mode === "login") {
    await setReaderSession(resolvedEmail);
    void syncReaderProfileFromAuthUser(payload.user ?? payload.session?.user ?? { email: resolvedEmail });
    return NextResponse.json({ ok: true, email: resolvedEmail, profile: profileDefaults({ email: resolvedEmail }), message: "登录成功。" });
  }
  return NextResponse.json({ ok: true, email: resolvedEmail, message: "登录成功。" });
}
