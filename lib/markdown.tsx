import Image from "next/image";
import type { ReactNode } from "react";

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

export function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let quoteLines: string[] = [];
  let codeLines: string[] = [];
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

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      flushQuote();
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
      continue;
    }

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

  return nodes;
}
