"use client";

import { useState } from "react";
import { resetPassword } from "@/app/account/actions";
import { PasswordInput } from "@/components/ui/password-input";

export function PasswordReset() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.56)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]">
        重置密码
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] flex min-h-screen items-center justify-center overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="重置密码" className="relative w-full max-w-[420px] rounded-[1.25rem] border border-white/20 bg-[#F3ECE2] p-6 shadow-2xl sm:p-8">
            <button type="button" aria-label="关闭重置密码弹窗" onClick={() => setOpen(false)} className="absolute right-5 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-xl text-[var(--secondary)]">×</button>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Account</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">重置密码</h2>
            <form action={resetPassword} className="mt-6 grid gap-3">
              <PasswordInput name="currentPassword" required minLength={8} placeholder="当前密码" />
              <PasswordInput name="confirmCurrentPassword" required minLength={8} placeholder="确认当前密码" />
              <PasswordInput name="newPassword" required minLength={8} placeholder="新密码（至少 8 位）" />
              <button type="submit" className="mt-2 min-h-12 w-full rounded-full bg-[var(--foreground)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent)]">确认重置</button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
