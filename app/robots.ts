import type { MetadataRoute } from "next";
import { siteInfo } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${siteInfo.url}/sitemap.xml`
  };
}
