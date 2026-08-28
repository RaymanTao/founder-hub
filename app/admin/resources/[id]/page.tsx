import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceForm } from "@/app/admin/resources/resource-form";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminResourceById } from "@/lib/admin-resources";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    saved?: string;
    created?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "编辑资源 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminResourceEditPage({ params, searchParams }: Props) {
  await requireAdmin();

  const { id } = await params;
  const resource = await getAdminResourceById(id);
  const query = (await searchParams) ?? {};

  if (!resource) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      {query.saved ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">
          已保存资源。
        </div>
      ) : null}

      {query.created ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(74,106,84,0.2)] bg-[rgba(74,106,84,0.08)] p-4 text-sm text-[var(--success)]">
          已创建资源。
        </div>
      ) : null}

      {query.error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          保存失败，请检查资源信息。
        </div>
      ) : null}

      <ResourceForm resource={resource} />
    </main>
  );
}
