import type { Article } from "@/types/article";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type ProviderConfig = {
  provider: "deepseek" | "openai";
  baseUrl: string;
  apiKey: string;
  model: string;
};

function getProviderConfig(): ProviderConfig {
  const provider = (process.env.AI_PROVIDER ?? "deepseek").toLowerCase();

  if (provider === "deepseek") {
    return {
      provider: "deepseek",
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash"
    };
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.OPENAI_MODEL ?? ""
    };
  }

  throw new Error("UNSUPPORTED_AI_PROVIDER");
}

function assertConfigured(config: ProviderConfig) {
  if (!config.apiKey) {
    throw new Error(`MISSING_${config.provider.toUpperCase()}_API_KEY`);
  }

  if (!config.model) {
    throw new Error(`MISSING_${config.provider.toUpperCase()}_MODEL`);
  }
}

function createMessages(article: Article): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "你是 Founder Hub 的中文 AI 创业内容编辑。你擅长把第三方文章、产品发布和研究摘要改写成克制、可信、可执行的中文解读。不要编造事实；如果证据不足，明确写“待核对”或“待补充”。只输出 Markdown 正文，不要输出 frontmatter。"
    },
    {
      role: "user",
      content: [
        "请基于下面的文章元数据和当前草稿，生成一版可编辑的中文解读初稿。",
        "",
        "要求：",
        "- 保留并使用这些章节：我的一句话判断、原文要点、我的解读、适合谁看、可以怎么用、风险提醒。",
        "- 不要声称你阅读了完整原文，除非当前草稿里已经有对应证据。",
        "- 原文要点只能基于标题、摘要、来源信息和当前草稿推断；不确定就写“待核对”。",
        "- 我的解读要面向 AI 产品、Agent 自动化、增长或一人公司场景。",
        "- 语气清晰、直接，像给创始人的内部简报。",
        "- 输出完整 Markdown 正文，从一级标题开始。",
        "",
        "文章元数据：",
        `标题：${article.title}`,
        `摘要：${article.description}`,
        `分类：${article.category}`,
        `类型：${article.type}`,
        `来源：${article.source}`,
        `来源链接：${article.sourceUrl ?? "无"}`,
        `标签：${article.tags.join(", ") || "无"}`,
        "",
        "当前草稿：",
        article.content
      ].join("\n")
    }
  ];
}

export async function generateArticleDraft(article: Article) {
  const config = getProviderConfig();
  assertConfigured(config);

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: createMessages(article),
      temperature: 0.4,
      max_tokens: 2400,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`AI_REQUEST_FAILED_${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("AI_EMPTY_RESPONSE");
  }

  return content;
}
