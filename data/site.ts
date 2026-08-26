import { BuildChallenge, NavItem } from "@/types/site";

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Resources", href: "/resources" },
  { label: "Products", href: "/products" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" }
];

export const socialLinks = [
  { label: "X", href: "https://x.com" },
  { label: "GitHub", href: "https://github.com" },
  { label: "Email", href: "mailto:hello@example.com" }
];

export const buildChallenge: BuildChallenge = {
  year: 2026,
  goal: 12,
  completed: 4
};

export const heroTags = [
  "AI Products",
  "AI Agents",
  "Solopreneur",
  "Build in Public"
];

export const freeResource = {
  title: "AI Solopreneur Stack 2026",
  description:
    "一份围绕 Idea、Research、Build、AI Coding、Payment、Growth 和 Automation 的实战工具清单。",
  bullets: [
    "按业务环节拆分工具与工作流",
    "适合一人公司从 0 到 1 落地",
    "通过 Email 解锁，后续持续更新"
  ]
};

export const siteInfo = {
  name: "Founder Hub",
  title: "Build AI products for the one-person company era",
  description:
    "用 AI、Agent 和自动化构建产品，探索一个人如何完成从 Idea、开发、增长到变现。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
};
