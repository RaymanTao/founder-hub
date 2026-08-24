import { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getReaderEmail } from "@/lib/reader-auth";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "登录 | Founder Hub"
};

export default async function LoginPage({ searchParams }: Props) {
  const email = await getReaderEmail();

  if (email) {
    redirect("/account");
  }

  const params = (await searchParams) ?? {};

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Reader
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          登录 Founder Hub
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
          输入邮箱获取登录链接。后续收藏、资源领取和会员权益都会绑定到这个邮箱。
        </p>
        {params.error ? (
          <div className="mt-5 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
            登录链接无效或已过期，请重新获取。
          </div>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
