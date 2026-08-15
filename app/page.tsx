import { ProjectCard } from "@/components/cards/project-card";
import { HomeHero } from "@/components/sections/home-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { aboutData } from "@/data/about";
import { projects } from "@/data/projects";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "首页",
  description: "Founder Hub 个人落地页，聚焦 AI 产品、自动化与一人公司实验。"
});

export default function HomePage() {
  const featuredProjects = projects.filter((item) => item.featured).slice(0, 2);

  return (
    <>
      <HomeHero />

      <Section className="py-12 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              About
            </p>
            <h2 className="mt-4 max-w-sm font-display text-3xl leading-tight text-[var(--foreground)]">
              用产品、内容与自动化，搭建长期可复用的个人系统
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">
              {aboutData.story}
            </p>
            <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-sm leading-7 text-[var(--secondary)]">
              {aboutData.currentFocus.slice(0, 3).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <div className="mt-6">
              <ButtonLink href="/about" variant="secondary">
                了解更多
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Selected Work
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  代表项目
                </h2>
              </div>
              <ButtonLink href="/projects" variant="ghost">
                查看全部
              </ButtonLink>
            </div>
            <div className="mt-6 grid gap-5">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-12 sm:pt-14">
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-7 shadow-[var(--shadow-soft)] backdrop-blur-[8px] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Contact
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">
            如果你正在构建 AI 产品，可以一起把它推进到可上线状态。
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--secondary)]">
            适合需要咨询、AI 产品策略、自动化方案、Skill 开发、自媒体支持或 MVP 实现的独立开发者与小团队。
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {["咨询", "AI 产品策略", "Skill 开发", "自媒体"].map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-[rgba(138,106,82,0.12)] bg-[rgba(255,252,247,0.72)] px-3 py-1 text-xs font-medium text-[var(--secondary)]"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact">发起合作咨询</ButtonLink>
            <ButtonLink href="/services" variant="secondary">
              查看服务
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
