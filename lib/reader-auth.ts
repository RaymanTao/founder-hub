import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { siteInfo } from "@/data/site";

const readerCookie = "founder_hub_reader";
const tokenTtlMs = 15 * 60 * 1000;
const sessionTtlSeconds = 60 * 60 * 24 * 30;

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function unbase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(payload: string) {
  const secret = getAuthSecret();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isReaderAuthConfigured() {
  return Boolean(getAuthSecret());
}

export function createReaderLoginToken(email: string) {
  if (!isReaderAuthConfigured()) {
    throw new Error("MISSING_AUTH_SECRET");
  }

  const payload = base64url(
    JSON.stringify({
      email,
      exp: Date.now() + tokenTtlMs,
      kind: "login"
    })
  );

  return `${payload}.${sign(payload)}`;
}

export function verifyReaderLoginToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !verifySignature(payload, signature)) return null;

  try {
    const parsed = JSON.parse(unbase64url(payload)) as {
      email?: string;
      exp?: number;
      kind?: string;
    };

    if (parsed.kind !== "login" || !parsed.email || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed.email;
  } catch {
    return null;
  }
}

export function createReaderSessionToken(email: string) {
  if (!isReaderAuthConfigured()) {
    throw new Error("MISSING_AUTH_SECRET");
  }

  const payload = base64url(
    JSON.stringify({
      email,
      kind: "session"
    })
  );

  return `${payload}.${sign(payload)}`;
}

export function verifyReaderSessionToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !verifySignature(payload, signature)) return null;

  try {
    const parsed = JSON.parse(unbase64url(payload)) as {
      email?: string;
      kind?: string;
    };

    if (parsed.kind !== "session" || !parsed.email) return null;
    return parsed.email;
  } catch {
    return null;
  }
}

export async function getReaderEmail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(readerCookie)?.value;
  return token ? verifyReaderSessionToken(token) : null;
}

export async function setReaderSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(readerCookie, createReaderSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds
  });
}

export async function clearReaderSession() {
  const cookieStore = await cookies();
  cookieStore.delete(readerCookie);
}

export function createLoginUrl(token: string) {
  return `${siteInfo.url}/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function sendReaderLoginEmail(email: string, loginUrl: string) {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.NEWSLETTER_FROM_EMAIL ?? "";

  if (!apiKey || !from) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "登录 Founder Hub",
      html: [
        "<p>点击下面的链接登录 Founder Hub：</p>",
        `<p><a href="${loginUrl}">登录 Founder Hub</a></p>`,
        "<p>这个链接 15 分钟内有效。如果不是你本人操作，可以忽略这封邮件。</p>"
      ].join("")
    })
  });

  if (!response.ok) {
    throw new Error(`RESEND_LOGIN_FAILED_${response.status}`);
  }

  return true;
}
