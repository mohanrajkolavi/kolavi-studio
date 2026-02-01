export interface TocItem {
  level: 2 | 3;
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

export function extractHeadings(html: string): TocItem[] {
  const headings: TocItem[] = [];
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3;
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    headings.push({ level, text, id: slugify(text) });
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
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, inner) => {
      const id = uniqueIds[index++];
      if (!id || attrs.includes("id=")) return match;
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    }
  );
}

export function processContentForToc(html: string): ProcessedContent {
  const headings = extractHeadings(html);
  const seen = new Map<string, number>();
  const headingsWithUniqueIds: TocItem[] = headings.map((item) => {
    const count = seen.get(item.id) ?? 0;
    const id = count === 0 ? item.id : `${item.id}-${count}`;
    seen.set(item.id, count + 1);
    return { ...item, id };
  });
  const content = addHeadingIds(html, headingsWithUniqueIds);
  return { headings: headingsWithUniqueIds, content };
}
