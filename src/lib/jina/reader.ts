/**
 * Jina Reader - Fetches web pages and returns clean, LLM-compatible text/markdown.
 * https://r.jina.ai/{url}
 * No API key required for basic use (20 RPM). Use JINA_API_KEY for higher limits.
 */

const JINA_READER_BASE = "https://r.jina.ai";

export type FetchResult = {
  url: string;
  content: string;
  success: boolean;
  error?: string;
};

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
