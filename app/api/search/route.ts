import { NextResponse } from "next/server";
import { searchArticles } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (!query) return NextResponse.json({ results: [] });

  try {
    return NextResponse.json({ results: await searchArticles(query) });
  } catch {
    return NextResponse.json({ message: "搜索暂时不可用" }, { status: 500 });
  }
}
