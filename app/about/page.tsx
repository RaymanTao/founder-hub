import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { aboutData } from "@/data/about";
import { projects } from "@/data/projects";
import { createMetadata } from "@/lib/seo";
import { zhCN } from "@/locale/zh-cn";

export const metadata = createMetadata({
  title: zhCN.about.metadataTitle,
  description: zhCN.about.metadataDescription,
  path: "/about"
});

export default function AboutPage() {
  return (
    <>
      <Section>
        <SectionHeader
          eyebrow={zhCN.about.heroEyebrow}
          title={zhCN.about.heroTitle}
          description={aboutData.story}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Block title={zhCN.about.mission} content={aboutData.mission} />
          <Block title={zhCN.about.philosophy} content={aboutData.philosophy} />
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <ListBlock title={zhCN.about.currentFocus} items={aboutData.currentFocus} />
          <ListBlock title={zhCN.about.skills} items={aboutData.skills} />
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ListBlock title={zhCN.about.timeline} items={aboutData.timeline} />
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[6px]">
            <h2 className="text-2xl font-semibold tracking-tight">{zhCN.about.projects}</h2>
            <div className="mt-5 space-y-4">
              {projects.map((project) => (
                <div
                  key={project.slug}
                  className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.52)] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium text-[var(--foreground)]">
                      {project.name}
                    </h3>
                    <span className="text-sm text-[var(--muted)]">
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                    {project.summary}
                  </p>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  >
                    {zhCN.projects.viewDetail}
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ButtonLink href="/contact">{zhCN.about.cta}</ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Block({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[6px]">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">{content}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-alt)] p-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--secondary)]">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
