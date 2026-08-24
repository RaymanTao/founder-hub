import { Metadata } from "next";
import { loginAdmin } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    error?: string;
    setup?: string;
  }>;
};

export const metadata: Metadata = {
  title: "后台登录 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: Props) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = (await searchParams) ?? {};
  const configured = isAdminConfigured();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          登录后台
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
          用环境变量里的后台密码进入文章与资源管理。
        </p>

        {!configured || params.setup ? (
          <div className="mt-5 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm leading-6 text-[var(--danger)]">
            请先在环境变量中设置 ADMIN_PASSWORD，再重启开发服务器。
          </div>
        ) : null}

        {params.error ? (
          <div className="mt-5 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm leading-6 text-[var(--danger)]">
            密码不正确，请重新输入。
          </div>
        ) : null}

        <form action={loginAdmin} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            后台密码
            <input
              name="password"
              type="password"
              required
              className="mt-2 min-h-11 w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={!configured}
            className="min-h-11 w-full rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            进入后台
          </button>
        </form>
      </div>
    </main>
  );
}
