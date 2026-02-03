import DOMPurify from "isomorphic-dompurify";

/** Allowed tags for post body HTML (safe subset for WordPress content). */
const ALLOWED_TAGS = [
  "p", "br", "h2", "h3", "h4", "h5", "h6",
  "a", "ul", "ol", "li", "strong", "em", "b", "i",
  "blockquote", "img", "figure", "figcaption",
  "pre", "code", "span", "div",
];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "width", "height", "id", "class"];

/**
 * Sanitize post HTML before render. Allows safe tags and attributes; strips script, event handlers, risky protocols.
 */
export function sanitizePostHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target"],
  });
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Truncate text to a maximum number of words, appending ellipsis if truncated. */
export function truncateToWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return trimmed;
  return words.slice(0, maxWords).join(" ") + " …";
}

export function calculateReadingTime(content: string, wordsPerMinute = 200): number {
  const wordCount = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/** TOC levels: H2–H6 (H1 is the post title and excluded per SEO best practice). */
export interface TocItem {
  level: 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string;
}

export interface ProcessedContent {
  headings: TocItem[];
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/** Extract H2–H6 for TOC (H1 excluded; proper heading hierarchy per SEO). */
export function extractHeadings(html: string): TocItem[] {
  const headings: TocItem[] = [];
  const regex = /<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3 | 4 | 5 | 6;
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (text) headings.push({ level, text, id: slugify(text) });
  }

  return headings;
}

export function addHeadingIds(html: string, headings: TocItem[]): string {
  if (headings.length === 0) return html;

  const seen = new Map<string, number>();
  const uniqueIds = headings.map((item) => {
    const count = seen.get(item.id) ?? 0;
    const id = count === 0 ? item.id : `${item.id}-${count}`;
    seen.set(item.id, count + 1);
    return id;
  });

  let index = 0;
  return html.replace(
    /<(h[2-6])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, inner) => {
      const id = uniqueIds[index++];
      if (!id || attrs.includes("id=")) return match;
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    }
  );
}

/** Remove WordPress / Gutenberg Table of Contents block from HTML so only our sidebar TOC shows. */
function stripEmbeddedToc(html: string): string {
  return html.replace(
    /<nav[^>]*wp-block-table-of-contents[^>]*>[\s\S]*?<\/nav>/gi,
    ""
  );
}

export function processContentForToc(html: string): ProcessedContent {
  const sanitized = sanitizePostHtml(html);
  const headings = extractHeadings(sanitized);
  const seen = new Map<string, number>();
  const headingsWithUniqueIds: TocItem[] = headings.map((item) => {
    const count = seen.get(item.id) ?? 0;
    const id = count === 0 ? item.id : `${item.id}-${count}`;
    seen.set(item.id, count + 1);
    return { ...item, id };
  });
  let content = addHeadingIds(sanitized, headingsWithUniqueIds);
  content = stripEmbeddedToc(content);
  return { headings: headingsWithUniqueIds, content };
}
