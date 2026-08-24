import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content", "writing");
const isDryRun = process.argv.includes("--dry-run");

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  };
}

function normalizeArticle(data, content) {
  return {
    slug: String(data.slug ?? "").trim(),
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    body: content.trim(),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    category: data.category ?? "AI",
    type: data.type ?? "Essay",
    reading_time: String(data.readingTime ?? data.reading_time ?? "5 min"),
    featured: data.featured === true,
    published: data.published !== false,
    archived: data.archived === true,
    number: Number(data.number ?? 0),
    source: typeof data.source === "string" ? data.source : "Founder Hub",
    source_url: typeof data.sourceUrl === "string" ? data.sourceUrl : null,
    verified: data.verified !== false,
    access: data.access === "Deep Dive" ? "Deep Dive" : "Free",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    audio_url: typeof data.audioUrl === "string" ? data.audioUrl : null,
    cover: typeof data.cover === "string" ? data.cover : null,
    locale: typeof data.locale === "string" ? data.locale : "zh-CN"
  };
}

async function supabaseFetch(pathname, init = {}) {
  const config = getSupabaseConfig();

  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return fetch(`${config.url}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
}

async function readMdxArticles() {
  const files = await fs.readdir(contentDir);
  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(contentDir, file), "utf8");
        const parsed = matter(raw);
        const article = normalizeArticle(parsed.data, parsed.content);

        if (!article.slug) {
          throw new Error(`${file} is missing frontmatter slug.`);
        }

        return article;
      })
  );

  return articles.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function upsertArticles(articles) {
  const response = await supabaseFetch("articles?on_conflict=slug&select=id,slug", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(articles)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Article import failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function upsertArticleSources(articles, articleIds) {
  const sources = articles
    .filter((article) => article.source_url)
    .map((article) => ({
      article_id: articleIds.get(article.slug),
      source_url: article.source_url,
      source_title: article.title,
      source_site: article.source,
      metadata: {
        importedFrom: "mdx",
        verified: article.verified
      }
    }))
    .filter((source) => source.article_id);

  if (!sources.length) return 0;

  const response = await supabaseFetch(
    "article_sources?on_conflict=article_id,source_url",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(sources)
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Article source import failed: ${response.status} ${body}`);
  }

  return sources.length;
}

async function main() {
  const articles = await readMdxArticles();

  if (isDryRun) {
    console.log(`Found ${articles.length} MDX articles.`);
    for (const article of articles) {
      console.log(
        `- ${article.slug}: ${article.title} (${article.published ? "published" : "draft"})`
      );
    }
    return;
  }

  const rows = await upsertArticles(articles);
  const articleIds = new Map(rows.map((row) => [row.slug, row.id]));
  const sourceCount = await upsertArticleSources(articles, articleIds);

  console.log(`Imported ${rows.length} articles into Supabase.`);
  console.log(`Imported ${sourceCount} article source records.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
