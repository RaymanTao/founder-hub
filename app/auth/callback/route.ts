import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { siteInfo } from "@/data/site";
import { setReaderSession } from "@/lib/reader-auth";
import { syncReaderProfileFromAuthUser } from "@/lib/profiles";
import { isSupabaseAuthConfigured, supabaseAuthFetch } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const verifier = cookieStore.get("founder_hub_oauth_verifier")?.value;
  if (!code || !verifier || !isSupabaseAuthConfigured()) return NextResponse.redirect(new URL("/login?error=oauth-failed", siteInfo.url));

  const response = await supabaseAuthFetch("token?grant_type=pkce", { method: "POST", body: JSON.stringify({ auth_code: code, code_verifier: verifier }) });
  const payload = (await response.json()) as { user?: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: { provider?: string } } };
  cookieStore.delete("founder_hub_oauth_verifier");
  if (!response.ok || !payload.user?.email) return NextResponse.redirect(new URL("/login?error=oauth-failed", siteInfo.url));
  await syncReaderProfileFromAuthUser(payload.user);
  await setReaderSession(payload.user.email);
  return NextResponse.redirect(new URL("/", siteInfo.url));
}
