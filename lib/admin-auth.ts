import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookie = "founder_hub_admin";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function getAdminToken() {
  const password = getAdminPassword();
  if (!password) return "";
  return createHash("sha256").update(`founder-hub:${password}`).digest("hex");
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword());
}

export async function isAdminAuthenticated() {
  const token = getAdminToken();
  if (!token) return false;

  const cookieStore = await cookies();
  return cookieStore.get(adminCookie)?.value === token;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession() {
  const token = getAdminToken();
  if (!token) return false;

  const cookieStore = await cookies();
  cookieStore.set(adminCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookie);
}

export function verifyAdminPassword(password: string) {
  const configured = getAdminPassword();
  return Boolean(configured) && password === configured;
}
