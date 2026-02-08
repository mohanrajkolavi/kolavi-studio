/**
 * Jina Reader - Fetches web pages and returns clean, LLM-compatible text/markdown.
 * https://r.jina.ai/{url}
 * No API key required for basic use (20 RPM). Use JINA_API_KEY for higher limits.
 */

import type { CompetitorArticle } from "@/lib/pipeline/types";

const JINA_READER_BASE = "https://r.jina.ai";

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

    // Truncate very long content to avoid token overflow (keep ~8k chars per article)
    const maxChars = 8000;
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
 * Fetch multiple URLs via Jina Reader, one after another to respect rate limits.
 */
export async function fetchCompetitorUrls(urls: string[]): Promise<FetchResult[]> {
  const results: FetchResult[] = [];

  for (const url of urls.slice(0, 5)) {
    const result = await fetchViaJinaReader(url);
    results.push(result);
    // Small delay between requests to avoid rate limits (20 RPM = ~3s apart)
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * Fetch competitor content from URLs. Without JINA_API_KEY, enforces ~2s delay between
 * fetches (same as fetchCompetitorUrls) to avoid rate limits (20 RPM). With API key,
 * fetches sequentially with delay for consistency. Failed fetches return an entry
 * with fetchSuccess: false and empty content (no throw).
 */
export async function fetchCompetitorContent(urls: string[]): Promise<CompetitorArticle[]> {
  const toFetch = urls.slice(0, 5).map((u) => u.trim()).filter(Boolean);
  const results: Awaited<ReturnType<typeof fetchViaJinaReader>>[] = [];
  for (const url of toFetch) {
    const result = await fetchViaJinaReader(url);
    results.push(result);
    if (toFetch.indexOf(url) < toFetch.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

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
