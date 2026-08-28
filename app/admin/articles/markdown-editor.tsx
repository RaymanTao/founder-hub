"use client";

import { useRef, useState, type ChangeEvent } from "react";

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

export function MarkdownEditor({
  name,
  defaultValue = "",
  required = true,
  rows = 24,
  enableDraftChoice = false
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
  enableDraftChoice?: boolean;
}) {
  const [content, setContent] = useState(defaultValue);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManual, setIsManual] = useState(!enableDraftChoice);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function generateDraft() {
    const form = textareaRef.current?.form;
    if (!form) return;

    setIsGenerating(true);
    setMessage("正在根据标题和摘要生成初稿...");
    try {
      const formData = new FormData(form);
      const response = await fetch("/api/admin/articles/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") || ""),
          description: String(formData.get("description") || ""),
          category: String(formData.get("category") || "AI"),
          type: String(formData.get("type") || "Essay"),
          source: String(formData.get("source") || "Founder Hub"),
          sourceUrl: String(formData.get("sourceUrl") || ""),
          tags: String(formData.get("tags") || ""),
          content
        })
      });
      const result = (await response.json()) as { ok: boolean; content?: string; message?: string };
      if (!response.ok || !result.ok || !result.content) {
        throw new Error(result.message || "AI 初稿生成失败。");
      }
      setContent(result.content);
      setMessage("初稿已生成。点击“手动输入”后可以继续修改。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 初稿生成失败。");
    } finally {
      setIsGenerating(false);
    }
  }

  async function uploadAndInsertImage(file: File) {

    setIsUploading(true);
    setMessage("正在准备上传...");

    try {
      const presignResponse = await fetch("/api/admin/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          prefix: "articles"
        })
      });
      const presign = (await presignResponse.json()) as UploadResponse;

      if (!presignResponse.ok || !presign.upload) {
        throw new Error(presign.message || "无法创建上传地址。");
      }

      setMessage("正在上传到 R2...");
      const uploadResponse = await fetch(presign.upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 上传失败：${uploadResponse.status}`);
      }

      const completeResponse = await fetch("/api/admin/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presign.upload.key,
          url: presign.upload.publicUrl,
          contentType: file.type,
          sizeBytes: file.size,
          alt: file.name,
          context: "article-body"
        })
      });
      const complete = (await completeResponse.json()) as { ok: boolean; message?: string };

      if (!completeResponse.ok || !complete.ok) {
        throw new Error(complete.message || "媒体资产登记失败。");
      }

      const alt = file.name.replace(/\.[^/.]+$/, "").replace(/[\[\]]/g, "");
      const imageMarkdown = `![${alt}](${presign.upload.publicUrl})`;
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? content.length;
      const end = textarea?.selectionEnd ?? content.length;
      const nextContent = `${content.slice(0, start)}${start ? "\n" : ""}${imageMarkdown}\n${content.slice(end)}`;

      setContent(nextContent);
      setMessage("图片已上传并插入正文。");
      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        const cursor = start + (start ? 1 : 0) + imageMarkdown.length + 1;
        textarea.setSelectionRange(cursor, cursor);
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片上传失败。");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (selectedFile) {
      void uploadAndInsertImage(selectedFile);
    }
  }

  return (
    <div className="relative mt-2">
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.52)] p-3">
        <label className="inline-flex min-h-10 cursor-pointer items-center rounded-full bg-[var(--foreground)] px-4 text-sm font-medium text-white transition hover:bg-[var(--accent)]">
          {isUploading ? "图片上传中..." : "插入图片"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
        <span className="text-xs text-[var(--muted)]">选择图片后会自动上传到 R2，并插入当前光标位置</span>
        {message ? <span className="basis-full text-xs text-[var(--secondary)]">{message}</span> : null}
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        required={required}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        readOnly={!isManual}
        rows={rows}
        spellCheck={false}
        className="w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.82)] px-4 py-3 font-mono text-sm leading-7 outline-none transition focus:border-[var(--accent)]"
      />
      {enableDraftChoice && !isManual ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1rem] bg-black/[0.35] p-5">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void generateDraft()}
              disabled={isGenerating}
              className="min-h-10 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
            >
              {isGenerating ? "生成中..." : "AI 生成初稿"}
            </button>
            <button
              type="button"
              onClick={() => { setIsManual(true); setMessage(""); }}
              disabled={isGenerating}
              className="min-h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-60"
            >
              手动输入
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
