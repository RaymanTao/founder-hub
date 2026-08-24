import Link from "next/link";
import { ResourceClaimForm } from "@/components/forms/resource-claim-form";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { resources } from "@/data/resources";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "资源",
  description: "Founder Hub 资源页，整理 AI 创业、一人公司和自动化相关模板与工具。",
  path: "/resources"
});

export default function ResourcesPage() {
  const featured = resources.filter((resource) => resource.featured);
  const rest = resources.filter((resource) => !resource.featured);

  return (
    <Section>
      <div className="max-w-3xl">
        <SectionHeader
          eyebrow="Resources"
          title="给 AI 创业者的工具、模板和工作流"
          description="把文章里的方法沉淀成可复用资源，优先服务一人公司、独立开发者和小团队。"
        />
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {featured.map((resource) => (
          <article
            key={resource.id}
            className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[rgba(138,106,82,0.32)]"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>{resource.category}</span>
              <span>/</span>
              <span>{resource.status}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {resource.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
              {resource.description}
            </p>
            <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--secondary)]">
              <p>格式：{resource.format}</p>
              <p>适合：{resource.audience}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
            {resource.status === "Free" ? (
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <ResourceClaimForm resourceId={resource.id} />
              </div>
            ) : (
              <p className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)]">
                即将开放。
              </p>
            )}
          </article>
        ))}
      </div>

      {rest.length ? (
        <div className="mt-8 grid gap-4">
          {rest.map((resource) => (
            <article
              key={resource.id}
              className="flex flex-col justify-between gap-4 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-5 transition hover:border-[rgba(138,106,82,0.32)] sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {resource.category} / {resource.status}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {resource.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--secondary)]">
                  {resource.description}
                </p>
              </div>
              <div className="min-w-[260px]">
                {resource.status === "Free" ? (
                  <ResourceClaimForm resourceId={resource.id} />
                ) : (
                  <span className="text-sm text-[var(--muted)]">即将开放</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Section>
  );
}
