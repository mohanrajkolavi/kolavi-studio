"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, FileEdit, FileSearch, ArrowRight } from "lucide-react";

type DashboardStats = {
  leadsTotal: number;
  leadsNew: number;
  postsTotal: number;
  postsNeedsReview: number;
};

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setApiError(null);
      try {
        const [leadsRes, contentRes] = await Promise.all([
          fetch("/api/leads?limit=1000"),
          fetch("/api/content-maintenance"),
        ]);
        const leadsOk = leadsRes.ok;
        const contentOk = contentRes.ok;
        if (!leadsOk || !contentOk) {
          const errs: string[] = [];
          if (!leadsOk) errs.push(`Leads: ${leadsRes.status} ${leadsRes.statusText}`);
          if (!contentOk) errs.push(`Content: ${contentRes.status} ${contentRes.statusText}`);
          setApiError(errs.join(". "));
        }
        const leadsData = leadsOk ? await leadsRes.json() : { leads: [] };
        const contentData = contentOk ? await contentRes.json() : { posts: [] };
        const leads = leadsData.leads ?? [];
        const posts = contentData.posts ?? [];
        setStats({
          leadsTotal: leads.length,
          leadsNew: leads.filter((l: { status: string }) => l.status === "new").length,
          postsTotal: posts.length,
          postsNeedsReview: posts.filter((p: { status: string }) => p.status === "needs_review").length,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setApiError(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const quickActions = [
    { href: "/dashboard/leads", label: "Leads", description: "Manage contact form submissions and track pipeline", icon: Users },
    { href: "/dashboard/blog", label: "Content Writer", description: "Generate and publish posts with Claude AI", icon: FileEdit },
    { href: "/dashboard/content-maintenance", label: "Content Maintenance", description: "Track and update blog post status", icon: FileSearch },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your dashboard at a glance. Use the tabs above to navigate.
        </p>

        {apiError && (
          <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Some dashboard data couldn’t be loaded.</p>
            <p className="mt-1 text-destructive/90">{apiError}</p>
          </div>
        )}
      </header>

      {/* Stats */}
      <section aria-label="Dashboard stats">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-card p-5"
              >
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="mt-3 h-8 w-16 rounded bg-muted/70" />
                <div className="mt-2 h-3 w-24 rounded bg-muted/60" />
              </div>
            ))
          ) : stats ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Leads</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{stats.leadsTotal}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.leadsNew > 0 ? (
                    <span className="text-orange-600 dark:text-orange-400">{stats.leadsNew} new</span>
                  ) : (
                    "No new leads"
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Posts</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{stats.postsTotal}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.postsNeedsReview > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400">{stats.postsNeedsReview} need review</span>
                  ) : (
                    "All up to date"
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick action</p>
                <p className="mt-2 text-base font-medium text-foreground">Create a post</p>
                <p className="mt-1 text-sm text-muted-foreground">Generate a draft with Content Writer.</p>
                <Link
                  href="/dashboard/blog"
                  className="mt-4 inline-flex items-center rounded-2xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  Open Content Writer
                </Link>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick action</p>
                <p className="mt-2 text-base font-medium text-foreground">Review content</p>
                <p className="mt-1 text-sm text-muted-foreground">Keep posts fresh and updated.</p>
                <Link
                  href="/dashboard/content-maintenance"
                  className="mt-4 inline-flex items-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  Open Content
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Stats unavailable.
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-36 rounded bg-muted/70" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-orange-200 hover:bg-muted/30 dark:hover:border-orange-800">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:text-orange-400">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground">{action.label}</h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5" aria-hidden />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
