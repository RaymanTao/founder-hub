import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { heroTags } from "@/data/site";

export function HomeHero() {
  return (
    <Section className="pb-8 pt-12 sm:pb-10 sm:pt-18">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="max-w-4xl">
          <Badge>正在构建 AI-first one-person company</Badge>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-6xl lg:text-[4.5rem] lg:leading-[0.96]">
            为一人公司时代构建
            <br />
            AI 产品。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--secondary)] sm:text-lg">
            用 AI、Agent 和自动化构建产品，探索一个人如何完成从 Idea、开发、增长到变现。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/projects">查看项目</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              发起合作咨询
            </ButtonLink>
          </div>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {heroTags.map((item) => (
              <Tag key={item} value={item} />
            ))}
          </div>
        </div>

        <aside className="hero-focus-card rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[8px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Current Focus
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 border-b border-[var(--border)] pb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Build Days
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">14</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                MRR
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">$380</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Services
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">6</div>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            <div className="border-b border-[var(--border)] pb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  01
                </div>
                <span className="hero-focus-chip rounded-full border border-[rgba(138,106,82,0.16)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1 text-[11px] font-medium text-[var(--secondary)]">
                  Building
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                Founder Hub
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                个人品牌官网、内容中心和商业化中的核心枢纽，持续迭代中。
              </p>
            </div>

            <div className="border-b border-[var(--border)] pb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  02
                </div>
                <span className="hero-focus-chip rounded-full border border-[rgba(138,106,82,0.16)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1 text-[11px] font-medium text-[var(--secondary)]">
                  Growing
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                AI Startup Radar Lab
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                用公开数据和工作流持续筛选 AI 创业机会，目前处于 Growing 阶段。
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  03
                </div>
                <span className="hero-focus-chip rounded-full border border-[rgba(138,106,82,0.16)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1 text-[11px] font-medium text-[var(--secondary)]">
                  Open
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                Open Services
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                当前开放咨询、Skill 开发、自媒体支持，以及 AI 产品相关合作。
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}
