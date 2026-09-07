import Image from "next/image";
import type { ReactNode } from "react";
import { articleHtmlMarker, removeDuplicateTitleHeading, sanitizeArticleHtml } from "@/lib/article-html";

function renderInline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, label, href] = match;
        return (
          <a
            key={`${part}-${index}`}
            href={href}
            className="text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-4"
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
          >
            {label}
          </a>
        );
      }
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

export function renderMarkdown(content: string, options: { title?: string } = {}) {
  if (content.trimStart().startsWith(articleHtmlMarker)) {
    const html = content.trimStart().slice(articleHtmlMarker.length).trim();
    const safeHtml = removeDuplicateTitleHeading(sanitizeArticleHtml(html), options.title ?? "");
    return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  }

  let skippedDuplicateTitle = false;
  const normalizedTitle = options.title?.replace(/[\s\u00a0]+/g, " ").trim().toLowerCase();
  const lines = content.split("\n").filter((line) => {
    if (skippedDuplicateTitle || !normalizedTitle || !line.trim().startsWith("# ")) return true;
    if (line.trim().slice(2).replace(/[\s\u00a0]+/g, " ").trim().toLowerCase() !== normalizedTitle) return true;
    skippedDuplicateTitle = true;
    return false;
  });
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let quoteLines: string[] = [];
  let codeLines: string[] = [];
  let tableLines: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      nodes.push(
        <p key={`p-${nodes.length}`}>{renderInline(paragraph.join(" "))}</p>
      );
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`}>
          {listItems.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushQuote = () => {
    if (quoteLines.length) {
      nodes.push(
        <blockquote key={`q-${nodes.length}`}>
          {renderInline(quoteLines.join(" "))}
        </blockquote>
      );
      quoteLines = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length) {
      nodes.push(
        <pre key={`code-${nodes.length}`}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      codeLines = [];
    }
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      tableLines = [];
      return;
    }
    const rows = tableLines
      .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
      .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    if (rows.length) {
      const width = Math.max(...rows.map((row) => row.length));
      nodes.push(
        <div key={`table-${nodes.length}`} className="my-6 overflow-x-auto">
          <table>
            <thead><tr>{rows[0].map((cell, index) => <th key={`${cell}-${index}`}>{renderInline(cell)}</th>)}</tr></thead>
            <tbody>{rows.slice(1).map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{[...row, ...Array(width - row.length).fill("")].map((cell, index) => <td key={`${rowIndex}-${index}`}>{renderInline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    tableLines = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      if (inCode) {
        flushCode();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      continue;
    }

    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushParagraph();
      flushList();
      flushQuote();
      tableLines.push(line.trim());
      continue;
    }

    if (tableLines.length) flushTable();

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(<h1 key={`h1-${nodes.length}`}>{line.slice(2)}</h1>);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(<h2 key={`h2-${nodes.length}`}>{line.slice(3)}</h2>);
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(<h3 key={`h3-${nodes.length}`}>{line.slice(4)}</h3>);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quoteLines.push(line.slice(2));
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushQuote();
      listItems.push(line.slice(2));
      continue;
    }

    if (line.startsWith("![")) {
      flushParagraph();
      flushList();
      flushQuote();
      const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (match) {
        const [, alt, src] = match;
        nodes.push(
          <Image
            key={`img-${nodes.length}`}
            src={src}
            alt={alt}
            width={1200}
            height={720}
            unoptimized
            className="my-8 w-full rounded-3xl border border-[var(--border)]"
          />
        );
      }
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushCode();
  flushTable();

  return nodes;
}
