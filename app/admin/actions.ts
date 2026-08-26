"use server";

import { redirect } from "next/navigation";
import { completeInterpretationTemplate } from "@/lib/article-template";
import { generateArticleDraft } from "@/lib/ai-draft";
import {
  clearAdminSession,
  isAdminConfigured,
  requireAdmin,
  setAdminSession,
  verifyAdminPassword
} from "@/lib/admin-auth";
import {
  createArticleFromUrl,
  createArticleFromRssCandidate,
  createBlankArticle,
  updateArticle
} from "@/lib/admin-content";
import { getSupabaseArticleRevision } from "@/lib/article-db";
import {
  createResource,
  setResourceArchived,
  updateResource
} from "@/lib/admin-resources";
import {
  getRssCandidateById,
  updateRssCandidateStatus
} from "@/lib/rss-items";
import { getArticleBySlug } from "@/lib/writing";
import type { ArticleAccess, ArticleCategory, ArticleType } from "@/types/article";
import type { Resource } from "@/types/resource";
import type { RssItemStatus } from "@/types/rss";

const categoryValues: ArticleCategory[] = ["Build", "AI", "Growth", "Solopreneur"];
const typeValues: ArticleType[] = [
  "Tutorial",
  "Case Study",
  "Essay",
  "Build Log",
  "Product Review",
  "Founder Analysis",
  "Experiment"
];
const accessValues: ArticleAccess[] = ["Free", "Deep Dive"];
const resourceCategoryValues: Resource["category"][] = [
  "Toolkit",
  "Template",
  "Workflow",
  "Checklist"
];
const resourceStatusValues: Resource["status"][] = ["Free", "Coming Soon"];
const rssStatusValues: RssItemStatus[] = ["pending", "selected", "rejected", "imported"];

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isBlockedImportHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export async function loginAdmin(formData: FormData) {
  if (!isAdminConfigured()) {
    redirect("/admin/login?setup=1");
  }

  const password = requireString(formData, "password");
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function saveArticleMeta(formData: FormData) {
  await requireAdmin();

  const slug = requireString(formData, "slug");
  const category = requireString(formData, "category") as ArticleCategory;
  const type = requireString(formData, "type") as ArticleType;
  const access = requireString(formData, "access") as ArticleAccess;

  if (!slug || !categoryValues.includes(category) || !typeValues.includes(type)) {
    redirect("/admin?error=invalid-article");
  }

  if (!accessValues.includes(access)) {
    redirect(`/admin/articles/${slug}?error=invalid-access`);
  }

  await updateArticle(
    slug,
    {
      title: requireString(formData, "title"),
      description: requireString(formData, "description"),
      date: requireString(formData, "date"),
      category,
      type,
      readingTime: requireString(formData, "readingTime"),
      featured: formData.get("featured") === "on",
      published: formData.get("published") === "on",
      archived: formData.get("archived") === "on",
      number: Number(requireString(formData, "number") || 0),
      source: requireString(formData, "source"),
      sourceUrl: requireString(formData, "sourceUrl") || undefined,
      verified: formData.get("verified") === "on",
      access,
      tags: requireString(formData, "tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      audioUrl: requireString(formData, "audioUrl") || undefined,
      cover: requireString(formData, "cover") || undefined
    },
    requireString(formData, "content")
  );

  redirect(`/admin/articles/${slug}?saved=1`);
}

export async function createManualArticle(formData: FormData) {
  await requireAdmin();

  const title = requireString(formData, "title");
  const description = requireString(formData, "description");
  const type = requireString(formData, "type") as ArticleType;

  if (!title || !description || !typeValues.includes(type)) {
    redirect("/admin/new?error=invalid-manual");
  }

  const slug = await createBlankArticle({ title, description, type });
  redirect(`/admin/articles/${slug}?created=1`);
}

export async function importArticleFromUrl(formData: FormData) {
  await requireAdmin();

  const url = requireString(formData, "url");
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    redirect("/admin/new?error=invalid-url");
  }

  if (!["http:", "https:"].includes(parsed.protocol) || isBlockedImportHost(parsed.hostname)) {
    redirect("/admin/new?error=invalid-url");
  }

  let slug: string;

  try {
    slug = await createArticleFromUrl(parsed.toString());
  } catch {
    redirect("/admin/new?error=import-failed");
  }

  redirect(`/admin/articles/${slug}?imported=1`);
}

export async function setRssCandidateStatusAction(formData: FormData) {
  await requireAdmin();

  const id = requireString(formData, "id");
  const status = requireString(formData, "status") as RssItemStatus;
  const returnTo = requireString(formData, "returnTo") || "/admin/rss";

  if (!id || !rssStatusValues.includes(status)) {
    redirect("/admin/rss?error=invalid-rss-status");
  }

  await updateRssCandidateStatus(id, { status });
  redirect(returnTo);
}

export async function createArticleFromRssCandidateAction(formData: FormData) {
  await requireAdmin();

  const id = requireString(formData, "id");
  if (!id) {
    redirect("/admin/rss?error=invalid-rss-item");
  }

  const candidate = await getRssCandidateById(id);
  if (!candidate) {
    redirect("/admin/rss?error=rss-item-not-found");
  }

  let slug: string;

  try {
    slug = await createArticleFromRssCandidate(candidate);
    await updateRssCandidateStatus(id, {
      status: "imported",
      articleSlug: slug
    });
  } catch {
    redirect("/admin/rss?error=rss-import-failed");
  }

  redirect(`/admin/articles/${slug}?createdFromRss=1`);
}

function getResourceInput(formData: FormData) {
  const category = requireString(formData, "category") as Resource["category"];
  const status = requireString(formData, "status") as Resource["status"];

  if (!resourceCategoryValues.includes(category) || !resourceStatusValues.includes(status)) {
    return null;
  }

  return {
    title: requireString(formData, "title"),
    description: requireString(formData, "description"),
    category,
    status,
    format: requireString(formData, "format"),
    audience: requireString(formData, "audience"),
    href: requireString(formData, "href"),
    featured: formData.get("featured") === "on",
    archived: formData.get("archived") === "on",
    tags: requireString(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  };
}

export async function createResourceAction(formData: FormData) {
  await requireAdmin();

  const input = getResourceInput(formData);
  if (!input || !input.title || !input.description || !input.href) {
    redirect("/admin/resources/new?error=invalid-resource");
  }

  const id = await createResource(input);
  redirect(`/admin/resources/${id}?created=1`);
}

export async function saveResourceAction(formData: FormData) {
  await requireAdmin();

  const id = requireString(formData, "id");
  const input = getResourceInput(formData);

  if (!id || !input || !input.title || !input.description || !input.href) {
    redirect(`/admin/resources/${id || ""}?error=invalid-resource`);
  }

  const ok = await updateResource(id, input);
  if (!ok) {
    redirect("/admin/resources?error=not-found");
  }

  redirect(`/admin/resources/${id}?saved=1`);
}

export async function setArticleArchivedAction(formData: FormData) {
  await requireAdmin();

  const slug = requireString(formData, "slug");
  const archived = formData.get("archived") === "true";
  const returnTo = requireString(formData, "returnTo") || "/admin";
  const article = await getArticleBySlug(slug);

  if (!article) {
    redirect("/admin?error=not-found");
  }

  await updateArticle(
    slug,
    {
      title: article.title,
      description: article.description,
      date: article.date,
      category: article.category,
      type: article.type,
      readingTime: article.readingTime,
      featured: article.featured,
      published: article.published,
      archived,
      number: article.number,
      source: article.source,
      sourceUrl: article.sourceUrl,
      verified: article.verified,
      access: article.access,
      tags: article.tags,
      audioUrl: article.audioUrl,
      cover: article.cover
    },
    article.content
  );

  redirect(returnTo);
}

export async function setResourceArchivedAction(formData: FormData) {
  await requireAdmin();

  const id = requireString(formData, "id");
  const archived = formData.get("archived") === "true";
  const returnTo = requireString(formData, "returnTo") || "/admin/resources";
  const ok = await setResourceArchived(id, archived);

  if (!ok) {
    redirect("/admin/resources?error=not-found");
  }

  redirect(returnTo);
}

export async function completeArticleTemplateAction(formData: FormData) {
  await requireAdmin();

  const slug = requireString(formData, "slug");
  const article = await getArticleBySlug(slug);

  if (!article) {
    redirect("/admin?error=not-found");
  }

  const nextContent = completeInterpretationTemplate(article.content, {
    title: article.title,
    sourceUrl: article.sourceUrl,
    source: article.source,
    description: article.description
  });

  await updateArticle(
    slug,
    {
      title: article.title,
      description: article.description,
      date: article.date,
      category: article.category,
      type: article.type,
      readingTime: article.readingTime,
      featured: article.featured,
      published: article.published,
      archived: article.archived,
      number: article.number,
      source: article.source,
      sourceUrl: article.sourceUrl,
      verified: article.verified,
      access: article.access,
      tags: article.tags,
      audioUrl: article.audioUrl,
      cover: article.cover
    },
    nextContent
  );

  redirect(`/admin/articles/${slug}?templated=1`);
}

export async function generateArticleDraftAction(formData: FormData) {
  await requireAdmin();

  const slug = requireString(formData, "slug");
  const article = await getArticleBySlug(slug);

  if (!article) {
    redirect("/admin?error=not-found");
  }

  let content: string;

  try {
    content = await generateArticleDraft(article);
  } catch {
    redirect(`/admin/articles/${slug}?error=ai-draft-failed`);
  }

  await updateArticle(
    slug,
    {
      title: article.title,
      description: article.description,
      date: article.date,
      category: article.category,
      type: article.type,
      readingTime: article.readingTime,
      featured: article.featured,
      published: false,
      archived: article.archived,
      number: article.number,
      source: article.source,
      sourceUrl: article.sourceUrl,
      verified: article.verified,
      access: article.access,
      tags: article.tags,
      audioUrl: article.audioUrl,
      cover: article.cover
    },
    content
  );

  redirect(`/admin/articles/${slug}?aiDraft=1`);
}

function getRevisionString(
  meta: Record<string, unknown>,
  key: string,
  fallback?: string
) {
  const value = meta[key];
  return typeof value === "string" ? value : fallback ?? "";
}

function getRevisionBoolean(meta: Record<string, unknown>, key: string, fallback = false) {
  const value = meta[key];
  return typeof value === "boolean" ? value : fallback;
}

function getRevisionNumber(meta: Record<string, unknown>, key: string, fallback = 0) {
  const value = meta[key];
  return typeof value === "number" ? value : fallback;
}

function getRevisionTags(meta: Record<string, unknown>, fallback: string[]) {
  const value = meta.tags;
  return Array.isArray(value) ? value.map(String).filter(Boolean) : fallback;
}

export async function restoreArticleRevisionAction(formData: FormData) {
  await requireAdmin();

  const slug = requireString(formData, "slug");
  const revisionId = requireString(formData, "revisionId");
  const article = await getArticleBySlug(slug);
  const revision = await getSupabaseArticleRevision(slug, revisionId);

  if (!slug || !revisionId || !article || !revision) {
    redirect(`/admin/articles/${slug || ""}?error=revision-not-found`);
  }

  const category = getRevisionString(
    revision.meta,
    "category",
    article.category
  ) as ArticleCategory;
  const type = getRevisionString(revision.meta, "type", article.type) as ArticleType;
  const access = getRevisionString(
    revision.meta,
    "access",
    article.access
  ) as ArticleAccess;

  if (
    !categoryValues.includes(category) ||
    !typeValues.includes(type) ||
    !accessValues.includes(access)
  ) {
    redirect(`/admin/articles/${slug}/revisions/${revisionId}?error=invalid-revision`);
  }

  await updateArticle(
    slug,
    {
      title: revision.title,
      description: revision.description,
      date: getRevisionString(revision.meta, "date", article.date),
      category,
      type,
      readingTime: getRevisionString(revision.meta, "readingTime", article.readingTime),
      featured: getRevisionBoolean(revision.meta, "featured", article.featured),
      published: getRevisionBoolean(revision.meta, "published", article.published),
      archived: getRevisionBoolean(revision.meta, "archived", article.archived),
      number: getRevisionNumber(revision.meta, "number", article.number),
      source: getRevisionString(revision.meta, "source", article.source),
      sourceUrl: getRevisionString(revision.meta, "sourceUrl", article.sourceUrl),
      verified: getRevisionBoolean(revision.meta, "verified", article.verified),
      access,
      tags: getRevisionTags(revision.meta, article.tags),
      audioUrl: getRevisionString(revision.meta, "audioUrl", article.audioUrl),
      cover: getRevisionString(revision.meta, "cover", article.cover)
    },
    revision.body
  );

  redirect(`/admin/articles/${slug}?restored=1`);
}
