export type ArticleTemplateInput = {
  title: string;
  sourceUrl?: string;
  source?: string;
  author?: string;
  description?: string;
};

const requiredSections = [
  "## 我的一句话判断",
  "## 原文要点",
  "## 我的解读",
  "## 适合谁看",
  "## 可以怎么用",
  "## 风险提醒"
];

export function createInterpretationTemplate(input: ArticleTemplateInput) {
  const sourceLines = [
    input.sourceUrl ? `> 来源：${input.sourceUrl}` : "",
    input.source ? `> 站点：${input.source}` : "",
    input.author ? `> 作者：${input.author}` : ""
  ].filter(Boolean);

  return [
    `# ${input.title}`,
    sourceLines.length ? sourceLines.join("\n") : "",
    input.description ? `> 摘要：${input.description}` : "",
    "## 我的一句话判断",
    "这篇内容最值得关注的是：",
    "## 原文要点",
    "- ",
    "- ",
    "- ",
    "## 我的解读",
    "这里写你的判断：它为什么重要、和现有趋势有什么关系、哪些地方值得怀疑。",
    "## 适合谁看",
    "- ",
    "## 可以怎么用",
    "- ",
    "## 风险提醒",
    "- "
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function completeInterpretationTemplate(
  content: string,
  input: ArticleTemplateInput
) {
  const trimmed = content.trim();
  const missingSections = requiredSections.filter((section) => !trimmed.includes(section));

  if (!trimmed) {
    return createInterpretationTemplate(input);
  }

  if (!missingSections.length) {
    return trimmed;
  }

  const additions = missingSections.map((section) => {
    if (section === "## 我的一句话判断") {
      return `${section}\n\n这篇内容最值得关注的是：`;
    }
    if (section === "## 原文要点") {
      return `${section}\n\n- \n- \n- `;
    }
    if (section === "## 我的解读") {
      return `${section}\n\n这里写你的判断：它为什么重要、和现有趋势有什么关系、哪些地方值得怀疑。`;
    }
    if (section === "## 适合谁看") {
      return `${section}\n\n- `;
    }
    if (section === "## 可以怎么用") {
      return `${section}\n\n- `;
    }
    return `${section}\n\n- `;
  });

  return `${trimmed}\n\n${additions.join("\n\n")}`;
}
