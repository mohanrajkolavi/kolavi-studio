"use client";

/**
 * GscInsightsPanel
 *
 * Shared panel mounted in two surfaces:
 *   1. Rankings dashboard side drawer (page-level GSC drilldown).
 *   2. Content Maintenance post modal (per-post GSC tab).
 *
 * Behavior:
 *   - On mount, lazy-fetches /api/gsc/sync?path=... and renders totals + top
 *     queries.
 *   - Refresh button calls the same endpoint with ?force=1.
 *   - "Generate AI suggestions" calls POST /api/gsc/suggestions and renders
 *     the ranked list. Each card has a "Send to Rewriter" button that fires
 *     the onSendToRewriter prop with a typed payload.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, RefreshCw, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types - kept in sync with /api/gsc/sync and /api/gsc/suggestions responses
// ---------------------------------------------------------------------------

export type GscPanelRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type RawGscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

type GscPagePerformance = {
  url: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: RawGscRow[];
  byDevice: RawGscRow[];
  periodDays: number;
  fetchedAt: string;
};

type PageInsightApiRow = {
  page_path: string;
  page_type: "blog" | "static";
  post_slug: string | null;
  gsc_data: GscPagePerformance | null;
  ai_suggestions: SuggestionsPayload | null;
  last_synced_at: string | null;
  suggestion_generated_at: string | null;
};

type SuggestionCategory =
  | "title-rewrite"
  | "meta-rewrite"
  | "content-expansion"
  | "intent-mismatch"
  | "missing-entity"
  | "internal-linking"
  | "striking-distance"
  | "ctr-fix";

type Suggestion = {
  rank: number;
  category: SuggestionCategory;
  title: string;
  rationale: string;
  estimatedImpact: "high" | "medium" | "low";
  draftChange?: string;
  targetKeywords: string[];
};

type SuggestionsPayload = {
  items: Suggestion[];
  model: string;
  tokens: { input: number; output: number };
};

export type RewriterHandoff = {
  source: "gsc";
  pagePath: string;
  postSlug?: string;
  postTitle: string;
  existingContent?: string;
  focusKeywords: string[];
  brief: string;
  ts: number;
};

export type GscInsightsPanelProps = {
  pagePath: string;
  pageTitle: string;
  postSlug?: string;
  onSendToRewriter: (payload: RewriterHandoff) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "never";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}

function impactClass(impact: Suggestion["estimatedImpact"]): string {
  switch (impact) {
    case "high":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  "title-rewrite": "Title rewrite",
  "meta-rewrite": "Meta rewrite",
  "content-expansion": "Content expansion",
  "intent-mismatch": "Intent mismatch",
  "missing-entity": "Missing entity",
  "internal-linking": "Internal linking",
  "striking-distance": "Striking distance",
  "ctr-fix": "CTR fix",
};

function topQueriesFromRaw(rows: RawGscRow[]): GscPanelRow[] {
  return rows.slice(0, 12).map((r) => ({
    query: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GscInsightsPanel({
  pagePath,
  pageTitle,
  postSlug,
  onSendToRewriter,
}: GscInsightsPanelProps) {
  const [row, setRow] = useState<PageInsightApiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-row refs for the suggestion action buttons (required code pattern).
  const sendButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  const loadInsight = useCallback(
    async (force = false) => {
      setError(null);
      if (force) setRefreshing(true);
      else setLoading(true);
      try {
        const url = `/api/gsc/sync?path=${encodeURIComponent(pagePath)}${force ? "&force=1" : ""}`;
        const res = await fetch(url, { method: "GET", credentials: "same-origin" });
        const data = (await res.json()) as { row?: PageInsightApiRow; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `Sync failed: ${res.status}`);
        }
        setRow(data.row ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagePath]
  );

  useEffect(() => {
    loadInsight(false);
  }, [loadInsight]);

  const generateSuggestions = useCallback(
    async (force = false) => {
      setError(null);
      setGenerating(true);
      try {
        const res = await fetch("/api/gsc/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ pagePath, force }),
        });
        const data = (await res.json()) as {
          suggestions?: SuggestionsPayload;
          gsc?: GscPagePerformance;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || `Suggestion generation failed: ${res.status}`);
        }
        if (data.suggestions) {
          setRow((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              ai_suggestions: data.suggestions ?? null,
              suggestion_generated_at: new Date().toISOString(),
            };
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setGenerating(false);
      }
    },
    [pagePath]
  );

  const handleSend = useCallback(
    (suggestion: Suggestion) => {
      const briefParts = [
        `Suggestion: ${suggestion.title}`,
        `Category: ${CATEGORY_LABELS[suggestion.category]}`,
        `Rationale: ${suggestion.rationale}`,
        suggestion.draftChange ? `Draft change: ${suggestion.draftChange}` : null,
      ].filter(Boolean);

      const handoff: RewriterHandoff = {
        source: "gsc",
        pagePath,
        postSlug,
        postTitle: pageTitle,
        focusKeywords: suggestion.targetKeywords,
        brief: briefParts.join("\n"),
        ts: Date.now(),
      };
      onSendToRewriter(handoff);
    },
    [pagePath, pageTitle, postSlug, onSendToRewriter]
  );

  const gsc = row?.gsc_data ?? null;
  const suggestions = row?.ai_suggestions ?? null;
  const topQueries = gsc ? topQueriesFromRaw(gsc.topQueries) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">GSC Insights</p>
          <p className="mt-0.5 text-sm font-medium truncate" title={pagePath}>
            {pagePath}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
            Last synced {formatRelative(row?.last_synced_at ?? null)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadInsight(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !gsc && (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-md bg-muted" />
          <div className="h-32 animate-pulse rounded-md bg-muted" />
        </div>
      )}

      {/* Totals */}
      {gsc && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TotalTile label="Clicks" value={formatNumber(gsc.totals.clicks)} />
          <TotalTile label="Impressions" value={formatNumber(gsc.totals.impressions)} />
          <TotalTile label="CTR" value={formatCtr(gsc.totals.ctr)} />
          <TotalTile label="Avg position" value={gsc.totals.position.toFixed(1)} />
        </div>
      )}

      {/* Top queries */}
      {gsc && topQueries.length > 0 && (
        <div className="rounded-md border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Top queries (last {gsc.periodDays} days)
            </p>
            <p className="text-[11px] text-muted-foreground">{topQueries.length} shown</p>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Query</th>
                  <th className="px-2 py-1.5 text-right font-medium">Clicks</th>
                  <th className="px-2 py-1.5 text-right font-medium">Impr.</th>
                  <th className="px-2 py-1.5 text-right font-medium">CTR</th>
                  <th className="px-2 py-1.5 text-right font-medium">Pos</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q, idx) => (
                  <tr
                    key={`${q.query}-${idx}`}
                    className="border-t border-border/60 hover:bg-muted/30"
                  >
                    <td className="px-3 py-1.5 truncate max-w-[220px]" title={q.query}>
                      {q.query}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{q.clicks}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(q.impressions)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatCtr(q.ctr)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gsc && topQueries.length === 0 && (
        <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No GSC queries recorded for this page in the last 28 days.
        </div>
      )}

      {/* AI suggestions */}
      <div className="rounded-md border border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI ranking suggestions
            </p>
          </div>
          {suggestions && (
            <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>
              Generated {formatRelative(row?.suggestion_generated_at ?? null)}
            </p>
          )}
        </div>
        <div className="p-3 space-y-2">
          {!suggestions && !generating && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                No suggestions yet. Generate ranked improvements based on the GSC data above.
              </p>
              <Button
                onClick={() => generateSuggestions(false)}
                disabled={!gsc || generating}
                size="sm"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate AI suggestions
              </Button>
            </div>
          )}

          {generating && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Asking Claude for ranked improvements...</span>
            </div>
          )}

          {suggestions && suggestions.items.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              The model returned no suggestions. Try refreshing GSC and regenerating.
            </div>
          )}

          {suggestions &&
            suggestions.items.map((s, idx) => {
              const refKey = s.rank ?? idx;
              return (
                <div
                  key={`${refKey}-${s.title}`}
                  className="rounded-md border border-border bg-card/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          #{s.rank}
                        </span>
                        <Badge variant="outline" className={impactClass(s.estimatedImpact)}>
                          {s.estimatedImpact}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {CATEGORY_LABELS[s.category] ?? s.category}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug">{s.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {s.rationale}
                      </p>
                      {s.draftChange && (
                        <div className="mt-1.5 rounded border border-border bg-muted/40 px-2 py-1 text-[11px] font-mono text-foreground/90 break-words">
                          {s.draftChange}
                        </div>
                      )}
                      {s.targetKeywords.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {s.targetKeywords.slice(0, 6).map((kw) => (
                            <Badge key={kw} variant="secondary" className="text-[10px]">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      ref={(el) => {
                        sendButtonRefs.current.set(refKey, el);
                      }}
                      size="sm"
                      variant="outline"
                      onClick={() => handleSend(s)}
                      title="Send this suggestion to the Content Writer with keywords pre-filled"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="ml-1 hidden sm:inline">Rewrite</span>
                    </Button>
                  </div>
                </div>
              );
            })}

          {suggestions && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateSuggestions(true)}
                disabled={generating}
                className="text-[11px] h-7"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
