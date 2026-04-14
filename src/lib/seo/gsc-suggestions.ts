/**
 * GSC-driven AI ranking suggestion generator.
 *
 * Given one page's content plus its Google Search Console performance,
 * asks Claude to produce a ranked list of concrete improvements aligned
 * with the four 2026 SEO research priorities:
 *   1. Striking-distance keywords (positions 5-15, especially 8-15)
 *   2. High-impressions / low-CTR rewrites (title and meta first)
 *   3. Intent-format mismatch (how-to vs comparison vs listicle)
 *   4. Missing entities and topical depth
 *
 * Reuses callClaudeJson from the existing shared Anthropic client so we
 * inherit prompt caching and the singleton.
 */

import {
  callClaudeJson,
  stripJsonMarkdown,
  CLAUDE_SONNET_MODEL,
} from "@/lib/anthropic/shared-client";
import type { GscRow, GscTotals } from "@/lib/google-search-console";
import type { ArticleAuditResult } from "@/lib/seo/article-audit";

export type GscSuggestionCategory =
  | "title-rewrite"
  | "meta-rewrite"
  | "content-expansion"
  | "intent-mismatch"
  | "missing-entity"
  | "internal-linking"
  | "striking-distance"
  | "ctr-fix";

export type GscSuggestion = {
  rank: number;
  category: GscSuggestionCategory;
  title: string;
  rationale: string;
  estimatedImpact: "high" | "medium" | "low";
  draftChange?: string;
  targetKeywords: string[];
};

export type GscSuggestionInput = {
  pagePath: string;
  pageTitle: string;
  metaDescription?: string;
  contentText: string;
  gsc: {
    topQueries: GscRow[];
    strikingDistance: GscRow[];
    totals: GscTotals;
  };
  audit?: ArticleAuditResult;
};

export type GscSuggestionResult = {
  items: GscSuggestion[];
  model: string;
  tokens: { input: number; output: number };
};

const MAX_CONTENT_CHARS = 18000; // ~6k tokens
const MAX_QUERIES_TO_SEND = 25;

const SYSTEM_PROMPT = `You are an SEO analyst reviewing one page's Google Search Console performance and recommending concrete ranking improvements.

Prioritization rules (apply in order):
1. Striking-distance queries (position 5-15, especially 8-15) are the fastest wins. Always surface these first.
2. High impressions with CTR under 3 percent means rewrite the title and meta description before changing the body.
3. Intent-format mismatch matters in 2026: pricing intent needs a pricing post, comparison intent needs a "vs" post, list intent needs a listicle.
4. Missing entities and topical depth come last.

Do NOT suggest creating a brand-new article when the existing page already targets the query. Suggest expanding or restructuring instead.

Return strict JSON only. Do not include markdown code fences. Do not use em dashes anywhere in your output - use hyphens instead.

Output schema:
{
  "items": [
    {
      "rank": 1,
      "category": "striking-distance" | "ctr-fix" | "title-rewrite" | "meta-rewrite" | "content-expansion" | "intent-mismatch" | "missing-entity" | "internal-linking",
      "title": "Short headline of the suggestion (under 80 chars)",
      "rationale": "Why this matters, citing the specific GSC numbers",
      "estimatedImpact": "high" | "medium" | "low",
      "draftChange": "For title-rewrite or meta-rewrite, the proposed new copy. Otherwise omit.",
      "targetKeywords": ["query 1", "query 2"]
    }
  ]
}

Cap the list at 8 suggestions. Rank 1 is highest impact. Every suggestion must reference at least one GSC query.`;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "...";
}

function stripEmDashes(s: string): string {
  return s.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
}

function sanitizeSuggestion(s: GscSuggestion): GscSuggestion {
  return {
    ...s,
    title: stripEmDashes(s.title ?? ""),
    rationale: stripEmDashes(s.rationale ?? ""),
    draftChange: s.draftChange ? stripEmDashes(s.draftChange) : undefined,
  };
}

function formatGscRowsForPrompt(rows: GscRow[]): string {
  return JSON.stringify(
    rows.slice(0, MAX_QUERIES_TO_SEND).map((r) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Number((r.ctr * 100).toFixed(2)),
      position: Number(r.position.toFixed(1)),
    }))
  );
}

function formatAuditSummary(audit?: ArticleAuditResult): string {
  if (!audit) return "Not available";
  const failed = audit.items.filter((i) => i.severity === "fail").map((i) => i.label);
  const warned = audit.items.filter((i) => i.severity === "warn").map((i) => i.label);
  return JSON.stringify({
    score: audit.score,
    publishable: audit.publishable,
    failed: failed.slice(0, 5),
    warned: warned.slice(0, 5),
  });
}

export async function generateGscSuggestions(
  input: GscSuggestionInput
): Promise<GscSuggestionResult> {
  const { pagePath, pageTitle, metaDescription, contentText, gsc, audit } = input;

  const userPrompt = `Page path: ${pagePath}
Current title: ${pageTitle}
Current meta description: ${metaDescription ?? "(missing)"}

GSC totals (last 28 days):
${JSON.stringify({
  clicks: gsc.totals.clicks,
  impressions: gsc.totals.impressions,
  ctr: Number((gsc.totals.ctr * 100).toFixed(2)),
  averagePosition: Number(gsc.totals.position.toFixed(1)),
})}

Top queries by impressions:
${formatGscRowsForPrompt(gsc.topQueries)}

Striking-distance queries (position 5-15):
${formatGscRowsForPrompt(gsc.strikingDistance)}

SEO audit summary:
${formatAuditSummary(audit)}

Page body (truncated):
${truncate(contentText, MAX_CONTENT_CHARS)}

Generate ranked improvement suggestions following the system prompt rules. JSON only, no em dashes.`;

  const response = await callClaudeJson(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.3,
    maxTokens: 4096,
    timeoutMs: 90_000,
  });

  const raw = stripJsonMarkdown(response.content);
  let parsed: { items?: GscSuggestion[] };
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse Claude JSON: ${err instanceof Error ? err.message : String(err)}. Raw: ${raw.slice(0, 200)}`
    );
  }

  const items = Array.isArray(parsed.items)
    ? parsed.items
        .filter((i): i is GscSuggestion => typeof i === "object" && i != null)
        .map((i, idx) => sanitizeSuggestion({ ...i, rank: i.rank ?? idx + 1 }))
        .slice(0, 8)
    : [];

  return {
    items,
    model: CLAUDE_SONNET_MODEL,
    tokens: { input: response.inputTokens, output: response.outputTokens },
  };
}
