import { NextRequest, NextResponse } from "next/server";
import { getFavorite } from "@/lib/favorites";
import { getReaderEmail } from "@/lib/reader-auth";

export async function GET(request: NextRequest) {
  const email = await getReaderEmail();

  if (!email) {
    return NextResponse.json({ favorited: false, authenticated: false });
  }

  const slug = request.nextUrl.searchParams.get("slug") ?? "";

  if (!slug) {
    return NextResponse.json({ message: "缺少文章 slug" }, { status: 400 });
  }

  try {
    const favorite = await getFavorite(email, slug);

    return NextResponse.json({
      favorited: Boolean(favorite),
      authenticated: true
    });
  } catch {
    return NextResponse.json(
      { message: "读取收藏状态失败" },
      { status: 500 }
    );
  }
}
