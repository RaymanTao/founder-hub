import { createMediaAsset } from "@/lib/media-assets";
import {
  createMediaKey,
  createR2PresignedPutUrl,
  isR2Configured
} from "@/lib/r2";

const maxRemoteImageBytes = 8 * 1024 * 1024;

function getFilenameFromUrl(url: string, contentType: string) {
  const extension =
    contentType.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "") || "jpg";

  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").filter(Boolean).pop();
    if (filename && filename.includes(".")) return filename;
  } catch {
    // Fall through to a generated filename.
  }

  return `remote-cover.${extension}`;
}

export async function cacheRemoteImageToR2(input: {
  imageUrl?: string;
  title: string;
  sourceUrl: string;
}) {
  if (!input.imageUrl || !isR2Configured()) return input.imageUrl;

  try {
    const response = await fetch(input.imageUrl, {
      headers: {
        "user-agent": "FounderHubBot/1.0 (+https://founder-hub.local)"
      }
    });

    if (!response.ok) return input.imageUrl;

    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!contentType.startsWith("image/")) return input.imageUrl;

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > maxRemoteImageBytes) return input.imageUrl;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxRemoteImageBytes) return input.imageUrl;

    const key = createMediaKey({
      prefix: "crawled-images",
      filename: getFilenameFromUrl(input.imageUrl, contentType)
    });
    const upload = createR2PresignedPutUrl({
      key,
      contentType
    });
    const uploadResponse = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType
      },
      body: buffer
    });

    if (!uploadResponse.ok) return input.imageUrl;

    await createMediaAsset({
      key,
      url: upload.publicUrl,
      contentType,
      sizeBytes: buffer.byteLength,
      alt: input.title,
      sourceUrl: input.imageUrl,
      context: "article-import-cover"
    });

    return upload.publicUrl;
  } catch {
    return input.imageUrl;
  }
}
