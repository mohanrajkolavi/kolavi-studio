/**
 * Jina Reader - Fetches web pages and returns clean, LLM-compatible text/markdown.
 * https://r.jina.ai/{url}
 * No API key required for basic use (20 RPM). Use JINA_API_KEY for higher limits.
 */

import type { CompetitorArticle } from "@/lib/pipeline/types";

const JINA_READER_BASE = "https://r.jina.ai";
/** Max concurrent Jina fetches. With API key we allow 3 concurrent; without, 2 to respect rate limits. */
const JINA_CONCURRENCY = process.env.JINA_API_KEY ? 3 : 2;

export type FetchResult = {
  url: string;
  content: string;
  success: boolean;
  error?: string;
};

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractTitleFromContent(content: string, url: string): string {
  const firstLine = content.split("\n").find((l) => l.startsWith("# "));
  if (firstLine) return firstLine.replace(/^#\s+/, "").trim();
  try {
    const path = new URL(url).pathname;
    const slug = path.split("/").filter(Boolean).pop();
    if (slug) return decodeURIComponent(slug).replace(/-/g, " ");
  } catch {
    // ignore
  }
  return url;
}

/**
 * Extract the most recent date from scraped content.
 * Prioritizes "last updated" / "modified" dates over publish dates,
 * since updated content is fresher even if originally published long ago.
 */
function extractFreshnessDate(content: string): string | undefined {
  const isoDateRe = /(20\d{2}-\d{2}-\d{2})/;
  const naturalDateRe = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}/i;

  // --- Priority 1: Look for "Updated" / "Modified" anywhere in the content ---
  const updatePatterns = [
    /(?:last\s+)?(?:updated|modified|revised|edited)\s*(?:on|:)?\s*/gi,
    /dateModified["\s:]+/gi,
    /article:modified_time["\s:]+/gi,
  ];

  for (const pattern of updatePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      // Look for a date right after the "updated" label (within 80 chars)
      const after = content.slice(match.index + match[0].length, match.index + match[0].length + 80);
      const isoMatch = after.match(isoDateRe);
      if (isoMatch) return isoMatch[1];
      const naturalMatch = after.match(naturalDateRe);
      if (naturalMatch) return naturalMatch[0];
    }
  }

  // --- Priority 2: Fall back to earliest date in first 500 chars (likely publish date) ---
  const head = content.slice(0, 500);
  const isoMatch = head.match(isoDateRe);
  if (isoMatch) return isoMatch[1];
  const naturalMatch = head.match(naturalDateRe);
  if (naturalMatch) return naturalMatch[0];

  return undefined;
}

/** Compute freshness score 0-1 based on publish date. */
function computeFreshnessScore(publishDate?: string): number {
  if (!publishDate) return 0.5; // unknown = neutral
  try {
    const date = new Date(publishDate);
    if (isNaN(date.getTime())) return 0.5;
    const ageMs = Date.now() - date.getTime();
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths <= 3) return 1.0;
    if (ageMonths <= 6) return 0.9;
    if (ageMonths <= 12) return 0.7;
    if (ageMonths <= 18) return 0.5;
    if (ageMonths <= 24) return 0.3;
    return 0.1; // >2 years old
  } catch {
    return 0.5;
  }
}

// ---------------------------------------------------------------------------
// Semaphore for concurrent fetch limiting
// ---------------------------------------------------------------------------

class Semaphore {
  private queue: (() => void)[] = [];
  private active = 0;
  constructor(private readonly max: number) {}
  async acquire(): Promise<void> {
    if (this.active < this.max) { this.active++; return; }
    return new Promise<void>((resolve) => { this.queue.push(resolve); });
  }
  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) { this.active++; next(); }
  }
}

/**
 * Fetch a single URL via Jina Reader.
 * Returns clean markdown/text of the page content.
 */
export async function fetchViaJinaReader(url: string): Promise<FetchResult> {
  const trimmedUrl = url.trim();
  try {
    // Ensure URL has protocol (Jina expects raw URL path, not encoded)
    const targetUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`;
    const jinaUrl = `${JINA_READER_BASE}/${targetUrl}`;

    const headers: HeadersInit = {
      "Accept": "text/markdown",
      "User-Agent": "KolaviStudio-BlogMaker/1.0",
    };

    if (process.env.JINA_API_KEY) {
      headers["X-Api-Key"] = process.env.JINA_API_KEY;
    }

    const response = await fetch(jinaUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000), // 15s timeout per URL
    });

    if (!response.ok) {
      return {
        url: targetUrl,
        content: "",
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const content = await response.text();

    // Jina may return empty or error content
    const trimmed = content?.trim() || "";
    if (!trimmed) {
      return {
        url: targetUrl,
        content: "",
        success: false,
        error: "Empty response",
      };
    }

    // Truncate very long content (downstream slices to 12k total; 5k per article is sufficient)
    const maxChars = 5000;
    const truncated =
      trimmed.length > maxChars
        ? trimmed.slice(0, maxChars) + "\n\n[... content truncated for length ...]"
        : trimmed;

    return {
      url: targetUrl,
      content: truncated,
      success: true,
    };
  } catch (error) {
    return {
      url: trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`,
      content: "",
      success: false,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

/**
 * Fetch multiple URLs via Jina Reader with concurrent requests limited by semaphore.
 * Callers can override maxUrls (default 3 for diminishing returns on 4th/5th article).
 */
export async function fetchCompetitorUrls(
  urls: string[],
  maxUrls = 3
): Promise<FetchResult[]> {
  const toFetch = urls.slice(0, maxUrls).map((u) => u.trim()).filter(Boolean);
  const sem = new Semaphore(JINA_CONCURRENCY);
  const promises = toFetch.map(async (url): Promise<FetchResult> => {
    await sem.acquire();
    try {
      return await fetchViaJinaReader(url);
    } finally {
      sem.release();
    }
  });
  const settled = await Promise.allSettled(promises);
  return settled.map((s, i): FetchResult => {
    if (s.status === "fulfilled") return s.value;
    const url = toFetch[i] ?? "";
    return {
      url,
      content: "",
      success: false,
      error: s.reason instanceof Error ? s.reason.message : String(s.reason),
    };
  });
}

/**
 * Fetch competitor content from URLs with concurrent requests limited by semaphore.
 * Each URL has its own 15s timeout. Failed fetches return an entry with
 * fetchSuccess: false and empty content (no throw).
 * @param maxUrls Default 3; callers can override (diminishing returns on 4th/5th).
 */
export async function fetchCompetitorContent(
  urls: string[],
  maxUrls = 3
): Promise<CompetitorArticle[]> {
  const toFetch = urls.slice(0, maxUrls).map((u) => u.trim()).filter(Boolean);
  const sem = new Semaphore(JINA_CONCURRENCY);
  const promises = toFetch.map(async (url): Promise<FetchResult> => {
    await sem.acquire();
    try {
      return await fetchViaJinaReader(url);
    } finally {
      sem.release();
    }
  });
  const settled = await Promise.allSettled(promises);
  const results = settled.map((s, i): FetchResult => {
    if (s.status === "fulfilled") return s.value;
    const url = toFetch[i] ?? "";
    return {
      url,
      content: "",
      success: false,
      error: s.reason instanceof Error ? s.reason.message : String(s.reason),
    };
  });

  return results.map((r, i): CompetitorArticle => {
    const url = toFetch[i] ?? "";
    const title = r.success ? extractTitleFromContent(r.content, r.url) : "";
    const publishDate = r.success ? extractFreshnessDate(r.content) : undefined;
    return {
      url: r.url,
      title,
      content: r.content,
      wordCount: wordCount(r.content),
      fetchSuccess: r.success,
      publishDate,
      freshnessScore: computeFreshnessScore(publishDate),
    };
  });
}
