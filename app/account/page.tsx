import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateAccount } from "@/app/account/actions";
import { AvatarField } from "@/app/account/avatar-field";
import { ProfileRefresh } from "@/app/account/profile-refresh";
import { PasswordReset } from "@/app/account/password-reset";
import { listFavorites } from "@/lib/favorites";
import { getReaderEmail } from "@/lib/reader-auth";
import { getReaderProfile } from "@/lib/profiles";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的账号 | Founder Hub"
};

type Props = { searchParams?: Promise<{ saved?: string; error?: string; password?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const email = await getReaderEmail();

  if (!email) {
    redirect("/");
  }

  const favorites = await listFavorites(email);
  const profile = await getReaderProfile(email);
  const params = (await searchParams) ?? {};

  return (
    <main className="mx-auto max-w-[760px] px-4 py-16 sm:px-6 lg:px-8">
      <ProfileRefresh />
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Account
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          我的账号
        </h1>
        {params.saved ? <p className="mt-4 rounded-xl bg-[rgba(74,106,84,0.08)] p-3 text-sm text-[var(--success)]">资料已保存。</p> : null}
        {params.password ? <p className="mt-4 rounded-xl bg-[rgba(74,106,84,0.08)] p-3 text-sm text-[var(--success)]">密码已更新。</p> : null}
        {params.error === "password" ? <p className="mt-4 rounded-xl bg-[rgba(143,78,69,0.08)] p-3 text-sm text-[var(--danger)]">密码修改失败，请检查当前密码和新密码。</p> : null}
        <form id="profile-form" action={updateAccount} className="mt-7 grid gap-4 border-t border-[var(--border)] pt-7">
          <AvatarField defaultValue={profile.avatar_url} displayName={profile.display_name} />
          <label className="block text-sm font-medium text-[var(--foreground)]">名称<input name="displayName" defaultValue={profile.display_name} required className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-medium text-[var(--foreground)]">邮箱<input value={email} readOnly className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.42)] px-4 text-[var(--muted)] outline-none" /></label>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" form="profile-form" className="min-h-11 w-fit rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]">保存资料</button>
          {profile.provider === "email" ? <PasswordReset /> : null}
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Link
            href="/"
            className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.56)] p-5 transition hover:border-[var(--accent)]"
          >
            <h2 className="text-xl font-semibold text-[var(--foreground)]">继续阅读</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
              回到内容库，浏览最新文章和深度解读。
            </p>
          </Link>
          <Link
            href="/resources"
            className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.56)] p-5 transition hover:border-[var(--accent)]"
          >
            <h2 className="text-xl font-semibold text-[var(--foreground)]">领取资源</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
              查看工具清单、模板和工作流资源。
            </p>
          </Link>
        </div>
        <section className="mt-8 border-t border-[var(--border)] pt-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              我的收藏
            </h2>
            <Link
              href="/"
              className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              去内容库
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {favorites.map((favorite) => (
              <Link
                key={favorite.id}
                href={`/writing/${favorite.article_slug}`}
                className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.52)] p-4 transition hover:border-[var(--accent)]"
              >
                <h3 className="font-semibold text-[var(--foreground)]">
                  {favorite.article_title}
                </h3>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  收藏于 {formatDate(favorite.created_at)}
                </p>
              </Link>
            ))}
            {!favorites.length ? (
              <div className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.52)] p-4 text-sm leading-6 text-[var(--secondary)]">
                暂时还没有收藏文章。配置 Supabase 后，收藏会在这里持久保存。
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
