import { Metadata } from "next";
import Link from "next/link";
import { ResourceForm } from "@/app/admin/resources/resource-form";
import { requireAdmin } from "@/lib/admin-auth";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "新建资源 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminNewResourcePage({ searchParams }: Props) {
  await requireAdmin();
  const params = (await searchParams) ?? {};

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[var(--border)] pb-8">
        <Link
          href="/admin/resources"
          className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
        >
          返回资源管理
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          新建资源
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
          创建后会写入当前资源内容源，并显示在前台资源页。
        </p>
      </div>

      {params.error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          请填写完整资源信息。
        </div>
      ) : null}

      <ResourceForm />
    </main>
  );
}
