import { NextRequest, NextResponse } from "next/server";
import { setReaderSession, verifyReaderLoginToken } from "@/lib/reader-auth";
import { upsertReaderProfile } from "@/lib/profiles";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const email = verifyReaderLoginToken(token);

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", request.url));
  }

  await upsertReaderProfile({ email, provider: "email" });
  await setReaderSession(email);
  return NextResponse.redirect(new URL("/account", request.url));
}
