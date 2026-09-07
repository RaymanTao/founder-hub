"use client";

import Image from "next/image";
import { useState } from "react";

type UploadResponse = {
  ok: boolean;
  message?: string;
  upload?: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
  };
};

export function ResourceCoverField({ defaultValue }: { defaultValue?: string }) {
  const [cover, setCover] = useState(defaultValue ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadCover() {
    if (!file) return;
    setUploading(true);
    setMessage("正在上传封面...");

    try {
      const presignResponse = await fetch("/api/admin/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, prefix: "resource-covers" })
      });
      const presign = (await presignResponse.json()) as UploadResponse;
      if (!presignResponse.ok || !presign.upload) {
        throw new Error(presign.message || "无法创建上传地址。");
      }

      const uploadResponse = await fetch(presign.upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!uploadResponse.ok) throw new Error(`封面上传失败：${uploadResponse.status}`);

      const completeResponse = await fetch("/api/admin/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presign.upload.key,
          url: presign.upload.publicUrl,
          contentType: file.type,
          sizeBytes: file.size,
          alt: file.name,
          context: "resource-cover"
        })
      });
      const complete = (await completeResponse.json()) as { ok: boolean; message?: string };
      if (!completeResponse.ok || !complete.ok) throw new Error(complete.message || "封面登记失败。");

      setCover(presign.upload.publicUrl);
      setFile(null);
      setMessage("封面已上传并填入。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "封面上传失败。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="cover" value={cover} />
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">封面图片</p>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">可选。上传后会展示在前端资源列表和资源详情页。</p>
      </div>
      {cover ? (
        <div className="relative aspect-[16/8] overflow-hidden rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.58)]">
          <Image src={cover} alt="资源封面预览" fill unoptimized className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      ) : null}
      <div className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-4">
        <label htmlFor="resource-cover-file" className="text-sm font-medium text-[var(--foreground)]">上传新封面</label>
        <input id="resource-cover-file" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm text-[var(--secondary)]" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={!file || uploading} onClick={uploadCover} className="min-h-11 rounded-full bg-[var(--foreground)] px-4 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? "上传中..." : "上传并使用"}
          </button>
          {message ? <p className="text-sm text-[var(--secondary)]" aria-live="polite">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
