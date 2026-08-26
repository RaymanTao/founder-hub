"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Mode = "login" | "register";

export function AuthOverlay({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open]);

  function switchMode(nextMode: Mode) { setMode(nextMode); setMessage(""); setError(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, email, password }) });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "操作失败，请稍后再试。");
      setMessage(result.message || "操作成功。");
      if (mode === "login") window.location.reload();
      else setPassword("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "操作失败，请稍后再试。"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={mobile ? "rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 py-3 text-sm font-medium text-[var(--foreground)]" : "inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"}>{mobile ? "登录 / 注册" : "登录"}</button>
      {open && typeof document !== "undefined" ? createPortal(<div className="fixed inset-0 z-[70] flex min-h-screen items-center justify-center overflow-y-auto bg-black/85 px-4 py-8 backdrop-blur-[3px] sm:py-14" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="登录或注册" className="relative w-full max-w-[420px] rounded-[1.25rem] border border-white/20 bg-[#fffdf8] p-6 shadow-2xl sm:p-8">
          <button type="button" aria-label="关闭登录弹窗" onClick={() => setOpen(false)} className="absolute right-5 top-4 text-2xl text-[#8b8178]">×</button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ee4f34]">Account</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1d1815]">{mode === "login" ? "登录" : "注册免费账号"}</h2>
          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-[10px] border border-[#ded2c3]"><button type="button" onClick={() => switchMode("login")} className={`min-h-10 text-sm font-semibold ${mode === "login" ? "bg-[#1d1a17] text-white" : "bg-white text-[#8b8178]"}`}>登录</button><button type="button" onClick={() => switchMode("register")} className={`min-h-10 text-sm font-semibold ${mode === "register" ? "bg-[#1d1a17] text-white" : "bg-white text-[#8b8178]"}`}>注册（免费）</button></div>
          {mode === "register" ? <div className="mt-4 rounded-xl border border-[#9bcab4] bg-[#eef8f1] px-4 py-3 text-sm leading-6 text-[#3b8060]">✓ 免费账号可收藏文章<br />✓ 阅读进度会同步保存</div> : null}
          <a href="/api/auth/google" className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-[#ee4f34] px-5 text-sm font-bold text-white transition hover:bg-[#d83f27]">用 Google 账号登录</a>
          <div className="my-6 flex items-center gap-3 text-xs text-[#9b9187]"><span className="h-px flex-1 bg-[#ded2c3]" />或用邮箱<span className="h-px flex-1 bg-[#ded2c3]" /></div>
          <form onSubmit={submit} className="space-y-3"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="你的邮箱" className="min-h-12 w-full rounded-[10px] border border-[#ded2c3] bg-[#faf8f3] px-4 text-sm outline-none focus:border-[#ee4f34]" /><input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "密码" : "设置密码（至少 8 位）"} className="min-h-12 w-full rounded-[10px] border border-[#ded2c3] bg-[#faf8f3] px-4 text-sm outline-none focus:border-[#ee4f34]" /><button disabled={loading} className="min-h-12 w-full rounded-full border border-[#ded2c3] bg-white px-5 text-sm font-semibold text-[#4b443d] transition hover:border-[#ee4f34] disabled:opacity-60">{loading ? "处理中..." : mode === "login" ? "登录" : "创建免费账号"}</button></form>
          {message ? <p className="mt-4 rounded-xl bg-[#eef8f1] p-3 text-sm leading-6 text-[#3b8060]">{message}</p> : null}{error ? <p className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm leading-6 text-[#b33d2a]">{error}</p> : null}
          <p className="mt-6 border-t border-[#ded2c3] pt-4 text-center text-sm text-[#8b8178]">{mode === "login" ? "还没有账号？" : "已经有账号？"}<button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")} className="ml-1 font-semibold text-[#ee4f34]">{mode === "login" ? "免费注册 →" : "直接登录 →"}</button></p>
        </section>
      </div>, document.body) : null}
    </>
  );
}
