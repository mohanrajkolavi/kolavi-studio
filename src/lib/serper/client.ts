/**
 * Serper API client — automated Google search for competitor article URLs, PAA,
 * Reddit discussions, SERP feature detection, and intent validation.
 */

import type { SerpResult, SerpFeatures, IntentValidation } from "@/lib/pipeline/types";

/** Reddit thread result from site:reddit.com search. */
export type RedditThread = {
  url: string;
  title: string;
  snippet: string;
};

/** Result of search that includes PAA, SERP features, Reddit threads, and intent validation. */
export type SerperSearchWithPaaResult = {
  results: SerpResult[];
  paaQuestions: string[];
  /** Full PAA items (question + snippet/title/link) for UI. */
  paaItems?: PaaItem[];
  /** SERP feature detection — what Google shows for this query. */
  serpFeatures: SerpFeatures;
  /** Intent validation — user-declared vs SERP-detected intent. */
  intentValidation?: IntentValidation;
  /** Reddit thread URLs (from dedicated Reddit search + organic Reddit results). */
  redditThreads: RedditThread[];
};

const SERPER_API_URL = "https://google.serper.dev/search";

const NON_ARTICLE_DOMAINS = new Set([
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

// =============================================================================
// Serper raw response type (shared across functions)
// =============================================================================

/** One People Also Ask item from Serper (question + optional snippet/title/link). */
export type PaaItem = {
  question: string;
  snippet?: string;
  title?: string;
  link?: string;
};

type SerperResponse = {
  organic?: Array<{ link?: string; title?: string; snippet?: string; position?: number }>;
  peopleAlsoAsk?: Array<{ question?: string; snippet?: string; title?: string; link?: string }>;
  people_also_ask?: Array<{ question?: string; snippet?: string; title?: string; link?: string }>;
  knowledgeGraph?: Record<string, unknown>;
  answerBox?: Record<string, unknown>;
  topStories?: unknown[];
  relatedSearches?: Array<{ query?: string }>;
};

// =============================================================================
// SERP Feature Detection
// =============================================================================

/** Extract SERP features from the Serper response. */
function extractSerpFeatures(data: SerperResponse): SerpFeatures {
  const organic = data.organic ?? [];
  const hasVideoCarousel = organic.some((item) => {
    const domain = getDomain(item.link ?? "");
    return domain === "youtube.com" || domain === "www.youtube.com";
  });

  return {
    hasKnowledgeGraph: data.knowledgeGraph != null && Object.keys(data.knowledgeGraph).length > 0,
    hasAnswerBox: data.answerBox != null && Object.keys(data.answerBox).length > 0,
    hasFeaturedSnippet: data.answerBox != null && typeof (data.answerBox as Record<string, unknown>).snippet === "string",
    hasVideoCarousel,
    hasTopStories: Array.isArray(data.topStories) && data.topStories.length > 0,
    relatedSearches: (data.relatedSearches ?? [])
      .map((r) => (typeof r.query === "string" ? r.query.trim() : ""))
      .filter(Boolean),
  };
}

// =============================================================================
// Intent Validation
// =============================================================================

/** Commercial/transaction intent signals in URLs/snippets. */
const COMMERCIAL_SIGNALS = /\b(buy|price|pricing|cost|deal|discount|coupon|review|best|top\s+\d|vs\.?|comparison|alternative)/i;
const TRANSACTIONAL_SIGNALS = /\b(buy|order|purchase|shop|add\s+to\s+cart|sign\s+up|subscribe|get\s+started|free\s+trial)/i;

/** Detect search intent from SERP composition. */
function detectSerpIntent(data: SerperResponse, declaredIntent?: string): IntentValidation {
  const organic = data.organic ?? [];
  let commercialCount = 0;
  let transactionalCount = 0;
  let informationalCount = 0;

  for (const item of organic.slice(0, 10)) {
    const text = `${item.title ?? ""} ${item.snippet ?? ""} ${item.link ?? ""}`;
    if (TRANSACTIONAL_SIGNALS.test(text)) transactionalCount++;
    else if (COMMERCIAL_SIGNALS.test(text)) commercialCount++;
    else informationalCount++;
  }

  const total = organic.length || 1;
  let detectedIntent = "informational";
  let confidence = 0.5;

  if (transactionalCount / total > 0.4) {
    detectedIntent = "transactional";
    confidence = transactionalCount / total;
  } else if (commercialCount / total > 0.3) {
    detectedIntent = "commercial";
    confidence = commercialCount / total;
  } else {
    detectedIntent = "informational";
    confidence = informationalCount / total;
  }

  const declared = declaredIntent?.toLowerCase() ?? "informational";
  const warning =
    declared !== detectedIntent
      ? `SERP suggests "${detectedIntent}" intent (${Math.round(confidence * 100)}% confidence), but you declared "${declared}". Consider adjusting your content angle.`
      : undefined;

  return {
    declaredIntent: declared,
    detectedIntent,
    confidence: Math.round(confidence * 100) / 100,
    warning,
  };
}

// =============================================================================
// Reddit Discussion Search
// =============================================================================

/**
 * Search Reddit for discussions about a keyword via Serper site:reddit.com.
 * Returns top 3 thread URLs with titles and snippets for scraping.
 */
export async function searchRedditDiscussions(
  keyword: string,
  maxResults = 3
): Promise<RedditThread[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(SERPER_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: `site:reddit.com ${keyword.trim()}`, num: 10 }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as SerperResponse;
    const organic = data.organic ?? [];
    const threads: RedditThread[] = [];

    for (const item of organic) {
      const url = item.link?.trim();
      if (!url) continue;
      const domain = getDomain(url);
      if (domain !== "reddit.com" && domain !== "www.reddit.com") continue;
      // Only include actual threads (paths like /r/subreddit/comments/...)
      const path = getPath(url);
      if (!path.includes("/comments/")) continue;
      threads.push({
        url,
        title: item.title ?? "",
        snippet: item.snippet ?? "",
      });
      if (threads.length >= maxResults) break;
    }

    if (process.env.NODE_ENV !== "test") {
      console.log(`[serper] Reddit search "${keyword}": found ${threads.length} discussion threads`);
    }

    return threads;
  } catch {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[serper] Reddit search failed, continuing without Reddit data");
    }
    return [];
  }
}

// =============================================================================
// Main Search Functions
// =============================================================================

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

  const data = (await response.json()) as SerperResponse;
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
 * Search via Serper and return competitor URLs, PAA, SERP features, Reddit threads, and intent validation.
 * Runs the main search and Reddit search in parallel.
 */
export async function searchCompetitorUrlsWithPaa(
  keyword: string,
  maxResults = 3,
  declaredIntent?: string
): Promise<SerperSearchWithPaaResult> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not set. Get a key at https://serper.dev");
  }

  // Run main search and Reddit search in parallel
  const [mainResponse, redditThreads] = await Promise.all([
    fetch(SERPER_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: keyword.trim(), num: 10 }),
      signal: AbortSignal.timeout(15000),
    }),
    searchRedditDiscussions(keyword),
  ]);

  if (!mainResponse.ok) {
    const text = await mainResponse.text();
    throw new Error(`Serper API error: ${mainResponse.status} ${mainResponse.statusText}. ${text || ""}`);
  }

  const data = (await mainResponse.json()) as SerperResponse;
  const organic = data.organic ?? [];
  const paaRaw = data.peopleAlsoAsk ?? data.people_also_ask ?? [];
  const paaQuestions = paaRaw
    .map((item) => (typeof item.question === "string" ? item.question.trim() : ""))
    .filter(Boolean);
  const paaItems: PaaItem[] = paaRaw
    .map((item) => {
      const question = typeof item.question === "string" ? item.question.trim() : "";
      if (!question) return null;
      return {
        question,
        ...(typeof item.snippet === "string" && item.snippet.trim() ? { snippet: item.snippet.trim() } : {}),
        ...(typeof item.title === "string" && item.title.trim() ? { title: item.title.trim() } : {}),
        ...(typeof item.link === "string" && item.link.trim() ? { link: item.link.trim() } : {}),
      };
    })
    .filter((x): x is PaaItem => x != null);

  // Extract SERP features
  const serpFeatures = extractSerpFeatures(data);

  // Detect intent from SERP composition
  const intentValidation = detectSerpIntent(data, declaredIntent);

  const beforeCount = organic.length;
  const filtered: SerpResult[] = [];
  const organicReddit: RedditThread[] = [];
  for (const item of organic) {
    const url = item.link?.trim();
    if (!url) continue;
    const domain = getDomain(url);
    // Capture organic Reddit results for the redditThreads panel too
    if (domain === "reddit.com" || domain === "www.reddit.com") {
      organicReddit.push({
        url,
        title: item.title ?? "",
        snippet: item.snippet ?? "",
      });
    }
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

  const mergedRedditThreads = [...redditThreads];
  for (const r of organicReddit) {
    if (!mergedRedditThreads.some((t) => t.url === r.url)) {
      mergedRedditThreads.push(r);
    }
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[serper] keyword="${keyword}": ${beforeCount} results -> ${filtered.length} URLs, ${paaQuestions.length} PAA, ${mergedRedditThreads.length} Reddit threads, SERP features: ${JSON.stringify(serpFeatures)}`
    );
    if (intentValidation.warning) {
      console.warn(`[serper] Intent warning: ${intentValidation.warning}`);
    }
  }

  return {
    results: filtered,
    paaQuestions,
    paaItems: paaItems.length > 0 ? paaItems : undefined,
    serpFeatures,
    intentValidation,
    redditThreads: mergedRedditThreads,
  };
}

