"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { FileText, ExternalLink, X } from "lucide-react";

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
  const [filters, setFilters] = useState({
    status: "",
    minAgeDays: "",
    category: "",
  });
  const [selectedPost, setSelectedPost] = useState<PostMaintenance | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.minAgeDays) params.append("minAgeDays", filters.minAgeDays);
      if (filters.category) params.append("category", filters.category);

      const response = await fetch(`/api/content-maintenance?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.minAgeDays, filters.category]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (selectedPost) {
      modalRef.current?.focus();
    }
  }, [selectedPost]);

  async function handleStatusChange(slug: string, newStatus: string) {
    setUpdating(slug);
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await fetchPosts();
      if (selectedPost?.slug === slug) {
        const updated = await fetch(`/api/content-maintenance/${slug}`).then((r) => r.json());
        setSelectedPost({ ...selectedPost, ...updated });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(null);
    }
  }

  async function handleMarkAsReviewed(slug: string) {
    setUpdating(slug);
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAsReviewed: true, status: "up_to_date" }),
      });
      if (!response.ok) throw new Error("Failed to mark as reviewed");
      await fetchPosts();
      if (selectedPost?.slug === slug) {
        const updated = await fetch(`/api/content-maintenance/${slug}`).then((r) => r.json());
        setSelectedPost({ ...selectedPost, ...updated, status: "up_to_date" });
      }
    } catch (error) {
      console.error("Error marking as reviewed:", error);
    } finally {
      setUpdating(null);
    }
  }

  async function handleNoteUpdate(slug: string, note: string) {
    setUpdating(slug);
    try {
      const response = await fetch(`/api/content-maintenance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      await fetchPosts();
      if (selectedPost?.slug === slug) {
        const updated = await fetch(`/api/content-maintenance/${slug}`).then((r) => r.json());
        setSelectedPost({ ...selectedPost, ...updated });
      }
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Content Maintenance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track blog posts and keep content fresh
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <nav
                aria-label="Status"
                className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0"
              >
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value || "all"}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, status: tab.value }))}
                  className={`shrink-0 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.status === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="flex shrink-0 flex-wrap items-center gap-4">
              <div>
                <label htmlFor="cm-age" className="block text-sm font-medium text-foreground">
                  Min days old
                </label>
                <Input
                  id="cm-age"
                  type="number"
                  placeholder="60"
                  value={filters.minAgeDays}
                  onChange={(e) => setFilters((f) => ({ ...f, minAgeDays: e.target.value }))}
                  className="mt-2 h-11 w-28 rounded-2xl border border-border bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Min age (days)"
                />
              </div>
              <div>
                <label htmlFor="cm-category" className="block text-sm font-medium text-foreground">
                  Category
                </label>
                <Input
                  id="cm-category"
                  placeholder="SEO, Marketing…"
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="mt-2 h-11 w-40 rounded-2xl border border-border bg-background focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
                  aria-label="Filter by category"
                />
              </div>
            </div>
            </div>
          </div>
      </section>

      {/* Posts */}
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Posts</h2>
        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <TableSkeleton rows={6} columns={5} />
          </div>
        ) : posts.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
            <EmptyState
              icon={FileText}
              heading="No posts found"
              description="Connect WordPress to see your blog posts here, or adjust your filters."
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">
                      Post
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground w-24">
                      Age
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-medium text-muted-foreground w-28 md:table-cell">
                      Status
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-medium text-muted-foreground w-32 sm:table-cell">
                      Last reviewed
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr
                      key={post.slug}
                      role="button"
                      tabIndex={0}
                      className={`group border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30 cursor-pointer ${
                        post.ageDays > 60 ? "bg-amber-500/[0.04]" : ""
                      }`}
                      onClick={() => setSelectedPost(post)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPost(post);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="font-medium text-foreground hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {post.title}
                          </Link>
                          {post.categories.length > 0 && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {post.categories.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`tabular-nums ${
                              post.ageDays > 60
                                ? "font-semibold text-foreground"
                                : "text-sm text-muted-foreground"
                            }`}
                          >
                            {post.ageDays}d
                          </span>
                          {post.ageDays > 60 && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              Review
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-6 py-4 md:table-cell">
                        <span
                          className={`inline-flex items-center rounded-2xl px-2 py-0.5 text-xs font-medium ${
                            statusStyles[post.status] || statusStyles.unreviewed
                          }`}
                        >
                          {statusLabel(post.status)}
                        </span>
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-muted-foreground sm:table-cell">
                        {post.lastReviewedAt
                          ? new Date(post.lastReviewedAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post.slug, e.target.value)}
                          disabled={updating === post.slug}
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 rounded-2xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-ring"
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
      </section>

      {/* Post detail modal */}
      {selectedPost && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Modal backdrop: click to close
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-modal-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm outline-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPost(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedPost(null);
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Modal content: stop propagation */}
          <div
            role="document"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-sm"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex flex-row items-start justify-between gap-4 border-b border-border bg-card p-5">
              <div className="min-w-0 flex-1">
                <h2 id="post-modal-title" className="text-base font-semibold leading-snug text-foreground">
                  {selectedPost.title}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {selectedPost.categories.join(", ") || "Uncategorized"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedPost.ageDays} days old
                  </span>
                  {selectedPost.ageDays > 60 && (
                    <span className="rounded-2xl bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      Review needed
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
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
                onClick={() => setSelectedPost(null)}
                className="shrink-0 rounded-2xl hover:bg-muted/50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-6 p-5">
              <div>
                <label htmlFor="post-status" className="block text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="post-status"
                  value={selectedPost.status}
                  onChange={(e) => handleStatusChange(selectedPost.slug, e.target.value)}
                  disabled={updating === selectedPost.slug}
                  className="mt-2 flex h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm focus:ring-2 focus:ring-ring"
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
                  onBlur={() => handleNoteUpdate(selectedPost.slug, selectedPost.note ?? "")}
                  className="mt-2 min-h-[100px] rounded-2xl border border-border bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Add maintenance notes…"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  onClick={() => handleMarkAsReviewed(selectedPost.slug)}
                  disabled={updating === selectedPost.slug}
                  className="rounded-2xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                >
                  Mark as reviewed
                </Button>
                <Link href={`/blog/${selectedPost.slug}`} target="_blank">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-2xl border-border"
                  >
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
