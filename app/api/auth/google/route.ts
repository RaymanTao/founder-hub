import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { siteInfo } from "@/data/site";
import { isSupabaseAuthConfigured, getSupabaseAuthConfig } from "@/lib/supabase-auth";

export async function GET() {
  if (!isSupabaseAuthConfigured()) return NextResponse.redirect(new URL("/login?error=supabase-not-configured", siteInfo.url));
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const callback = new URL("/auth/callback", siteInfo.url);
  const config = getSupabaseAuthConfig();
  const authorize = new URL(`${config.url}/auth/v1/authorize`);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callback.toString());
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  const cookieStore = await cookies();
  cookieStore.set("founder_hub_oauth_verifier", verifier, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/auth/callback", maxAge: 600 });
  return NextResponse.redirect(authorize);
}
