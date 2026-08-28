"use server";

import { redirect } from "next/navigation";
import { clearReaderSession } from "@/lib/reader-auth";
import { updateReaderProfile } from "@/lib/profiles";
import { supabaseAuthFetch } from "@/lib/supabase-auth";
import { getReaderEmail } from "@/lib/reader-auth";

export async function logoutReader() {
  await clearReaderSession();
  redirect("/");
}

export async function updateAccount(formData: FormData) {
  const email = await getReaderEmail();
  if (!email) redirect("/");

  const displayName = String(formData.get("displayName") || "").trim().slice(0, 80) || email.split("@")[0];
  const avatarUrl = String(formData.get("avatarUrl") || "").trim().slice(0, 1000);
  await updateReaderProfile(email, { displayName, avatarUrl });

  redirect("/account?saved=1");
}

export async function resetPassword(formData: FormData) {
  const email = await getReaderEmail();
  if (!email) redirect("/");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmCurrentPassword = String(formData.get("confirmCurrentPassword") || "");
  if (currentPassword.length < 8 || newPassword.length < 8 || currentPassword !== confirmCurrentPassword) redirect("/account?error=password");
  const loginResponse = await supabaseAuthFetch("token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password: currentPassword }) });
  const loginPayload = (await loginResponse.json()) as { access_token?: string };
  if (!loginResponse.ok || !loginPayload.access_token) redirect("/account?error=password");
  const auth = await import("@/lib/supabase-auth");
  const config = auth.getSupabaseAuthConfig();
  const passwordResponse = await fetch(`${config.url}/auth/v1/user`, { method: "PUT", headers: { apikey: config.anonKey, Authorization: `Bearer ${loginPayload.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password: newPassword }) });
  if (!passwordResponse.ok) redirect("/account?error=password");

  redirect("/account?password=1");
}
