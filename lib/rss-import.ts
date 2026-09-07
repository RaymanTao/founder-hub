import { analyzeRssCandidate } from "@/lib/rss-ai";
import { getRssFeeds } from "@/lib/rss-feeds";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";
import { createArticleFromRssCandidate } from "@/lib/admin-content";
import { getRssCandidateByCanonicalUrl } from "@/lib/rss-items";
import { articleHtmlMarker, htmlToReadableText, removeDuplicateTitleHeading, sanitizeArticleHtml } from "@/lib/article-html";
import type { ArticleCategory, ArticleType } from "@/types/article";
import type { RssCandidate } from "@/types/rss";

type Feed = Awaited<ReturnType<typeof getRssFeeds>>[number];

function decodeXml(input: string) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] ?? "");
}

function getLink(block: string) {
  return decodeXml(
    block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
      getTag(block, "link")
  );
}

function getItems(xml: string) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return blocks
    .map((block) => ({
      title: getTag(block, "title"),
      link: getLink(block),
      description: getTag(block, "description") || getTag(block, "summary") || getTag(block, "content:encoded"),
      date: getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated")
    }))
    .filter((item) => item.title);
}

function decodeHtml(input: string) {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/section>|<\/article>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&hellip;/gi, "…")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

function extractElement(html: string, openingTag: RegExp) {
  const match = openingTag.exec(html);
  if (!match || match.index === undefined) return "";

  const opening = match[0];
  const tagName = opening.match(/^<([a-z0-9]+)/i)?.[1];
  if (!tagName) return "";

  const tokenPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = match.index + opening.length;
  let depth = 1;
  let token: RegExpExecArray | null;

  while ((token = tokenPattern.exec(html))) {
    if (/^<\//.test(token[0])) {
      depth -= 1;
      if (depth === 0) return html.slice(match.index, tokenPattern.lastIndex);
    } else if (!/\/\s*>$/.test(token[0])) {
      depth += 1;
    }
  }

  return html.slice(match.index);
}

function selectArticleContainer(html: string) {
  const selectors = [
    /<div\b[^>]*\bid=["']js_content["'][^>]*>/i,
    /<(?:div|section)\b[^>]*\bclass=["'][^"']*(?:article-content|post-content|entry-content|article-body|post-body)[^"']*["'][^>]*>/i,
    /<article\b[^>]*>/i,
    /<main\b[^>]*>/i
  ];

  for (const selector of selectors) {
    const selected = extractElement(html, selector);
    if (selected) return selected;
  }

  return html;
}

function removeNoiseContainers(html: string) {
  const selectors = [
    /<(?:div|section|aside)\b[^>]*(?:id|class)=["'][^"']*(?:qrcode|qr-code|qr_code|reward|comment|share|recommend|related|table-of-contents)[^"']*["'][^>]*>/i,
    /<(?:div|section|aside)\b[^>]*\bid=["'](?:js_pc_qr_code|js_profile_qrcode)["'][^>]*>/i
  ];
  let content = html;

  for (const selector of selectors) {
    let match: RegExpExecArray | null;
    while ((match = selector.exec(content)) && match.index !== undefined) {
      const block = extractElement(content, selector);
      if (!block) break;
      content = `${content.slice(0, match.index)}${content.slice(match.index + block.length)}`;
    }
  }

  return content;
}

function absoluteUrl(value: string, pageUrl: string) {
  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return "";
  }
}

function tableToMarkdown(table: string) {
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) => [...row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
      .map((cell) => decodeHtml(cell[1]).replace(/\|/g, "\\|").replace(/\n+/g, " ").trim()))
    .filter((row) => row.length);
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
  const header = normalized[0];
  const divider = header.map(() => "---");
  return `\n\n| ${header.join(" | ")} |\n| ${divider.join(" | ")} |\n${normalized.slice(1).map((row) => `| ${row.join(" | ")} |`).join("\n")}\n\n`;
}

function htmlToMarkdown(html: string, pageUrl: string) {
  let content = html;
  content = content.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => tableToMarkdown(table));
  content = content.replace(/<(?:video|audio)\b[^>]*>[\s\S]*?<\/(?:video|audio)>/gi, (media) => {
    const src = media.match(/<source\b[^>]*src=["']([^"']+)["']/i)?.[1] ?? media.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? "";
    const url = absoluteUrl(src, pageUrl);
    return url ? `\n\n[查看原视频](${url})\n\n` : "";
  });
  content = content.replace(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi, (_, src: string) => {
    const url = absoluteUrl(src, pageUrl);
    return url ? `\n\n[查看嵌入视频](${url})\n\n` : "";
  });
  content = content.replace(/<img\b[^>]*>/gi, (image) => {
    const src = image.match(/\b(?:src|data-src)=["']([^"']+)["']/i)?.[1] ?? "";
    const url = absoluteUrl(src, pageUrl);
    const alt = image.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "原文图片";
    return url ? `\n\n![${alt.replace(/\]/g, "\\]")}](${url})\n\n` : "";
  });
  content = content
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "$1")
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "$1")
    .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, "$1")
    .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "$1")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/(?:p|div|section|article|figure|figcaption|li|blockquote|pre)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeHtml(content).replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}

function hasReadableArticleText(content: string) {
  const text = htmlToReadableText(content).replace(/\s/g, "").trim();
  return text.length >= 20;
}

function normalizeArticleHtml(html: string, pageUrl: string) {
  return sanitizeArticleHtml(
    html
      .replace(/<img\b[^>]*>/gi, (image) => {
        const source = image.match(/\b(?:data-src|data-original)=['"]([^'"]+)['"]/i)?.[1] ??
          image.match(/\bsrc=['"]([^'"]+)['"]/i)?.[1] ?? "";
        const url = absoluteUrl(source, pageUrl);
        return url ? image.replace(/\b(?:src|data-src|data-original)=['"][^'"]*['"]/i, `src="${url}"`) : image;
      })
      .replace(/<iframe\b[^>]*\bsrc=['"]([^'"]+)['"][^>]*>/gi, (frame, source: string) => {
        const url = absoluteUrl(source, pageUrl);
        return url ? frame.replace(source, url) : frame;
      })
      .replace(/<source\b[^>]*\bsrc=['"]([^'"]+)['"][^>]*>/gi, (sourceTag, source: string) => {
        const url = absoluteUrl(source, pageUrl);
        return url ? sourceTag.replace(source, url) : sourceTag;
      })
  );
}

function extractArticleContent(html: string, pageUrl: string, title: string) {
  const withoutNoise = removeNoiseContainers(
    html.replace(/<(script|style|noscript|svg|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, "")
  );
  const article = selectArticleContainer(withoutNoise);
  const normalizedHtml = removeDuplicateTitleHeading(
    normalizeArticleHtml(article, pageUrl),
    title
  );
  const images = [...normalizedHtml.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((url, index, list) => url && list.indexOf(url) === index)
    .slice(0, 20);
  return {
    content: `${articleHtmlMarker}\n${normalizedHtml}`,
    images
  };
}

async function fetchArticleContent(url: string, title: string) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "FounderHubRSSBot/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return { content: "", images: [] };
    return extractArticleContent(await response.text(), url, title);
  } catch {
    return { content: "", images: [] };
  }
}

function canonicalizeUrl(input: string) {
  try {
    const url = new URL(input);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "source"].forEach((key) =>
      url.searchParams.delete(key)
    );
    return url.toString().replace(/\/$/, "");
  } catch {
    return input.trim();
  }
}

function scoreItem(title: string, description: string, dateValue: string, feed: Feed) {
  const text = `${title} ${description} ${(feed.tags ?? []).join(" ")}`.toLowerCase();
  const keywords = ["创业", "融资", "founder", "startup", "indie", "solo", "ai", "agent", "产品", "增长", "case", "launch"];
  const matched = keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
  const relevanceScore = Math.min(100, 45 + matched * 9);
  const founderValueScore = Math.min(100, Number(feed.trustScore ?? 70) + matched * 4);
  const date = new Date(dateValue);
  const ageInDays = Number.isNaN(date.getTime()) ? 0 : Math.max(0, (Date.now() - date.getTime()) / 86400000);
  const freshnessScore = Math.max(35, Math.round(100 - ageInDays * 4));
  return { relevanceScore, founderValueScore, freshnessScore, score: Math.round(relevanceScore * 0.35 + founderValueScore * 0.4 + freshnessScore * 0.25) };
}

function toCandidate(item: ReturnType<typeof getItems>[number], feed: Feed): RssCandidate {
  const canonicalUrl = canonicalizeUrl(item.link || `${feed.url}#${item.title}`);
  const publishedAt = item.date && !Number.isNaN(new Date(item.date).getTime())
    ? new Date(item.date).toISOString()
    : new Date().toISOString();
  const scores = scoreItem(item.title, item.description, publishedAt, feed);
  return {
    id: canonicalUrl,
    feedId: feed.id,
    feedTitle: feed.title,
    feedUrl: feed.url,
    title: item.title,
    url: item.link || canonicalUrl,
    canonicalUrl,
    description: item.description,
    content: "",
    images: [],
    publishedAt,
    category: feed.category as ArticleCategory,
    type: feed.type as ArticleType,
    language: feed.language ?? "zh-CN",
    status: "pending",
    ...scores,
    duplicateRisk: "low",
    suggestedTags: feed.tags ?? [],
    aiSummary: null,
    founderTakeaway: null,
    aiReason: null,
    analyzedAt: null,
    articleSlug: null,
    importedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runWorker = async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

export async function importRssCandidates(limit = 5) {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const feeds = (await getRssFeeds()).filter((feed) => feed.enabled && feed.url);

  const results = await mapWithConcurrency(feeds, 3, async (feed) => {
    try {
      let response: Response;
      try {
      response = await fetch(feed.url, {
        headers: { "user-agent": "FounderHubRSSBot/1.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
      } catch (error) {
        console.warn(`RSS feed skipped: ${feed.title}`, error);
        return { feedCount: 0, itemCount: 0, failedFeedCount: 1 };
      }
      if (!response.ok) {
        console.warn(`RSS feed skipped: ${feed.title} returned ${response.status}`);
        return { feedCount: 0, itemCount: 0, failedFeedCount: 1 };
      }
    const items = getItems(await response.text()).slice(0, limit);
    let itemCount = 0;
    const payload = [];
    for (const item of items) {
      const candidate = toCandidate(item, feed);
      const existing = await getRssCandidateByCanonicalUrl(candidate.canonicalUrl);
      if (existing) continue;
      const article = await fetchArticleContent(candidate.url, candidate.title);
      const articleContent = article.content;
      if (!articleContent || !hasReadableArticleText(articleContent) || !article.images.length) {
        console.warn(`RSS article skipped without readable text and image: ${candidate.title}`);
        continue;
      }
      const readableContent = htmlToReadableText(articleContent);
      const aiCandidate = readableContent
        ? { ...candidate, description: readableContent.slice(0, 12000) }
        : candidate;
      let analysis = null;
      if (process.env.DEEPSEEK_API_KEY || process.env.ZHIPU_API_KEY) {
        try {
          analysis = await analyzeRssCandidate(aiCandidate);
        } catch (error) {
          console.warn(`RSS AI skipped for ${candidate.title}:`, error);
        }
      }
      let articleSlug: string | null = null;
      const shouldPublish = Boolean(analysis && analysis.score >= 80 && analysis.duplicateRisk !== "high");
      if (!analysis || !shouldPublish) {
        console.warn(`RSS article rejected by AI: ${candidate.title}`);
        continue;
      }
      const publishedCandidate: RssCandidate = {
        ...candidate,
        suggestedTags: analysis.suggestedTags,
        relevanceScore: analysis.relevanceScore,
        founderValueScore: analysis.founderValueScore,
        freshnessScore: analysis.freshnessScore,
        score: analysis.score,
        duplicateRisk: analysis.duplicateRisk,
        aiSummary: analysis.aiSummary,
        founderTakeaway: analysis.founderTakeaway,
        aiReason: analysis.aiReason,
        analyzedAt: new Date().toISOString()
      };
      try {
        articleSlug = await createArticleFromRssCandidate(publishedCandidate, {
          content: articleContent,
          published: true,
          cover: article.images[0]
        });
      } catch (error) {
        console.warn(`RSS article publish skipped for ${candidate.title}:`, error);
      }
      if (!articleSlug) continue;
      payload.push({
        feed_id: candidate.feedId,
        feed_title: candidate.feedTitle,
        feed_url: candidate.feedUrl,
        title: candidate.title,
        url: candidate.url,
        canonical_url: candidate.canonicalUrl,
        description: candidate.description || null,
        content: articleContent,
        images: article.images,
        published_at: candidate.publishedAt,
        category: candidate.category,
        type: candidate.type,
        language: candidate.language,
        status: "imported",
        relevance_score: analysis?.relevanceScore ?? candidate.relevanceScore,
        founder_value_score: analysis?.founderValueScore ?? candidate.founderValueScore,
        freshness_score: analysis?.freshnessScore ?? candidate.freshnessScore,
        score: analysis?.score ?? candidate.score,
        duplicate_risk: analysis?.duplicateRisk ?? candidate.duplicateRisk,
        suggested_tags: analysis?.suggestedTags ?? candidate.suggestedTags,
        ai_summary: analysis?.aiSummary ?? null,
        founder_takeaway: analysis?.founderTakeaway ?? null,
        ai_reason: analysis?.aiReason ?? null,
        analyzed_at: analysis ? new Date().toISOString() : null,
        article_slug: articleSlug,
        imported_at: articleSlug ? new Date().toISOString() : null,
        raw_payload: { title: candidate.title, link: candidate.url, description: candidate.description, date: candidate.publishedAt }
      });
    }
    if (payload.length) {
      const upsert = await supabaseFetch("rss_items?on_conflict=canonical_url&select=id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify(payload)
      });
      if (!upsert.ok) {
        const detail = (await upsert.text()).trim().slice(0, 240);
        throw new Error(`${feed.id}_UPSERT_FAILED_${upsert.status}${detail ? `: ${detail}` : ""}`);
      }
      const rows = await upsert.json();
      itemCount += Array.isArray(rows) ? rows.length : 0;
    }
      return { feedCount: 1, itemCount, failedFeedCount: 0 };
    } catch (error) {
      console.warn(`RSS feed processing skipped: ${feed.title}`, error);
      return { feedCount: 0, itemCount: 0, failedFeedCount: 1 };
    }
  });

  return {
    feedCount: results.reduce((total, result) => total + result.feedCount, 0),
    itemCount: results.reduce((total, result) => total + result.itemCount, 0),
    configuredFeedCount: feeds.length,
    failedFeedCount: results.reduce((total, result) => total + result.failedFeedCount, 0)
  };
}
