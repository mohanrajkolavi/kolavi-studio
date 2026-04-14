"use client";

/**
 * RankingsOverview
 *
 * Site-wide GSC dashboard. Shows totals, striking-distance keywords, top
 * pages, and declining pages. A "Sync all" button paginates through the
 * /api/gsc/sync-all cursor until done. Per-row "View suggestions" opens a
 * side drawer with the shared GscInsightsPanel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Target,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GscInsightsPanel, type RewriterHandoff } from "@/components/dashboard/GscInsightsPanel";

type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type DecliningRow = GscRow & {
  prior: { clicks: number; position: number; impressions: number };
  deltaClicks: number;
  deltaPosition: number;
  deltaImpressions: number;
};

type OverviewPayload = {
  days: number;
  topPages: GscRow[];
  strikingDistance: GscRow[];
  declining: DecliningRow[];
  totals: { clicks: number; impressions: number; pages: number };
  generatedAt: string;
  fromCache?: boolean;
  error?: string;
};

type SyncProgress = {
  running: boolean;
  synced: number;
  failed: number;
  skipped: number;
  total: number;
  processed: number;
  done: boolean;
  message?: string;
};

type SyncResponse = {
  synced: number;
  failed: number;
  skipped: number;
  total: number;
  processed: number;
  nextOffset: number | null;
  errors?: Array<{ path: string; error: string }>;
  error?: string;
};

const DEFAULT_DAYS = 28;

function pathFromKey(key: string): string {
  if (!key) return "/";
  if (/^https?:\/\//i.test(key)) {
    try {
      return new URL(key).pathname || "/";
    } catch {
      return key;
    }
  }
  return key.startsWith("/") ? key : `/${key}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}

function tileClass(): string {
  return "rounded-xl border border-border bg-card p-4";
}

export function RankingsOverview() {
  const router = useRouter();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const syncCancelRef = useRef(false);

  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [drawerTitle, setDrawerTitle] = useState<string>("");

  const fetchOverview = useCallback(
    async (force = false) => {
      setError(null);
      setLoading(true);
      try {
        const url = `/api/gsc/overview?days=${DEFAULT_DAYS}${force ? "&force=1" : ""}`;
        const res = await fetch(url, { credentials: "same-origin" });
        const payload = (await res.json()) as OverviewPayload;
        if (!res.ok) {
          throw new Error(payload.error || `Overview failed: ${res.status}`);
        }
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOverview(false);
  }, [fetchOverview]);

  const runSyncAll = useCallback(async () => {
    syncCancelRef.current = false;
    setSyncProgress({
      running: true,
      synced: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      processed: 0,
      done: false,
    });
    try {
      let offset = 0;
      let totals = { synced: 0, failed: 0, skipped: 0, total: 0, processed: 0 };
      while (true) {
        if (syncCancelRef.current) break;
        const res = await fetch("/api/gsc/sync-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ scope: "all", offset }),
        });
        const data = (await res.json()) as SyncResponse;
        if (!res.ok) {
          throw new Error(data.error || `Sync failed at offset ${offset}`);
        }
        totals = {
          synced: totals.synced + data.synced,
          failed: totals.failed + data.failed,
          skipped: totals.skipped + data.skipped,
          total: data.total,
          processed: data.processed,
        };
        setSyncProgress({
          running: data.nextOffset !== null,
          synced: totals.synced,
          failed: totals.failed,
          skipped: totals.skipped,
          total: totals.total,
          processed: totals.processed,
          done: data.nextOffset === null,
        });
        if (data.nextOffset === null) break;
        offset = data.nextOffset;
      }
      await fetchOverview(true);
    } catch (err) {
      setSyncProgress((prev) => ({
        running: false,
        synced: prev?.synced ?? 0,
        failed: prev?.failed ?? 0,
        skipped: prev?.skipped ?? 0,
        total: prev?.total ?? 0,
        processed: prev?.processed ?? 0,
        done: false,
        message: err instanceof Error ? err.message : String(err),
      }));
    }
  }, [fetchOverview]);

  const cancelSync = useCallback(() => {
    syncCancelRef.current = true;
  }, []);

  const handleSendToRewriter = useCallback(
    (payload: RewriterHandoff) => {
      try {
        sessionStorage.setItem("gsc-rewriter-handoff", JSON.stringify(payload));
      } catch (err) {
        console.warn("sessionStorage unavailable:", err);
      }
      router.push("/dashboard/blog");
    },
    [router]
  );

  const openDrawer = useCallback((path: string, title: string) => {
    setDrawerPath(path);
    setDrawerTitle(title);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerPath(null);
    setDrawerTitle("");
  }, []);

  const topPagesView = useMemo(() => {
    if (!data) return [];
    return [...data.topPages]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 25)
      .map((row) => ({
        path: pathFromKey(row.keys[0]),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
  }, [data]);

  const strikingView = useMemo(() => {
    if (!data) return [];
    return data.strikingDistance.slice(0, 30).map((row) => ({
      query: row.keys[0] ?? "",
      page: pathFromKey(row.keys[1] ?? ""),
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }, [data]);

  const decliningView = useMemo(() => {
    if (!data) return [];
    return data.declining.slice(0, 20).map((row) => ({
      path: pathFromKey(row.keys[0]),
      clicks: row.clicks,
      deltaClicks: row.deltaClicks,
      position: row.position,
      deltaPosition: row.deltaPosition,
    }));
  }, [data]);

  return (
    <div className="mt-6 space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runSyncAll} disabled={syncProgress?.running}>
          {syncProgress?.running ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          )}
          Sync all GSC data
        </Button>
        <Button
          variant="outline"
          onClick={() => fetchOverview(true)}
          disabled={loading || syncProgress?.running}
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh overview
        </Button>
        {syncProgress?.running && (
          <Button variant="ghost" onClick={cancelSync} size="sm">
            Cancel
          </Button>
        )}
        {syncProgress && (
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {syncProgress.done
              ? `Done. ${syncProgress.synced} synced, ${syncProgress.skipped} skipped, ${syncProgress.failed} failed.`
              : `${syncProgress.processed} of ${syncProgress.total} processed (${syncProgress.synced} synced, ${syncProgress.skipped} skipped)`}
            {syncProgress.message ? ` - ${syncProgress.message}` : ""}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Totals tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={tileClass()}>
          <p className="text-sm font-medium text-muted-foreground">Clicks (28d)</p>
          <p className="mt-1 text-2xl font-bold">
            {data ? formatNumber(data.totals.clicks) : "-"}
          </p>
        </div>
        <div className={tileClass()}>
          <p className="text-sm font-medium text-muted-foreground">Impressions (28d)</p>
          <p className="mt-1 text-2xl font-bold">
            {data ? formatNumber(data.totals.impressions) : "-"}
          </p>
        </div>
        <div className={tileClass()}>
          <p className="text-sm font-medium text-muted-foreground">Pages tracked</p>
          <p className="mt-1 text-2xl font-bold">{data ? data.totals.pages : "-"}</p>
        </div>
        <div className={tileClass()}>
          <p className="text-sm font-medium text-muted-foreground">Striking distance</p>
          <p className="mt-1 text-2xl font-bold">{data ? data.strikingDistance.length : "-"}</p>
        </div>
      </div>

      {/* Striking-distance keywords */}
      <section className="rounded-xl border border-border bg-card">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Target className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Striking-distance keywords
          </h2>
          <Badge variant="outline" className="text-[10px]">
            position 5-15
          </Badge>
          <span className="ml-auto text-[11px] text-muted-foreground">
            sorted by impressions
          </span>
        </header>
        <div className="max-h-96 overflow-auto">
          {loading && !data && <RowsSkeleton />}
          {!loading && strikingView.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No striking-distance queries yet. Click &quot;Sync all GSC data&quot; to populate.
            </p>
          )}
          {strikingView.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Query</th>
                  <th className="px-3 py-2 text-left font-medium">Page</th>
                  <th className="px-2 py-2 text-right font-medium">Clicks</th>
                  <th className="px-2 py-2 text-right font-medium">Impr.</th>
                  <th className="px-2 py-2 text-right font-medium">CTR</th>
                  <th className="px-2 py-2 text-right font-medium">Pos</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {strikingView.map((r, idx) => (
                  <tr key={`${r.query}-${idx}`} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-medium truncate max-w-[220px]" title={r.query}>
                      {r.query}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[220px]" title={r.page}>
                      {r.page}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.clicks}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(r.impressions)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatCtr(r.ctr)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.position.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => openDrawer(r.page, r.page)}
                      >
                        <Sparkles className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Top pages */}
      <section className="rounded-xl border border-border bg-card">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Top pages by clicks</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">last {DEFAULT_DAYS} days</span>
        </header>
        <div className="max-h-96 overflow-auto">
          {loading && !data && <RowsSkeleton />}
          {!loading && topPagesView.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No GSC data loaded yet.
            </p>
          )}
          {topPagesView.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Page</th>
                  <th className="px-2 py-2 text-right font-medium">Clicks</th>
                  <th className="px-2 py-2 text-right font-medium">Impr.</th>
                  <th className="px-2 py-2 text-right font-medium">CTR</th>
                  <th className="px-2 py-2 text-right font-medium">Pos</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {topPagesView.map((r, idx) => (
                  <tr key={`${r.path}-${idx}`} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-3 py-1.5 truncate max-w-[320px]" title={r.path}>
                      <a
                        href={r.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {r.path}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.clicks}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(r.impressions)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatCtr(r.ctr)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.position.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => openDrawer(r.path, r.path)}
                      >
                        Suggestions
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Declining pages */}
      <section className="rounded-xl border border-border bg-card">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Declining pages</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">vs prior {DEFAULT_DAYS} days</span>
        </header>
        <div className="max-h-96 overflow-auto">
          {loading && !data && <RowsSkeleton />}
          {!loading && decliningView.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No declining pages detected.
            </p>
          )}
          {decliningView.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Page</th>
                  <th className="px-2 py-2 text-right font-medium">Clicks</th>
                  <th className="px-2 py-2 text-right font-medium">Click Δ</th>
                  <th className="px-2 py-2 text-right font-medium">Pos</th>
                  <th className="px-2 py-2 text-right font-medium">Pos Δ</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {decliningView.map((r, idx) => (
                  <tr key={`${r.path}-${idx}`} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-3 py-1.5 truncate max-w-[320px]" title={r.path}>
                      {r.path}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.clicks}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-destructive">
                      {r.deltaClicks}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.position.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.deltaPosition >= 0 ? "+" : ""}
                      {r.deltaPosition.toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => openDrawer(r.path, r.path)}
                      >
                        Suggestions
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Side drawer with GscInsightsPanel */}
      <Sheet open={drawerPath !== null} onOpenChange={(o) => !o && closeDrawer()}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Page insights</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {drawerPath && (
              <GscInsightsPanel
                pagePath={drawerPath}
                pageTitle={drawerTitle}
                postSlug={
                  drawerPath.startsWith("/blog/")
                    ? drawerPath.replace(/^\/blog\//, "").replace(/\/$/, "")
                    : undefined
                }
                onSendToRewriter={handleSendToRewriter}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
