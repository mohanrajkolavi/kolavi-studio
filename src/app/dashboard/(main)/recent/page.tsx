"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { History, Clock, Tag, FileText } from "lucide-react";

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

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/blog/history", { credentials: "include" })
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
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {
        setError("error");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recent Generations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recently generated blog posts from Content Writer
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-5 flex-1 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-16 rounded bg-muted animate-pulse" />
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
              : "Generate a post in Content Writer and click Start over to save it here."
          }
          action={
            <Link
              href="/dashboard/blog"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              <FileText className="h-4 w-4" />
              Go to Content Writer
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Recent Generations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recently generated blog posts with title, keyword, and generation time
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3.5 text-left text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" aria-hidden />
                    Title
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4" aria-hidden />
                    Keyword
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" aria-hidden />
                    Time to generate
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left text-sm font-medium text-muted-foreground">
                  Generated
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <span className="font-medium text-foreground line-clamp-2">
                      {entry.title}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-muted-foreground">
                      {entry.focus_keyword || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-muted-foreground tabular-nums">
                      {formatGenerationTime(entry.generation_time_ms)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {formatRelativeDate(entry.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/blog" className="underline hover:text-foreground">
          Open Content Writer
        </Link>
        {" "}to generate new posts or load a recent one.
      </p>
    </div>
  );
}
