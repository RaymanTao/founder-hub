"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type MediaAssetOption = {
  id: string;
  key: string;
  url: string;
  alt: string | null;
};

type UploadResponse = {
  ok: boolean;
  message?: string;
  upload?: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    contentType: string;
  };
};

export function ArticleCoverField({
  defaultValue,
  mediaAssets
}: {
  defaultValue?: string;
  mediaAssets: MediaAssetOption[];
}) {
  const [cover, setCover] = useState(defaultValue ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const selectedAsset = useMemo(
    () => mediaAssets.find((asset) => asset.url === cover),
    [cover, mediaAssets]
  );

  async function uploadCover() {
    if (!file) return;

    setIsUploading(true);
    setMessage("正在准备上传...");

    try {
      const presignResponse = await fetch("/api/admin/media/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          prefix: "covers"
        })
      });
      const presign = (await presignResponse.json()) as UploadResponse;

      if (!presignResponse.ok || !presign.upload) {
        throw new Error(presign.message || "无法创建上传地址。");
      }

      setMessage("正在上传到 R2...");
      const uploadResponse = await fetch(presign.upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 上传失败：${uploadResponse.status}`);
      }

      setMessage("正在登记媒体资产...");
      const completeResponse = await fetch("/api/admin/media/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: presign.upload.key,
          url: presign.upload.publicUrl,
          contentType: file.type,
          sizeBytes: file.size,
          alt: file.name,
          context: "article-cover"
        })
      });
      const complete = (await completeResponse.json()) as {
        ok: boolean;
        configured?: boolean;
        message?: string;
      };

      if (!completeResponse.ok || !complete.ok) {
        throw new Error(complete.message || "媒体资产登记失败。");
      }

      setCover(presign.upload.publicUrl);
      setFile(null);
      setMessage(
        complete.configured
          ? "封面已上传并填入。"
          : "封面已上传并填入；Supabase 未配置，媒体库不会记录。"
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "封面上传失败。");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <label className="block text-sm font-medium text-[var(--foreground)]">
        封面路径
        <input
          name="cover"
          value={cover}
          onChange={(event) => setCover(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
        />
      </label>

      {cover ? (
        <div className="overflow-hidden rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.58)]">
          <div className="relative aspect-[16/9]">
            <Image
              src={cover}
              alt={selectedAsset?.alt ?? "文章封面预览"}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              unoptimized
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      {mediaAssets.length ? (
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">从媒体库选择</p>
          <div className="mt-2 grid max-h-[260px] gap-3 overflow-y-auto rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.48)] p-3 sm:grid-cols-3">
            {mediaAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setCover(asset.url)}
                className={`overflow-hidden rounded-[0.9rem] border text-left transition ${
                  cover === asset.url
                    ? "border-[var(--accent)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={asset.url}
                    alt={asset.alt ?? asset.key}
                    fill
                    sizes="180px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <span className="block truncate px-2 py-1.5 text-[11px] text-[var(--muted)]">
                  {asset.key}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs leading-6 text-[var(--muted)]">
          媒体库暂无图片。配置 Supabase 和 R2 后，可在这里直接上传或选择封面。
        </p>
      )}

      <div className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-4">
        <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="cover-file">
          上传新封面
        </label>
        <input
          id="cover-file"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm text-[var(--secondary)]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!file || isUploading}
            onClick={uploadCover}
            className="min-h-10 rounded-full bg-[var(--foreground)] px-4 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? "上传中..." : "上传并使用"}
          </button>
          {message ? <p className="text-sm text-[var(--secondary)]">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
