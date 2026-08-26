import Link from "next/link";
import { createResourceAction, saveResourceAction } from "@/app/admin/actions";
import type { Resource } from "@/types/resource";

const categoryOptions: Resource["category"][] = [
  "Toolkit",
  "Template",
  "Workflow",
  "Checklist"
];
const statusOptions: Resource["status"][] = ["Free", "Coming Soon"];
const accessOptions: Resource["access"][] = ["Free", "Member"];

function Field({
  label,
  name,
  defaultValue,
  required = true,
  help
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
      />
      {help ? <span className="mt-1 block text-xs text-[var(--muted)]">{help}</span> : null}
    </label>
  );
}

export function ResourceForm({ resource }: { resource?: Resource }) {
  const action = resource ? saveResourceAction : createResourceAction;

  return (
    <form
      action={action}
      className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <div className="grid gap-5">
        <Field label="标题" name="title" defaultValue={resource?.title} />
        <label className="block text-sm font-medium text-[var(--foreground)]">
          描述
          <textarea
            name="description"
            required
            defaultValue={resource?.description}
            rows={4}
            className="mt-2 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            分类
            <select
              name="category"
              defaultValue={resource?.category ?? "Toolkit"}
              className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            状态
            <select
              name="status"
              defaultValue={resource?.status ?? "Free"}
              className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            权限
            <select name="access" defaultValue={resource?.access ?? "Free"} className="mt-2 min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]">
              {accessOptions.map((item) => <option key={item} value={item}>{item === "Member" ? "会员专属" : "免费"}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="格式" name="format" defaultValue={resource?.format} />
          <Field label="链接" name="href" defaultValue={resource?.href} />
        </div>

        <Field label="适合人群" name="audience" defaultValue={resource?.audience} />
        <Field
          label="标签"
          name="tags"
          defaultValue={resource?.tags.join(", ")}
          help="多个标签用英文逗号分隔。"
        />

        <div className="flex flex-wrap gap-5 border-t border-[var(--border)] pt-5">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <input name="featured" type="checkbox" defaultChecked={resource?.featured} />
            在资源页设为重点资源
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <input name="archived" type="checkbox" defaultChecked={resource?.archived} />
            归档隐藏
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            {resource ? "保存资源" : "创建资源"}
          </button>
          <Link
            href="/admin/resources"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            取消
          </Link>
        </div>
      </div>
    </form>
  );
}
