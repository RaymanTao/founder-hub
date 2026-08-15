import type { Metadata } from "next";
import { siteInfo } from "@/data/site";

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
};

export function createMetadata({
  title,
  description,
  path = ""
}: MetadataInput): Metadata {
  const url = `${siteInfo.url}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteInfo.name,
      locale: "zh_CN",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}
