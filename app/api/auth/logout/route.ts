import { NextResponse } from "next/server";
import { clearReaderSession } from "@/lib/reader-auth";

export async function POST() {
  await clearReaderSession();
  return NextResponse.json({ ok: true });
}
