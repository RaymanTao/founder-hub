import { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "product-1",
    slug: "ai-solopreneur-stack-2026",
    name: "AI Solopreneur Stack 2026",
    tagline: "给一人公司的完整工具地图",
    description:
      "覆盖 Idea、Research、Build、Automation、Payment 和 Growth 的免费资源。",
    category: "Resources",
    status: "Free",
    price: "Free",
    pricingType: "Email Unlock",
    featured: true,
    url: "/products"
  },
  {
    id: "product-2",
    slug: "x-content-skill",
    name: "X Content Skill",
    tagline: "把创始人表达流程产品化",
    description:
      "围绕选题、结构、发布和复盘的内容工作流 Skill，适合持续 Build in Public。",
    category: "Skills",
    status: "Live",
    price: "$19 - $39",
    pricingType: "One-time",
    featured: true,
    url: "/products"
  },
  {
    id: "product-3",
    slug: "ai-startup-radar",
    name: "AI Startup Radar",
    tagline: "追踪 AI 创业机会与验证信号",
    description:
      "一个正在构建中的 AI SaaS / Agent 产品，用来跟踪趋势、竞品和市场窗口。",
    category: "Apps",
    status: "Building",
    price: "Coming Soon",
    pricingType: "Waitlist",
    featured: true,
    url: "/products"
  }
];
