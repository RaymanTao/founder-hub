import { NextResponse } from "next/server";
import { z } from "zod";
import { addFavorite, removeFavorite } from "@/lib/favorites";
import { getReaderEmail } from "@/lib/reader-auth";
import { getArticleBySlug } from "@/lib/writing";

const toggleSchema = z.object({
  slug: z.string().min(1),
  favorited: z.boolean()
});

export async function POST(request: Request) {
  const email = await getReaderEmail();

  if (!email) {
    return NextResponse.json(
      { message: "请先登录后再收藏文章。" },
      { status: 401 }
    );
  }

  const payload = await request.json();
  const result = toggleSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? "操作失败" },
      { status: 400 }
    );
  }

  const article = await getArticleBySlug(result.data.slug);

  if (!article || !article.published || article.archived) {
    return NextResponse.json({ message: "文章不存在。" }, { status: 404 });
  }

  try {
    const next = result.data.favorited
      ? await addFavorite({
          email,
          slug: article.slug,
          title: article.title
        })
      : await removeFavorite(email, article.slug);

    if (!next.configured) {
      return NextResponse.json(
        { message: "请先配置 Supabase 后启用收藏功能。" },
        { status: 501 }
      );
    }

    return NextResponse.json({
      favorited: next.favorited,
      message: next.favorited ? "已收藏文章。" : "已取消收藏。"
    });
  } catch {
    return NextResponse.json(
      { message: "收藏操作失败，请稍后再试。" },
      { status: 500 }
    );
  }
}
