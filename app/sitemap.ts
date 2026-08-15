import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { projects } from "@/data/projects";
import { siteInfo } from "@/data/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    "",
    "/products",
    "/projects",
    "/writing",
    "/services",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...projects.map((item) => `/projects/${item.slug}`),
    ...products.map((item) => item.url)
  ].map((path) => ({
    url: `${siteInfo.url}${path}`
  }));
}
