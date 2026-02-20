/**
 * Serper API client — automated Google search for competitor article URLs and PAA.
 * Replaces manual URL pasting: user enters keyword, we return top N article URLs and optional PAA questions.
 */

import type { SerpResult } from "@/lib/pipeline/types";

/** Result of search that includes People Also Ask questions (for gap analysis). */
export type SerperSearchWithPaaResult = {
  results: SerpResult[];
  paaQuestions: string[];
};

const SERPER_API_URL = "https://google.serper.dev/search";

const NON_ARTICLE_DOMAINS = new Set([
  "reddit.com",
  "www.reddit.com",
  "quora.com",
  "www.quora.com",
  "youtube.com",
  "www.youtube.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "pinterest.com",
  "www.pinterest.com",
  "linkedin.com",
  "www.linkedin.com",
  "amazon.com",
  "www.amazon.com",
  "ebay.com",
  "www.ebay.com",
]);

const FILE_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip)(\?|$)/i;

const CATEGORY_TAG_PATHS = /^\/(category|tag|author)(\/|$)/i;

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function getPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return "";
  }
}

/**
 * Returns true if the URL looks like an article (has substantive path, not homepage/category/file).
 */
function isArticleUrl(url: string): boolean {
  const path = getPath(url);
  const domain = getDomain(url);

  if (NON_ARTICLE_DOMAINS.has(domain)) return false;
  if (FILE_EXTENSIONS.test(url)) return false;
  if (CATEGORY_TAG_PATHS.test(path)) return false;

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  if (segments.length === 1 && ["blog", "news", "articles"].includes(segments[0].toLowerCase())) return false;

  return segments.length >= 2 || path.length > 10;
}

/**
 * Search Google via Serper and return top N filtered article URLs as SerpResult[].
 * Default 3 for diminishing returns on 4th/5th article; callers can override.
 * Filters out homepages, non-article domains, file URLs, and category/tag pages.
 */
export async function searchCompetitorUrls(
  keyword: string,
  maxResults = 3
): Promise<SerpResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not set. Get a key at https://serper.dev");
  }

  const response = await fetch(SERPER_API_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: keyword.trim(), num: 10 }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Serper API error: ${response.status} ${response.statusText}. ${text || ""}`);
  }

  const data = (await response.json()) as {
    organic?: Array<{ link?: string; title?: string; snippet?: string; position?: number }>;
    peopleAlsoAsk?: Array<{ question?: string }>;
    people_also_ask?: Array<{ question?: string }>;
  };
  const organic = data.organic ?? [];
  const beforeCount = organic.length;

  const filtered: SerpResult[] = [];
  for (const item of organic) {
    const url = item.link?.trim();
    if (!url) continue;
    if (!isArticleUrl(url)) continue;
    filtered.push({
      url,
      title: item.title ?? "",
      position: item.position ?? filtered.length + 1,
      snippet: item.snippet ?? "",
      isArticle: true,
    });
    if (filtered.length >= maxResults) break;
  }

  // When filter removes all results (e.g. Reddit/YouTube-heavy SERP), fall back to top organic URLs
  if (filtered.length === 0 && organic.length > 0) {
    for (const item of organic) {
      const url = item.link?.trim();
      if (!url) continue;
      filtered.push({
        url,
        title: item.title ?? "",
        position: item.position ?? filtered.length + 1,
        snippet: item.snippet ?? "",
        isArticle: false,
      });
      if (filtered.length >= maxResults) break;
    }
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(`[serper] keyword="${keyword}": ${beforeCount} results before filter, ${filtered.length} after (top ${maxResults} articles)`);
  }

  return filtered;
}

/**
 * Search via Serper and return both competitor URLs and PAA questions.
 * Use this when running the full pipeline so topic extraction can use PAA for gap detection.
 */
export async function searchCompetitorUrlsWithPaa(
  keyword: string,
  maxResults = 3
): Promise<SerperSearchWithPaaResult> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not set. Get a key at https://serper.dev");
  }

  const response = await fetch(SERPER_API_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: keyword.trim(), num: 10 }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Serper API error: ${response.status} ${response.statusText}. ${text || ""}`);
  }

  const data = (await response.json()) as {
    organic?: Array<{ link?: string; title?: string; snippet?: string; position?: number }>;
    peopleAlsoAsk?: Array<{ question?: string }>;
    people_also_ask?: Array<{ question?: string }>;
  };
  const organic = data.organic ?? [];
  const paaRaw = data.peopleAlsoAsk ?? data.people_also_ask ?? [];
  const paaQuestions = paaRaw
    .map((item) => (typeof item.question === "string" ? item.question.trim() : ""))
    .filter(Boolean);

  const beforeCount = organic.length;
  const filtered: SerpResult[] = [];
  for (const item of organic) {
    const url = item.link?.trim();
    if (!url) continue;
    if (!isArticleUrl(url)) continue;
    filtered.push({
      url,
      title: item.title ?? "",
      position: item.position ?? filtered.length + 1,
      snippet: item.snippet ?? "",
      isArticle: true,
    });
    if (filtered.length >= maxResults) break;
  }
  if (filtered.length === 0 && organic.length > 0) {
    for (const item of organic) {
      const url = item.link?.trim();
      if (!url) continue;
      filtered.push({
        url,
        title: item.title ?? "",
        position: item.position ?? filtered.length + 1,
        snippet: item.snippet ?? "",
        isArticle: false,
      });
      if (filtered.length >= maxResults) break;
    }
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[serper] keyword="${keyword}": ${beforeCount} results → ${filtered.length} URLs, ${paaQuestions.length} PAA questions`
    );
  }

  return { results: filtered, paaQuestions };
}
