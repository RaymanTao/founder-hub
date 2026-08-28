import crypto from "node:crypto";

type PresignInput = {
  key: string;
  contentType: string;
  expiresIn?: number;
};

function getR2Config() {
  return {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "",
    publicBaseUrl: process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? ""
  };
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodeKey(key: string) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getSigningKey(secret: string, date: string) {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

export function isR2Configured() {
  const config = getR2Config();
  return Boolean(
    config.accountId &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucket &&
      config.publicBaseUrl
  );
}

export function getPublicR2Url(key: string) {
  const config = getR2Config();
  const base = config.publicBaseUrl;
  const needsBucketPath = base.includes(".r2.cloudflarestorage.com") && !base.endsWith(`/${config.bucket}`);
  return `${base}${needsBucketPath ? `/${encodeURIComponent(config.bucket)}` : ""}/${encodeKey(key)}`;
}

export function createMediaKey(input: { prefix?: string; filename: string }) {
  const extension = input.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";
  const safeName = input.filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  const id = crypto.randomUUID();
  const prefix = input.prefix?.replace(/^\/|\/$/g, "") || "uploads";

  return `${prefix}/${date}/${id}-${safeName || "asset"}.${safeExtension}`;
}

export function createR2PresignedPutUrl(input: PresignInput) {
  const config = getR2Config();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = encodeKey(input.key);
  const canonicalUri = `/${config.bucket}/${encodedKey}`;
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const credential = `${config.accessKeyId}/${credentialScope}`;
  const expires = String(input.expiresIn ?? 300);
  const signedHeaders = "host";
  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expires,
    "X-Amz-SignedHeaders": signedHeaders
  });
  const canonicalQuery = query.toString().replace(/\+/g, "%20");
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    `host:${host}`,
    "",
    signedHeaders,
    "UNSIGNED-PAYLOAD"
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join("\n");
  const signature = crypto
    .createHmac("sha256", getSigningKey(config.secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest("hex");
  const uploadUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;

  return {
    uploadUrl,
    publicUrl: getPublicR2Url(input.key),
    key: input.key,
    contentType: input.contentType,
    expiresIn: Number(expires)
  };
}
