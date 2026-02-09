"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { History, Clock, Tag, FileText, Loader2, Trash2, Sparkles, RefreshCw, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type RecentEntry = {
  id: string;
  created_at: string;
  focus_keyword: string | null;
  title: string;
  generation_time_ms?: number | null;
};

function formatGenerationTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  const now = new Date();
  let diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) diffMs = 0; // future timestamp → treat as "just now"
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function RecentPage() {
  const [entries, setEntries] = useState<RecentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    setDeleteError(null);
    if (!showLoading) setRefreshing(true);
    return fetch("/api/blog/history", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          setError("auth");
          return [];
        }
        if (res.status === 503) {
          setError("config");
          return [];
        }
        if (!res.ok) {
          setError("error");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        return data;
      })
      .catch(() => {
        setError("error");
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDeleteEntry = async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/blog/history?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }
      await loadEntries(false);
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setDeleteError("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recent Generations</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Recently generated blog posts from Content Writer
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="p-5">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-5 flex-1 rounded bg-muted/60 animate-pulse" />
                  <div className="h-5 w-24 rounded bg-muted/60 animate-pulse" />
                  <div className="h-5 w-16 rounded bg-muted/60 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === "auth") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recent Generations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to view your recent blog generations
          </p>
        </div>
        <EmptyState
          icon={History}
          heading="Sign in required"
          description="You need to be signed in to view recent generations."
        />
      </div>
    );
  }

  if (error === "config") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recent Generations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            History not available. Check .env.local and SETUP.md for Supabase configuration.
          </p>
        </div>
        <EmptyState
          icon={History}
          heading="History not configured"
          description="Configure Supabase to enable the Recent generations feature."
        />
      </div>
    );
  }

  if (error === "error" || entries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recent Generations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recently generated blog posts from Content Writer
          </p>
        </div>
        <EmptyState
          icon={History}
          heading={error === "error" ? "Could not load history" : "No recent generations"}
          description={
            error === "error"
              ? "There was a problem loading your recent generations."
              : "Generate a post in Content Writer and it will automatically appear here."
          }
          action={
            <Link
              href="/dashboard/blog"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              <Sparkles className="h-4 w-4" />
              Go to Content Writer
            </Link>
          }
        />
      </div>
    );
  }

  const entryToConfirm = confirmDeleteId ? entries.find((e) => e.id === confirmDeleteId) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recent Generations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and continue editing your recently generated blog posts
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadEntries(false)}
          disabled={loading || refreshing}
          className="gap-2 border-border/50"
        >
          {(loading || refreshing) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {deleteError}
          </span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="rounded p-1 text-destructive/80 hover:bg-destructive/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {confirmDeleteId && entryToConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
              Delete article?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {entryToConfirm.title}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              This will remove it from recent generations. It cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDeleteEntry(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
              >
                {deletingId === confirmDeleteId ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-6 py-4 text-left">
                  <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
                    <FileText className="h-4 w-4 opacity-60" aria-hidden />
                    Title
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
                    <Tag className="h-4 w-4 opacity-60" aria-hidden />
                    Keyword
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
                    <Clock className="h-4 w-4 opacity-60" aria-hidden />
                    Time
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground">
                    Generated
                  </span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-6 py-5">
                    <span className="text-[15px] font-medium leading-relaxed text-foreground line-clamp-2">
                      {entry.title}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {entry.focus_keyword ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground/80">
                        <Tag className="h-3 w-3 shrink-0 opacity-70" />
                        <span className="truncate max-w-[140px]">{entry.focus_keyword}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm tabular-nums text-muted-foreground/70">
                      {formatGenerationTime(entry.generation_time_ms)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-muted-foreground/70">
                      {formatRelativeDate(entry.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center">
                      <Button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        disabled={deletingId === entry.id}
                        size="sm"
                        variant="outline"
                        aria-label={entry.title ? `Delete ${entry.title}` : `Delete entry ${entry.id}`}
                        title={entry.title ? `Delete ${entry.title}` : `Delete entry ${entry.id}`}
                        className="h-8 w-8 border-border/40 bg-background p-0 text-destructive/80 transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        {deletingId === entry.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground/60">
        <p>
          Showing {entries.length} recent {entries.length === 1 ? "generation" : "generations"}
        </p>
      </div>
    </div>
  );
}
