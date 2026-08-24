import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

export type MediaAsset = {
  id: string;
  key: string;
  url: string;
  bucket: string;
  content_type: string;
  size_bytes: number | null;
  alt: string | null;
  source_url: string | null;
  context: string;
  created_at: string;
};

export async function listMediaAssets() {
  if (!isSupabaseConfigured()) return [] as MediaAsset[];

  const response = await supabaseFetch(
    "media_assets?select=id,key,url,bucket,content_type,size_bytes,alt,source_url,context,created_at&order=created_at.desc&limit=100"
  );

  if (!response.ok) {
    throw new Error(`MEDIA_ASSETS_LIST_FAILED_${response.status}`);
  }

  return (await response.json()) as MediaAsset[];
}

export async function createMediaAsset(input: {
  key: string;
  url: string;
  contentType: string;
  sizeBytes?: number;
  alt?: string;
  sourceUrl?: string;
  context?: string;
}) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false
    };
  }

  const response = await supabaseFetch("media_assets", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      key: input.key,
      url: input.url,
      bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "",
      content_type: input.contentType,
      size_bytes: input.sizeBytes ?? null,
      alt: input.alt || null,
      source_url: input.sourceUrl || null,
      context: input.context || "admin-upload"
    })
  });

  if (!response.ok) {
    throw new Error(`MEDIA_ASSETS_INSERT_FAILED_${response.status}`);
  }

  return {
    configured: true
  };
}
