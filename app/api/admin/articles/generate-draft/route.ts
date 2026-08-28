import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { generateArticleDraft } from "@/lib/ai-draft";
import type { Article, ArticleCategory, ArticleType } from "@/types/article";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(1200),
  category: z.enum(["Build", "AI", "Growth", "Solopreneur"]),
  type: z.enum([
    "Tutorial", "Case Study", "Essay", "Build Log", "Product Review", "Founder Analysis", "Experiment"
  ]),
  source: z.string().trim().max(240).optional(),
  sourceUrl: z.string().trim().max(1000).optional(),
  tags: z.string().trim().max(600).optional(),
  content: z.string().max(50000).optional()
});

export async function POST(request: Request) {
  await requireAdmin();

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "标题和摘要不能为空。" }, { status: 400 });
  }

  const input = parsed.data;
  const article: Article = {
    title: input.title,
    slug: "draft",
    description: input.description,
    date: new Date().toISOString().slice(0, 10),
    category: input.category as ArticleCategory,
    type: input.type as ArticleType,
    readingTime: "5 min",
    featured: false,
    published: false,
    archived: false,
    number: 0,
    source: input.source || "Founder Hub",
    sourceUrl: input.sourceUrl || undefined,
    verified: false,
    access: "Free",
    tags: input.tags ? input.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    content: input.content || ""
  };

  try {
    const content = await generateArticleDraft(article);
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 初稿生成失败。";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
