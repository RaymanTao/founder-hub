"use client";

import { useState, type ChangeEventHandler } from "react";

type Props = {
  name?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  required?: boolean;
  minLength?: number;
};

function EyeIcon({ off }: { off: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />{off ? <path d="m4 4 16 16" /> : <circle cx="12" cy="12" r="2.5" />}</svg>;
}

export function PasswordInput({ name, value, onChange, placeholder, required, minLength }: Props) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><input name={name} type={visible ? "text" : "password"} value={value} onChange={onChange} required={required} minLength={minLength} placeholder={placeholder} className="min-h-12 w-full rounded-[10px] border border-[#ded2c3] bg-[#faf8f3] px-4 pr-12 text-sm outline-none focus:border-[var(--accent)]" /><button type="button" aria-label={visible ? "隐藏密码" : "显示密码"} onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8b8178] transition hover:text-[var(--accent)]"><EyeIcon off={!visible} /></button></div>;
}
