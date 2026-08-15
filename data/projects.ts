import { Project } from "@/types/project";

export const projects: Project[] = [
  {
    id: "project-1",
    slug: "founder-hub",
    name: "Founder Hub",
    summary: "个人品牌官网、内容中心和商业化中的枢纽。",
    status: "Building",
    startDate: "2026-08-01",
    buildDays: 14,
    users: "Early audience",
    revenue: "Pipeline",
    mrr: "$0",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "MDX"],
    featured: true,
    problem:
      "个人品牌、产品展示、内容沉淀和商业入口分散，导致增长资产难以复用。",
    hypothesis:
      "把内容、项目、产品和服务整合进一个清晰的信息架构，可以提高信任与转化。",
    solution:
      "构建一个以内容和产品为中心、兼顾 SEO 与转化的 Founder Hub 网站。",
    buildProcess: [
      "先完成信息架构与设计系统",
      "再搭建数据驱动页面与内容系统",
      "最后接入 Newsletter、Contact 和 Analytics"
    ],
    results: ["形成统一对外入口", "支持持续发布内容与产品", "为后续 SEO 奠定结构"],
    lessons: ["先做清晰结构，后加复杂能力", "数据驱动比散落内容更利于维护"]
  },
  {
    id: "project-2",
    slug: "ai-startup-radar-lab",
    name: "AI Startup Radar Lab",
    summary: "用公开数据和工作流持续筛选 AI 创业机会。",
    status: "Growing",
    startDate: "2026-05-10",
    launchDate: "2026-06-18",
    buildDays: 39,
    users: "120+",
    revenue: "$1.2k",
    mrr: "$380",
    techStack: ["Next.js", "Supabase", "PostHog", "Resend"],
    featured: true,
    problem: "机会信息分散，创业者很难高频复盘什么值得做。",
    solution: "把情报、筛选和跟踪做成一个轻量产品与内容闭环。",
    results: ["形成稳定用户反馈", "验证了内容驱动增长的可行性"]
  },
  {
    id: "project-3",
    slug: "automation-studio",
    name: "Automation Studio",
    summary: "帮助小团队快速设计 Agent 与自动化方案。",
    status: "Archived",
    startDate: "2025-11-01",
    launchDate: "2026-01-15",
    buildDays: 52,
    users: "18 clients",
    revenue: "$8.4k",
    mrr: "$0",
    techStack: ["Node.js", "OpenAI API", "Make", "Notion"],
    featured: false,
    problem: "手工交付自动化方案难以标准化。",
    lessons: ["服务产品化必须足够聚焦", "归档项目也应继续保留知识价值"]
  }
];
