import { ServiceCard } from "@/components/cards/service-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { services } from "@/data/services";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "服务",
  description: "Founder Hub 服务页，覆盖咨询、AI 产品策略、自动化、Skill 开发、自媒体与 MVP 开发。",
  path: "/services"
});

const processSteps = [
  {
    title: "发现问题",
    description: "先明确业务目标、约束条件和最值得解决的关键瓶颈。"
  },
  {
    title: "定义范围",
    description: "把交付拆成可执行的小范围，确认优先级、边界和验收标准。"
  },
  {
    title: "快速构建",
    description: "围绕 MVP、自动化流程或 Skill 原型快速落地并迭代。"
  },
  {
    title: "交付上线",
    description: "整理文档、部署和交接，确保成果可用、可维护、可继续扩展。"
  }
] as const;

const faqItems = [
  [
    "适合什么阶段？",
    "适合需要从想法快速推进到 MVP、自动化落地，或先通过咨询把方向校准清楚的项目。"
  ],
  [
    "交付节奏如何？",
    "先聚焦最小范围，通常按周推进，并持续同步进展、风险和下一步。"
  ],
  [
    "是否支持长期合作？",
    "可以。在明确阶段目标之后，可以继续扩展到长期顾问、内容协作或产品迭代。"
  ]
] as const;

export default function ServicesPage() {
  return (
    <>
      <Section>
        <div className="max-w-3xl">
          <SectionHeader
            eyebrow="Services"
            title="面向创始人与独立开发者的轻量服务"
            description="从咨询、产品策略，到自动化、Skill 开发和自媒体系统，优先交付真正能用的结果。"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl">
          <SectionHeader
            eyebrow="Process"
            title="合作流程保持简单"
            description="先把问题说清楚，再把范围收紧，用更短的路径把事情做出来。"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {processSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-[6px] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              <div className="text-sm font-semibold text-[var(--accent)]">
                0{index + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl">
          <SectionHeader
            eyebrow="FAQ"
            title="合作前先把边界讲清楚"
            description="正式开始之前，先确认节奏、交付方式和适合的合作范围。"
          />
        </div>
        <div className="grid gap-4">
          {faqItems.map(([question, answer]) => (
            <div
              key={question}
              className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface-alt)] p-5"
            >
              <h3 className="text-lg font-semibold">{question}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
                {answer}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/contact">发起咨询</ButtonLink>
        </div>
      </Section>
    </>
  );
}
