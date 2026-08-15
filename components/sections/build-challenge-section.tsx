import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { buildChallenge } from "@/data/site";
import { zhCN } from "@/locale/zh-cn";
import { percent } from "@/lib/utils";

export function BuildChallengeSection() {
  const progress = percent(buildChallenge.completed, buildChallenge.goal);

  return (
    <Section>
      <SectionHeader
        eyebrow={zhCN.buildChallenge.eyebrow}
        title={`${buildChallenge.year} ${zhCN.buildChallenge.title}`}
        description={zhCN.buildChallenge.description}
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--muted)]">
                {zhCN.buildChallenge.shipped}
              </div>
              <div className="mt-3 text-5xl font-semibold tracking-tight">
                {buildChallenge.completed}
                <span className="text-2xl text-[var(--muted)]">
                  /{buildChallenge.goal}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--muted)]">
                {zhCN.buildChallenge.progress}
              </div>
              <div className="mt-3 text-2xl font-semibold">{progress}%</div>
            </div>
          </div>
          <div className="mt-8 h-3 rounded-full bg-[var(--surface-alt)]">
            <div
              className="h-3 rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-alt)] p-6">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
            {zhCN.buildChallenge.why}
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">
            {zhCN.buildChallenge.whyDescription}
          </p>
        </div>
      </div>
    </Section>
  );
}
