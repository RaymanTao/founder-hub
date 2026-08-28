"use client";

import { useState, type ChangeEvent } from "react";

type Props = { defaultValue?: string | null; displayName: string };

export function AvatarField({ defaultValue, displayName }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(defaultValue ?? "");
  const [displayUrl, setDisplayUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setMessage("请选择 5MB 以内的图片。");
      return;
    }

    setUploading(true);
    setMessage("正在上传头像...");
    const previousUrl = avatarUrl;
    const previewUrl = URL.createObjectURL(file);
    setDisplayUrl(previewUrl);
    try {
      const presignResponse = await fetch("/api/account/avatar/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      const presign = (await presignResponse.json()) as { ok: boolean; message?: string; upload?: { uploadUrl: string; publicUrl: string; key: string } };
      if (!presignResponse.ok || !presign.upload) throw new Error(presign.message || "无法创建上传地址。");

      const uploadResponse = await fetch(presign.upload.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadResponse.ok) throw new Error(`头像上传失败：${uploadResponse.status}`);

      const completeResponse = await fetch("/api/account/avatar/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: presign.upload.key, url: presign.upload.publicUrl, contentType: file.type, sizeBytes: file.size, alt: displayName })
      });
      const complete = (await completeResponse.json()) as { ok: boolean; message?: string };
      if (!completeResponse.ok || !complete.ok) throw new Error(complete.message || "头像登记失败。");

      setAvatarUrl(presign.upload.publicUrl);
      setDisplayUrl(previewUrl);
      window.dispatchEvent(new CustomEvent("founder-hub-profile-changed", { detail: { avatarUrl: previewUrl } }));
      setMessage("头像已更新。");
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      setAvatarUrl(previousUrl);
      setDisplayUrl(previousUrl);
      setMessage(error instanceof Error ? error.message : "头像上传失败。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <label className="group relative block h-16 w-16 cursor-pointer overflow-hidden rounded-full bg-[var(--foreground)] text-xl text-white">
        {displayUrl ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${displayUrl})` }} /> : <span className="flex h-full items-center justify-center">{displayName.slice(0, 1).toUpperCase()}</span>}
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs opacity-0 transition group-hover:opacity-100">{uploading ? "上传中" : "更换"}</span>
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <input type="file" accept="image/*" disabled={uploading} onChange={handleChange} className="sr-only" />
      </label>
      <div><p className="font-medium text-[var(--foreground)]">{displayName}</p><p className="mt-1 text-xs text-[var(--muted)]">点击头像更换</p>{message ? <p className="mt-1 text-xs text-[var(--secondary)]">{message}</p> : null}</div>
    </div>
  );
}
