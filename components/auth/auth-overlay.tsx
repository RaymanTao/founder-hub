"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PasswordInput } from "@/components/ui/password-input";

type Mode = "login" | "register" | "forgot";

export function AuthOverlay({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mobile && new URLSearchParams(window.location.search).get("auth") === "login") {
      window.history.replaceState({}, "", window.location.pathname);
      const timer = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [mobile]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode); setCodeSent(false); setCooldown(0); setVerificationCode(""); setMessage(""); setError("");
  }

  async function sendVerificationCode() {
    if (!email || cooldown > 0) return;
    setLoading(true); setMessage(""); setError("");
    try {
      const codeMode = mode === "forgot" ? "send-reset-code" : "send-register-code";
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: codeMode, email }) });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "验证码发送失败，请稍后再试。");
      setCodeSent(true); setCooldown(60); setMessage(result.message || "验证码已发送，请查收邮箱。");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "验证码发送失败，请稍后再试。"); }
    finally { setLoading(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("");
    try {
      if ((mode === "register" || mode === "forgot") && !codeSent) throw new Error("请先发送并填写邮箱验证码。");
      const requestMode = mode === "forgot" ? "reset-password" : mode;
      const body = { mode: requestMode, email, password, ...(mode !== "login" ? { token: verificationCode } : {}) };
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as { message?: string; email?: string; profile?: { display_name: string; avatar_url: string | null } | null };
      if (!response.ok) throw new Error(result.message || "操作失败，请稍后再试。");
      if (mode === "forgot") {
        setMode("login"); setPassword(""); setVerificationCode(""); setCodeSent(false); setMessage("密码已更新，请使用新密码登录。"); return;
      }
      setMessage(result.message || "操作成功。");
      window.dispatchEvent(new CustomEvent("founder-hub-auth-changed", { detail: { email: result.email || email.toLowerCase(), profile: result.profile ?? null } }));
      setOpen(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "操作失败，请稍后再试。"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={mobile ? "rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 py-3 text-sm font-medium text-[var(--foreground)]" : "inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"}>{mobile ? "登录 / 注册" : "登录"}</button>
      {open && typeof document !== "undefined" ? createPortal(<div className="fixed inset-0 z-[70] flex min-h-screen items-center justify-center overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-[3px] sm:py-14" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="登录或注册" className="relative w-full max-w-[420px] rounded-[1.25rem] border border-white/20 bg-[#F3ECE2] p-6 shadow-2xl sm:p-8">
          <button type="button" aria-label="关闭登录弹窗" onClick={() => setOpen(false)} className="absolute right-5 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-xl text-[var(--secondary)]">×</button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ee4f34]">Account</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1d1815]">{mode === "login" ? "登录" : mode === "register" ? "注册免费账号" : "忘记密码"}</h2>
          {mode === "register" ? <div className="mt-4 rounded-xl border border-[#9bcab4] bg-[#eef8f1] px-4 py-3 text-sm leading-6 text-[#3b8060]">✓ 免费账号可收藏文章<br />✓ 阅读进度会同步保存</div> : null}
          {mode !== "forgot" ? <><a href="/api/auth/google" className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-[#ee4f34] px-5 text-sm font-bold !text-white transition hover:bg-[#d83f27] hover:!text-white visited:!text-white">用 Google 账号登录</a><div className="my-6 flex items-center gap-3 text-xs text-[#9b9187]"><span className="h-px flex-1 bg-[#ded2c3]" />或用邮箱<span className="h-px flex-1 bg-[#ded2c3]" /></div></> : null}
          <form onSubmit={submit} className={mode === "forgot" ? "mt-7 space-y-4" : "space-y-3"}>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="你的邮箱" className="min-h-12 w-full rounded-[10px] border border-[#ded2c3] bg-[#faf8f3] px-4 text-sm outline-none focus:border-[#ee4f34]" />
            {(mode === "register" || mode === "forgot") ? <div className="flex gap-2"><input type="text" required={codeSent} inputMode="numeric" pattern="[0-9]{6,8}" maxLength={8} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="输入验证码" className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-[#ded2c3] bg-[#faf8f3] px-4 text-sm outline-none focus:border-[#ee4f34]" /><button type="button" disabled={loading || cooldown > 0 || !email} onClick={() => void sendVerificationCode()} className="min-h-12 shrink-0 rounded-[10px] border border-[#ded2c3] bg-white px-3 text-sm font-semibold text-[#4b443d] transition hover:border-[#ee4f34] disabled:opacity-60">{cooldown > 0 ? `${cooldown}s 后重发` : "发送验证码"}</button></div> : null}
            <PasswordInput required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "密码" : mode === "forgot" ? "新密码（至少 8 位）" : "设置密码（至少 8 位）"} />
            <button disabled={loading} className="min-h-12 w-full rounded-full border border-[#ded2c3] bg-white px-5 text-sm font-semibold text-[#4b443d] transition hover:border-[#ee4f34] disabled:opacity-60">{loading ? "处理中..." : mode === "login" ? "登录" : mode === "forgot" ? "确认修改密码" : "创建免费账号"}</button>
          </form>
          {mode === "login" ? <div className="mt-2 text-right"><button type="button" onClick={() => switchMode("forgot")} className="text-sm font-semibold text-[#ee4f34]">忘记密码 →</button></div> : null}
          {message ? <p className="mt-4 rounded-xl bg-[#eef8f1] p-3 text-sm leading-6 text-[#3b8060]">{message}</p> : null}{error ? <p className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm leading-6 text-[#b33d2a]">{error}</p> : null}
          <p className="mt-6 border-t border-[#ded2c3] pt-4 text-center text-sm text-[#8b8178]">{mode === "login" ? "还没有账号？" : mode === "forgot" ? "想起密码了？" : "已经有账号？"}<button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")} className="ml-1 font-semibold text-[#ee4f34]">{mode === "login" ? "免费注册 →" : "返回登录 →"}</button></p>
        </section>
      </div>, document.body) : null}
    </>
  );
}
