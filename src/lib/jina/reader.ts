/**
 * Jina Reader - Fetches web pages and returns clean, LLM-compatible text/markdown.
 * https://r.jina.ai/{url}
 * No API key required for basic use (20 RPM). Use JINA_API_KEY for higher limits.
 */

import type { CompetitorArticle } from "@/lib/pipeline/types";

const JINA_READER_BASE = "https://r.jina.ai";
/** Stagger between starting each URL fetch (ms) to be respectful to rate limits. */
const JINA_STAGGER_MS = 400;

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
 * Fetch multiple URLs via Jina Reader with staggered parallel requests.
 * Callers can override maxUrls (default 3 for diminishing returns on 4th/5th article).
 */
export async function fetchCompetitorUrls(
  urls: string[],
  maxUrls = 3
): Promise<FetchResult[]> {
  const toFetch = urls.slice(0, maxUrls).map((u) => u.trim()).filter(Boolean);
  const promises = toFetch.map(
    (url, i) =>
      new Promise<FetchResult>((resolve) => {
        setTimeout(() => fetchViaJinaReader(url).then(resolve), i * JINA_STAGGER_MS);
      })
  );
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
 * Fetch competitor content from URLs in parallel with a short stagger (400ms) to
 * respect rate limits. Each URL has its own 15s timeout. Failed fetches return an
 * entry with fetchSuccess: false and empty content (no throw).
 * @param maxUrls Default 3; callers can override (diminishing returns on 4th/5th).
 */
export async function fetchCompetitorContent(
  urls: string[],
  maxUrls = 3
): Promise<CompetitorArticle[]> {
  const toFetch = urls.slice(0, maxUrls).map((u) => u.trim()).filter(Boolean);
  const promises = toFetch.map(
    (url, i) =>
      new Promise<FetchResult>((resolve) => {
        setTimeout(() => fetchViaJinaReader(url).then(resolve), i * JINA_STAGGER_MS);
      })
  );
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
    return {
      url: r.url,
      title,
      content: r.content,
      wordCount: wordCount(r.content),
      fetchSuccess: r.success,
    };
  });
}
