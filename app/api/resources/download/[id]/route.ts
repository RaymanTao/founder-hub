import { NextRequest, NextResponse } from "next/server";
import { getReaderEmail } from "@/lib/reader-auth";
import { getAllResources } from "@/lib/resources";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = (await getAllResources()).find((item) => item.id === id);
  if (!resource) return NextResponse.json({ message: "资源不存在" }, { status: 404 });
  if (resource.status !== "Free") return NextResponse.json({ message: "资源尚未开放" }, { status: 409 });

  if (resource.access === "Member") {
    const email = await getReaderEmail();
    if (!email) return NextResponse.json({ message: "请先登录后再解锁会员资源" }, { status: 401 });
    return NextResponse.json({ message: "会员权限校验接口已就绪，订阅会员后开放下载" }, { status: 403 });
  }

  if (!resource.href) return NextResponse.json({ message: "资源下载地址尚未配置" }, { status: 404 });
  let target: URL;
  try {
    target = new URL(resource.href, request.url);
  } catch {
    return NextResponse.json({ message: "资源下载地址无效" }, { status: 500 });
  }
  if (!["http:", "https:"].includes(target.protocol)) return NextResponse.json({ message: "资源下载地址无效" }, { status: 400 });
  return NextResponse.redirect(target);
}
