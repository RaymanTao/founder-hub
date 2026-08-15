import { Service } from "@/types/service";

export const services: Service[] = [
  {
    slug: "consulting",
    name: "咨询",
    summary: "先把方向、问题和路径说清楚。",
    description:
      "适合还在判断机会、梳理定位、规划产品路线，或者需要外部视角一起校准方向的项目。",
    deliverables: ["问题诊断", "方向建议", "优先级梳理", "下一步行动清单"],
    startingPrice: "¥2,000 起",
    featured: true
  },
  {
    slug: "ai-product-strategy",
    name: "AI 产品策略",
    summary: "从机会判断到 MVP 路线图。",
    description:
      "适合正在寻找切入点、需要梳理用户问题、价值主张与发布路径的创始人或独立开发者。",
    deliverables: ["机会评估", "产品定位", "MVP 范围", "发布计划"],
    startingPrice: "¥6,000 起",
    featured: true
  },
  {
    slug: "agent-automation",
    name: "AI Agent 与自动化",
    summary: "把重复流程变成可复用系统。",
    description:
      "面向内容、销售、运营和内部工作流，设计从输入到执行再到复盘的自动化闭环。",
    deliverables: ["流程梳理", "Agent 方案", "集成清单", "运行文档"],
    startingPrice: "¥8,000 起",
    featured: true
  },
  {
    slug: "skill-development",
    name: "Skill 开发",
    summary: "把经验封装成可调用的 AI Skill。",
    description:
      "适合需要把内部流程、专业知识或固定工作方法沉淀成可复用 Skill 的团队或个人。",
    deliverables: ["能力拆解", "Skill 设计", "指令文档", "测试交付"],
    startingPrice: "¥5,000 起",
    featured: true
  },
  {
    slug: "mvp-development",
    name: "MVP 产品开发",
    summary: "用最短路径把产品推向市场。",
    description:
      "基于 Next.js、Supabase 与现代 AI 开发栈，快速构建可验证、可扩展的最小产品。",
    deliverables: ["技术方案", "设计系统", "核心页面", "部署上线"],
    startingPrice: "¥18,000 起",
    featured: false
  },
  {
    slug: "self-media",
    name: "自媒体",
    summary: "把内容能力做成持续输出系统。",
    description:
      "适合想围绕产品、个人品牌或行业主题建立内容矩阵，并结合 AI 提升选题、写作与分发效率的人。",
    deliverables: ["内容定位", "栏目规划", "工作流设计", "分发建议"],
    startingPrice: "¥4,000 起",
    featured: false
  }
];
