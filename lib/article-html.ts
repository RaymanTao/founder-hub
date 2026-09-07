export const articleHtmlMarker = "<!-- founder-hub:article-html -->";

const allowedTags = new Set([
  "a", "article", "blockquote", "br", "caption", "code", "col", "colgroup",
  "div", "em", "figure", "figcaption", "h1", "h2", "h3", "h4", "hr", "img",
  "li", "ol", "p", "pre", "section", "source", "strong", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "ul", "video", "iframe"
]);

const allowedAttributes = new Set([
  "alt", "colspan", "controls", "height", "href", "loading", "loop", "muted", "poster",
  "rel", "rowspan", "src", "target", "title", "width"
]);

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function sanitizeAttributes(attributes: string, tagName: string) {
  return attributes.replace(
    /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
    (full, name: string, doubleQuoted?: string, singleQuoted?: string, unquoted?: string) => {
      const attribute = name.toLowerCase();
      if (!allowedAttributes.has(attribute)) return "";

      const value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
      if (["src", "href", "poster"].includes(attribute)) {
        const url = safeUrl(value);
        if (!url) return "";
        return ` ${attribute}="${url.replace(/"/g, "&quot;")}"`;
      }

      if (attribute === "target" && value !== "_blank") return "";
      if (attribute === "rel" && tagName === "a") return ' rel="noreferrer"';
      if (!value) return ` ${attribute}`;
      return ` ${attribute}="${value.replace(/"/g, "&quot;")}"`;
    }
  );
}

export function sanitizeArticleHtml(input: string) {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|canvas|form|button|object|embed|link|meta|base)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<([a-z][\w-]*)([^>]*)>/gi, (full, tagName: string, attributes: string) => {
      const tag = tagName.toLowerCase();
      if (!allowedTags.has(tag)) return "";
      const selfClosing = /\/\s*>$/.test(full) || ["br", "col", "img", "source", "hr"].includes(tag);
      return `<${tag}${sanitizeAttributes(attributes.replace(/\/\s*$/, ""), tag)}${selfClosing ? " />" : ">"}`;
    })
    .replace(/<\/(?:script|style|noscript|svg|canvas|form|button|object|embed|link|meta|base)\s*>/gi, "")
    .trim();
}

export function htmlToReadableText(input: string) {
  return input
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|li|h[1-6]|blockquote|tr|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

function normalizeTitle(value: string) {
  return value.replace(/[\s\u00a0]+/g, " ").trim().toLowerCase();
}

export function removeDuplicateTitleHeading(input: string, title: string) {
  const expected = normalizeTitle(title);
  if (!expected) return input;

  let removed = false;
  return input.replace(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (full, _level: string, inner: string) => {
    if (!removed && normalizeTitle(htmlToReadableText(inner)) === expected) {
      removed = true;
      return "";
    }
    return full;
  });
}
