import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { projects } from "@/data/projects";
import { siteInfo } from "@/data/site";
import { getAllArticles } from "@/lib/writing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();

  return [
    "",
    "/products",
    "/projects",
    "/resources",
    "/services",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...articles.map((item) => `/writing/${item.slug}`),
    ...projects.map((item) => `/projects/${item.slug}`),
    ...products.map((item) => item.url)
  ].map((path) => ({
    url: `${siteInfo.url}${path}`
  }));
}
