import type { RssCandidate } from "@/types/rss";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type RssAiAnalysis = {
  aiSummary: string;
  founderTakeaway: string;
  aiReason: string;
  relevanceScore: number;
  founderValueScore: number;
  freshnessScore: number;
  score: number;
  duplicateRisk: "low" | "medium" | "high";
  suggestedTags: string[];
};

type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

function getProviderConfig(): ProviderConfig {
  return {
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    // Keep the old variable as a compatibility fallback for existing local .env files.
    apiKey: process.env.DEEPSEEK_API_KEY ?? process.env.ZHIPU_API_KEY ?? "",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash"
  };
}

function assertConfigured(config: ProviderConfig) {
  if (!config.apiKey) {
    throw new Error("MISSING_DEEPSEEK_API_KEY");
  }

  if (!config.model) {
    throw new Error("MISSING_DEEPSEEK_MODEL");
  }
}

function clampScore(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const json = fenced ?? trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not-an-object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("RSS_AI_INVALID_JSON");
  }
}

function createMessages(candidate: RssCandidate): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "你是 Founder Hub 的中文创业资讯编辑。你负责筛选 RSS 候选资讯，判断它是否值得创业者阅读。只输出严格 JSON，不要 Markdown，不要解释。不要编造事实；证据不足时在 aiReason 里说明待核对。"
    },
    {
      role: "user",
      content: [
        "请分析这条 RSS 候选资讯，输出 JSON：",
        "",
        "{",
        '  "aiSummary": "60 字以内中文摘要",',
        '  "founderTakeaway": "一句话说明它对创业者有什么用",',
        '  "aiReason": "为什么推荐或不推荐进入候选池",',
        '  "relevanceScore": 0-100,',
        '  "founderValueScore": 0-100,',
        '  "freshnessScore": 0-100,',
        '  "score": 0-100,',
        '  "duplicateRisk": "low|medium|high",',
        '  "suggestedTags": ["最多 5 个中文标签"]',
        "}",
        "",
        "评分标准：",
        "- relevanceScore：是否匹配创业公司、一人公司、融资、案例拆解、AI 产品资讯。",
        "- founderValueScore：是否能帮助创始人做判断或行动。",
        "- freshnessScore：资讯新鲜度和时效性。",
        "- score：综合推荐分，80 以上适合优先处理。",
        "",
        "候选资讯：",
        `标题：${candidate.title}`,
        `摘要：${candidate.description || "无"}`,
        `来源：${candidate.feedTitle}`,
        `链接：${candidate.canonicalUrl || candidate.url}`,
        `分类：${candidate.category}`,
        `类型：${candidate.type}`,
        `发布时间：${candidate.publishedAt ?? "未知"}`,
        `现有标签：${candidate.suggestedTags.join(", ") || "无"}`
      ].join("\n")
    }
  ];
}

async function requestAnalysis(config: ProviderConfig, candidate: RssCandidate) {
  return fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: createMessages(candidate),
      temperature: 0.2,
      max_tokens: 900,
      stream: false,
      // Prevent the reasoning channel from consuming the response while
      // leaving message.content empty when JSON output is required.
      thinking: { type: "disabled" },
      response_format: { type: "json_object" }
    })
  });
}

export async function analyzeRssCandidate(candidate: RssCandidate): Promise<RssAiAnalysis> {
  const config = getProviderConfig();
  assertConfigured(config);

  const response = await requestAnalysis(config, candidate);

  if (!response.ok) {
    const detail = (await response.text()).trim().slice(0, 300);
    throw new Error(
      `RSS_AI_REQUEST_FAILED_${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        reasoning_content?: string;
      };
    }>;
  };
  const message = payload.choices?.[0]?.message;
  const content = (message?.content ?? message?.reasoning_content)?.trim();

  if (!content) {
    // DeepSeek may occasionally return an empty JSON response. Retry once so
    // a transient provider response does not skip an otherwise valid item.
    const retryResponse = await requestAnalysis(config, candidate);
    if (!retryResponse.ok) {
      const detail = (await retryResponse.text()).trim().slice(0, 300);
      throw new Error(
        `RSS_AI_REQUEST_FAILED_${retryResponse.status}${detail ? `: ${detail}` : ""}`
      );
    }
    const retryPayload = (await retryResponse.json()) as typeof payload;
    const retryMessage = retryPayload.choices?.[0]?.message;
    const retryContent = (retryMessage?.content ?? retryMessage?.reasoning_content)?.trim();
    if (!retryContent) throw new Error("RSS_AI_EMPTY_RESPONSE");
    const retryParsed = parseJsonObject(retryContent);
    return buildAnalysis(retryParsed, candidate);
  }

  const parsed = parseJsonObject(content);
  return buildAnalysis(parsed, candidate);
}

function buildAnalysis(parsed: Record<string, unknown>, candidate: RssCandidate): RssAiAnalysis {
  const duplicateRisk = parsed.duplicateRisk;

  return {
    aiSummary: String(parsed.aiSummary ?? "").slice(0, 220),
    founderTakeaway: String(parsed.founderTakeaway ?? "").slice(0, 220),
    aiReason: String(parsed.aiReason ?? "").slice(0, 360),
    relevanceScore: clampScore(parsed.relevanceScore, candidate.relevanceScore ?? 60),
    founderValueScore: clampScore(parsed.founderValueScore, candidate.founderValueScore ?? 60),
    freshnessScore: clampScore(parsed.freshnessScore, candidate.freshnessScore ?? 60),
    score: clampScore(parsed.score, candidate.score ?? 60),
    duplicateRisk:
      duplicateRisk === "medium" || duplicateRisk === "high" ? duplicateRisk : "low",
    suggestedTags: Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags.map(String).filter(Boolean).slice(0, 5)
      : candidate.suggestedTags.slice(0, 5)
  };
}
