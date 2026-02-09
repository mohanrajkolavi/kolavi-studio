"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FileText, ExternalLink, X, RefreshCw, Loader2, AlertCircle, Calendar, Tag, ChevronUp, ChevronDown, Download } from "lucide-react";

const PAGE_SIZE = 20;
const CATEGORY_DEBOUNCE_MS = 300;

type SortKey = "title" | "age" | "lastReviewed";
type SortDir = "asc" | "desc";

type PostMaintenance = {
  slug: string;
  title: string;
  modified: string;
  ageDays: number;
  categories: string[];
  tags: string[];
  status: string;
  note: string | null;
  lastReviewedAt: string | null;
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "up_to_date", label: "Up to date" },
  { value: "needs_review", label: "Needs review" },
  { value: "planned_refresh", label: "Planned" },
];

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    unreviewed: "Unreviewed",
    up_to_date: "Up to date",
    needs_review: "Needs review",
    planned_refresh: "Planned",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

const statusStyles: Record<string, string> = {
  unreviewed: "bg-muted/50 text-muted-foreground",
  up_to_date: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  needs_review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  planned_refresh: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200",
};

export default function ContentMaintenancePage() {
  const [posts, setPosts] = useState<PostMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [persistWarning, setPersistWarning] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    minAgeDays: "",
    category: "",
  });
  const [categoryDebounced, setCategoryDebounced] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("age");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostMaintenance | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const lastSavedNoteRef = useRef<{ slug: string; note: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Debounce category filter
  useEffect(() => {
    const t = setTimeout(() => setCategoryDebounced(filters.category), CATEGORY_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filters.category]);

  const refreshSelectedPost = useCallback(async (slug: string, patch?: Partial<PostMaintenance>) => {
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, { cache: "no-store" });
      if (!response.ok) return;
      const refreshed = await response.json();
      if (!refreshed || typeof refreshed !== "object" || Array.isArray(refreshed)) return;
      setSelectedPost((prev) => {
        if (!prev || prev.slug !== slug) return prev;
        return { ...prev, ...refreshed, ...(patch ?? {}) };
      });
    } catch {
      // ignore
    }
  }, []);

  const loadPosts = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.minAgeDays) params.append("minAgeDays", filters.minAgeDays);
        if (categoryDebounced) params.append("category", categoryDebounced);

        const response = await fetch(`/api/content-maintenance?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        if (data.databaseConnected === false) {
          setPersistWarning("Database isn't connected. Add DATABASE_URL to save status and notes.");
        } else {
          setPersistWarning(null);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setFetchError("Could not load posts. Check WordPress connection and try again.");
        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters.status, filters.minAgeDays, categoryDebounced]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const hasActiveFilters = Boolean(filters.status || filters.minAgeDays || filters.category);

  const clearFilters = useCallback(() => {
    setFilters({ status: "", minAgeDays: "", category: "" });
    setCategoryDebounced("");
    setCurrentPage(1);
    setSelectedSlugs(new Set());
  }, []);

  const sortedPosts = useMemo(() => {
    const list = [...posts];
    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "title") return mult * (a.title.localeCompare(b.title));
      if (sortKey === "age") return mult * (a.ageDays - b.ageDays);
      if (sortKey === "lastReviewed") {
        const ad = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
        const bd = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
        return mult * (ad - bd);
      }
      return 0;
    });
    return list;
  }, [posts, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE));
  const paginatedPosts = useMemo(
    () => sortedPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedPosts, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [posts.length, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSlugs.size === paginatedPosts.length) setSelectedSlugs(new Set());
    else setSelectedSlugs(new Set(paginatedPosts.map((p) => p.slug)));
  };

  const exportToCsv = useCallback(() => {
    const headers = ["Title", "Slug", "Status", "Age (days)", "Last reviewed", "Note"];
    const rows = sortedPosts.map((p) => [
      `"${(p.title || "").replace(/"/g, '""')}"`,
      p.slug,
      p.status || "",
      String(p.ageDays),
      p.lastReviewedAt ? new Date(p.lastReviewedAt).toISOString().slice(0, 10) : "",
      `"${(p.note || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-maintenance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedPosts]);

  useEffect(() => {
    if (selectedPost) modalRef.current?.focus();
  }, [selectedPost]);

  async function handleStatusChange(slug: string, newStatus: string) {
    const prev = posts.find((p) => p.slug === slug);
    if (!prev) return;
    setPosts((p) => p.map((x) => (x.slug === slug ? { ...x, status: newStatus } : x)));
    setSelectedPost((s) => (s?.slug === slug ? { ...s, status: newStatus } : s));
    setFetchError(null);
    setUpdating(slug);
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      const updated = await response.json();
      if (updated?.persisted === false) setPersistWarning("Database isn't connected. Add DATABASE_URL to save.");
      else setPersistWarning(null);
      void refreshSelectedPost(slug);
    } catch {
      setPosts((p) => p.map((x) => (x.slug === slug ? { ...x, status: prev.status } : x)));
      setSelectedPost((s) => (s?.slug === slug ? { ...s, status: prev.status } : s));
      setFetchError("Failed to update status. Try again.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleMarkAsReviewed(slug: string) {
    const prev = posts.find((p) => p.slug === slug);
    if (!prev) return;
    const now = new Date().toISOString();
    setPosts((p) =>
      p.map((x) =>
        x.slug === slug ? { ...x, status: "up_to_date" as const, lastReviewedAt: now } : x
      )
    );
    setSelectedPost((s) =>
      s?.slug === slug ? { ...s, status: "up_to_date", lastReviewedAt: now } : s
    );
    setFetchError(null);
    setUpdating(slug);
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAsReviewed: true, status: "up_to_date" }),
      });
      if (!response.ok) throw new Error("Failed to mark as reviewed");
      const updated = await response.json();
      if (updated?.persisted === false) setPersistWarning("Database isn't connected. Add DATABASE_URL to save.");
      else setPersistWarning(null);
      void refreshSelectedPost(slug, { status: "up_to_date", lastReviewedAt: now });
    } catch {
      setPosts((p) =>
        p.map((x) =>
          x.slug === slug ? { ...x, status: prev.status, lastReviewedAt: prev.lastReviewedAt } : x
        )
      );
      setSelectedPost((s) =>
        s?.slug === slug ? { ...s, status: prev.status, lastReviewedAt: prev.lastReviewedAt } : s
      );
      setFetchError("Failed to mark as reviewed. Try again.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleNoteUpdate(slug: string, note: string) {
    if (lastSavedNoteRef.current?.slug === slug && lastSavedNoteRef.current?.note === note) return;
    const prev = posts.find((p) => p.slug === slug);
    lastSavedNoteRef.current = { slug, note };
    setPosts((p) => p.map((x) => (x.slug === slug ? { ...x, note } : x)));
    setSelectedPost((s) => (s?.slug === slug ? { ...s, note } : s));
    setFetchError(null);
    setUpdating(slug);
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      const updated = await response.json();
      if (updated?.persisted === false) setPersistWarning("Database isn't connected. Add DATABASE_URL to save.");
      else setPersistWarning(null);
      void refreshSelectedPost(slug);
    } catch {
      const prevNote = prev?.note ?? null;
      setPosts((p) => p.map((x) => (x.slug === slug ? { ...x, note: prevNote } : x)));
      setSelectedPost((s) => (s?.slug === slug ? { ...s, note: prevNote } : s));
      setFetchError("Failed to save note. Try again.");
      lastSavedNoteRef.current = null;
    } finally {
      setUpdating(null);
    }
  }

  async function handleBulkMarkReviewed() {
    const slugs = Array.from(selectedSlugs);
    if (slugs.length === 0) return;
    const snap = posts.filter((p) => selectedSlugs.has(p.slug));
    setBulkUpdating(true);
    setFetchError(null);
    const now = new Date().toISOString();
    setPosts((p) =>
      p.map((x) =>
        selectedSlugs.has(x.slug)
          ? { ...x, status: "up_to_date" as const, lastReviewedAt: now }
          : x
      )
    );
    setSelectedPost((s) =>
      s && selectedSlugs.has(s.slug)
        ? { ...s, status: "up_to_date", lastReviewedAt: now }
        : s
    );
    setSelectedSlugs(new Set());
    try {
      const results = await Promise.all(
        slugs.map((slug) =>
          fetch(`/api/content-maintenance/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAsReviewed: true, status: "up_to_date" }),
          }).then((r) => ({ slug, ok: r.ok }))
        )
      );
      const failed = results.filter((r) => !r.ok).map((r) => r.slug);
      if (failed.length) throw new Error("Some updates failed");
    } catch {
      setPosts((p) =>
        p.map((x) => {
          const before = snap.find((s) => s.slug === x.slug);
          return before && x.slug === before.slug
            ? { ...x, status: before.status, lastReviewedAt: before.lastReviewedAt }
            : x;
        })
      );
      setSelectedPost((s) => {
        if (!s) return s;
        const before = snap.find((b) => b.slug === s.slug);
        return before ? { ...s, status: before.status, lastReviewedAt: before.lastReviewedAt } : s;
      });
      setFetchError("Bulk update failed. Some items reverted.");
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleBulkStatus(status: string) {
    const slugs = Array.from(selectedSlugs);
    if (slugs.length === 0) return;
    const snap = posts.filter((p) => selectedSlugs.has(p.slug));
    setBulkUpdating(true);
    setFetchError(null);
    setPosts((p) =>
      p.map((x) => (selectedSlugs.has(x.slug) ? { ...x, status } : x))
    );
    setSelectedPost((s) => (s && selectedSlugs.has(s.slug) ? { ...s, status } : s));
    setSelectedSlugs(new Set());
    try {
      const results = await Promise.all(
        slugs.map((slug) =>
          fetch(`/api/content-maintenance/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }).then((r) => ({ slug, ok: r.ok }))
        )
      );
      const failed = results.filter((r) => !r.ok).map((r) => r.slug);
      if (failed.length) throw new Error("Some updates failed");
    } catch {
      setPosts((p) =>
        p.map((x) => {
          const before = snap.find((s) => s.slug === x.slug);
          return before && x.slug === before.slug ? { ...x, status: before.status } : x;
        })
      );
      setSelectedPost((s) => {
        if (!s) return s;
        const before = snap.find((b) => b.slug === s.slug);
        return before ? { ...s, status: before.status } : s;
      });
      setFetchError("Bulk status update failed. Some items reverted.");
    } finally {
      setBulkUpdating(false);
    }
  }

  const handleNoteBlur = () => {
    if (selectedPost) handleNoteUpdate(selectedPost.slug, selectedPost.note ?? "");
  };

  useEffect(() => {
    if (!selectedPost) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
  }, [selectedPost]);

  useEffect(() => {
    if (!selectedPost || !modalContentRef.current) return;
    const el = modalContentRef.current;
    const focusable =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const nodes = el.querySelectorAll<HTMLElement>(focusable);
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [selectedPost]);

  const closeModal = useCallback(() => {
    setSelectedPost(null);
    previouslyFocusedRef.current?.focus();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Content Maintenance</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track blog posts and keep content fresh
          </p>
          {persistWarning && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {persistWarning}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadPosts(false)}
          disabled={loading || refreshing}
          className="gap-2 border-border/50"
        >
          {loading || refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {fetchError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {fetchError}
          </span>
          <button
            type="button"
            onClick={() => setFetchError(null)}
            className="rounded p-1 hover:bg-destructive/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Status" className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, status: tab.value }))}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filters.status === tab.value
                    ? "bg-orange-600 text-white dark:bg-orange-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="cm-age" className="block text-xs font-medium text-muted-foreground">
                Min days old
              </label>
              <Input
                id="cm-age"
                type="number"
                placeholder="60"
                min={0}
                value={filters.minAgeDays}
                onChange={(e) => setFilters((f) => ({ ...f, minAgeDays: e.target.value }))}
                className="mt-1.5 h-9 w-24 rounded-lg border-border/50"
                aria-label="Min age (days)"
              />
            </div>
            <div>
              <label htmlFor="cm-category" className="block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <Input
                id="cm-category"
                placeholder="SEO, Marketing…"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="mt-1.5 h-9 w-36 rounded-lg border-border/50 sm:w-40"
                aria-label="Filter by category"
              />
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Clear filters
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={exportToCsv} disabled={posts.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </section>

      {/* Posts table */}
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Posts</h2>
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-5 flex-1 rounded bg-muted/60 animate-pulse" />
                    <div className="h-5 w-12 rounded bg-muted/60 animate-pulse" />
                    <div className="h-5 w-20 rounded bg-muted/60 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/20">
            <EmptyState
              icon={FileText}
              heading={fetchError ? "Could not load posts" : "No posts found"}
              description={
                fetchError
                  ? "Check your WordPress connection and try again."
                  : hasActiveFilters
                    ? "No posts match your filters. Try changing or clearing them."
                    : "Connect WordPress (NEXT_PUBLIC_WP_GRAPHQL_URL) to see blog posts here."
              }
              action={
                <Button variant="outline" size="sm" onClick={() => loadPosts(false)} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("title")}
                        className="flex items-center gap-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        <FileText className="h-3.5 w-3.5 opacity-60" />
                        Post
                        {sortKey === "title" && (sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                      </button>
                    </th>
                    <th className="w-32 px-5 py-3.5 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 opacity-60" />
                        Categories
                      </span>
                    </th>
                    <th className="w-20 px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("age")}
                        className="flex items-center gap-1.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        Age
                        {sortKey === "age" && (sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                      </button>
                    </th>
                    <th className="w-28 px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("lastReviewed")}
                        className="flex items-center gap-1.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        Reviewed
                        {sortKey === "lastReviewed" && (sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                      </button>
                    </th>
                    <th className="w-36 px-5 py-3.5 text-left">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post) => (
                    <tr
                      key={post.slug}
                      role="button"
                      tabIndex={0}
                      className={`border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20 cursor-pointer ${
                        post.ageDays > 60 ? "bg-amber-500/[0.04]" : ""
                      }`}
                      onClick={() => {
                        setSelectedPost(post);
                        lastSavedNoteRef.current = post.note != null ? { slug: post.slug, note: post.note } : null;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPost(post);
                          lastSavedNoteRef.current = post.note != null ? { slug: post.slug, note: post.note } : null;
                        }
                      }}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] font-medium leading-snug text-foreground hover:underline line-clamp-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="w-32 px-5 py-4 align-top">
                        {post.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {post.categories.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
                              >
                                {cat}
                              </span>
                            ))}
                            {post.categories.length > 3 && (
                              <span className="text-[11px] text-muted-foreground/70">+{post.categories.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="w-20 px-5 py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium tabular-nums ${
                            post.ageDays > 60
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {post.ageDays}d
                        </span>
                      </td>
                      <td className="w-28 px-5 py-4 align-top text-sm tabular-nums text-muted-foreground">
                        {post.lastReviewedAt
                          ? new Date(post.lastReviewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="w-36 px-5 py-4 align-top">
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post.slug, e.target.value)}
                          disabled={updating === post.slug}
                          onClick={(e) => e.stopPropagation()}
                          className={`h-8 w-full min-w-0 rounded-md border-0 px-2.5 text-xs font-medium focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                            statusStyles[post.status] || statusStyles.unreviewed
                          }`}
                        >
                          {STATUS_TABS.slice(1).map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground/60">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedPosts.length)} of {sortedPosts.length} post{sortedPosts.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Post detail modal */}
      {selectedPost && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-modal-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 outline-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
          }}
        >
          <div
            ref={modalContentRef}
            role="document"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/50 bg-card p-5">
              <div className="min-w-0 flex-1">
                <h2 id="post-modal-title" className="text-lg font-semibold leading-snug text-foreground">
                  {selectedPost.title}
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Tag className="h-3.5 w-3.5 opacity-60" />
                  {selectedPost.categories.join(", ") || "Uncategorized"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground/70">{selectedPost.ageDays} days old</span>
                  {selectedPost.ageDays > 60 && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      Review needed
                    </span>
                  )}
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                      statusStyles[selectedPost.status] || statusStyles.unreviewed
                    }`}
                  >
                    {statusLabel(selectedPost.status)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="h-8 w-8 shrink-0 rounded-lg hover:bg-muted/50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <label htmlFor="post-status" className="block text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="post-status"
                  value={selectedPost.status}
                  onChange={(e) => handleStatusChange(selectedPost.slug, e.target.value)}
                  disabled={updating === selectedPost.slug}
                  className="mt-2 h-10 w-full rounded-lg border border-border/50 bg-background px-4 text-sm focus:ring-2 focus:ring-ring"
                >
                  {STATUS_TABS.slice(1).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="post-notes" className="block text-sm font-medium text-foreground">
                  Notes
                </label>
                <Textarea
                  id="post-notes"
                  value={selectedPost.note ?? ""}
                  onChange={(e) => setSelectedPost({ ...selectedPost, note: e.target.value })}
                  onBlur={handleNoteBlur}
                  className="mt-2 min-h-[100px] rounded-lg border border-border/50 bg-background text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Add maintenance notes…"
                />
                {updating === selectedPost.slug && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Saving…</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={() => handleMarkAsReviewed(selectedPost.slug)}
                  disabled={updating === selectedPost.slug}
                  className="rounded-lg bg-orange-600 px-4 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  Mark as reviewed
                </Button>
                <Link href={`/blog/${selectedPost.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg border-border/50">
                    <ExternalLink className="h-4 w-4" />
                    View post
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
