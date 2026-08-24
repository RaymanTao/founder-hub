"use client";

import { useState } from "react";

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

export function MediaUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setMessage("正在准备上传...");
    setPublicUrl("");

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
          alt,
          sourceUrl,
          context: "admin-upload"
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

      setPublicUrl(presign.upload.publicUrl);
      setMessage(
        complete.configured
          ? "上传完成，已写入 Supabase 媒体库。"
          : "上传完成。Supabase 未配置，当前没有登记数据库记录。"
      );
      setFile(null);
      setAlt("");
      setSourceUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5"
    >
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="media">
          选择图片
        </label>
        <input
          id="media"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm text-[var(--secondary)]"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="图片说明 / alt"
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        />
        <input
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="来源 URL，可选"
          className="min-h-11 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!file || isUploading}
          className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "上传中..." : "上传到 R2"}
        </button>
        {message ? <p className="text-sm text-[var(--secondary)]">{message}</p> : null}
      </div>
      {publicUrl ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
        >
          {publicUrl}
        </a>
      ) : null}
    </form>
  );
}
