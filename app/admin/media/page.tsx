import { Metadata } from "next";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-auth";
import { listMediaAssets } from "@/lib/media-assets";
import { isR2Configured } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { MediaUploadForm } from "./media-upload-form";

export const metadata: Metadata = {
  title: "媒体库 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireAdmin();

  const mediaAssets = await listMediaAssets();
  const r2Configured = isR2Configured();
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["R2 存储", r2Configured ? "已配置" : "未配置"],
          ["Supabase 记录", supabaseConfigured ? "已配置" : "未配置"],
          ["媒体资产", mediaAssets.length]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      {!r2Configured ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(154,106,51,0.2)] bg-[rgba(154,106,51,0.08)] p-4 text-sm leading-7 text-[var(--warning)]">
          请先配置 Cloudflare R2 环境变量。上传前还需要在 R2 bucket 上允许本站域名发起 PUT 请求。
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          上传图片
        </h2>
        <div className="mt-5">
          <MediaUploadForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          最近上传
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mediaAssets.map((asset) => (
            <a
              key={asset.id}
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] transition hover:border-[var(--accent)]"
            >
              <div className="relative aspect-[16/10] bg-[rgba(255,255,255,0.56)]">
                <Image
                  src={asset.url}
                  alt={asset.alt ?? asset.key}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="break-all text-sm font-medium text-[var(--foreground)]">
                  {asset.key}
                </p>
                <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                  {asset.content_type} / {asset.size_bytes ?? 0} bytes /{" "}
                  {formatDate(asset.created_at)}
                </p>
              </div>
            </a>
          ))}
          {!mediaAssets.length ? (
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-6 text-sm text-[var(--secondary)]">
              暂时还没有媒体资产。上传第一张封面后，这里会显示最近记录。
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
