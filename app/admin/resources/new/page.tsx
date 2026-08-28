import { Metadata } from "next";
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
      {params.error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(143,78,69,0.2)] bg-[rgba(143,78,69,0.07)] p-4 text-sm text-[var(--danger)]">
          请填写完整资源信息。
        </div>
      ) : null}

      <div className="mt-0"><ResourceForm /></div>
    </main>
  );
}
