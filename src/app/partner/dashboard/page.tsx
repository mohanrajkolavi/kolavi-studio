"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  LogOut,
  Users,
  TrendingUp,
  Clock,
  Banknote,
  Share2,
  Receipt,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { SITE_URL } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createPortal } from "react-dom";

type PartnerData = {
  partner: {
    id: string;
    code: string;
    name: string;
    email: string;
    commissionOneTimePct: number;
    commissionRecurringPct: number;
    createdAt: string;
  };
  stats: {
    referredLeadsCount: number;
    totalCommissionEarned: number;
    pendingCommission: number;
    totalPaidOut: number;
  };
  referredLeads: Array<{
    id: string;
    name: string;
    status: string;
    commission: number;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

const faqItems = [
  {
    question: "How does my referral link work?",
    answer:
      "Share your unique link (yoursite.com/partner?ref=YOURCODE). When someone clicks it, we set a 30-day cookie. If they become a paying client within that window, you earn commission.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Payouts are processed on a schedule (e.g., monthly). Pending commission appears in your dashboard until it's paid out. Minimum payout thresholds may apply.",
  },
  {
    question: "What is the commission structure?",
    getAnswer: (p?: { commissionOneTimePct?: number; commissionRecurringPct?: number }) =>
      `${p?.commissionOneTimePct ?? 15}% on one-time fees and ${p?.commissionRecurringPct ?? 10}% on monthly recurring revenue from referred clients. Commission is paid only when the lead converts to a paying client.`,
  },
  {
    question: "How long is the attribution window?",
    answer:
      "30 days. The first partner link clicked receives credit. If a visitor submits a contact form within 30 days of clicking your link, the lead is attributed to you.",
  },
];

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = useCallback(() => {
    setError(null);
    setLoading(true);
    fetch("/api/partner/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          router.push("/partner/login");
          return null;
        }
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d) => {
        if (d != null) setData(d);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Failed to load"));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileMenuOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await fetch("/api/partner/logout", { method: "POST", credentials: "include" });
    router.push("/partner/login");
    router.refresh();
  }

  async function copyLink() {
    if (!data) return;
    const url = `${SITE_URL}/partner?ref=${data.partner.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium text-muted-foreground">
            {error.message}
          </p>
          <Button onClick={loadData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="loader-ring" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading your dashboard
          </p>
        </div>
      </div>
    );
  }

  const { partner, stats, referredLeads, payouts } = data;
  const referralUrl = `${SITE_URL}/partner?ref=${partner.code}`;

  const statCards = [
    { label: "Referred leads", value: stats.referredLeadsCount, icon: Users },
    {
      label: "Commission earned",
      value: formatCurrency(stats.totalCommissionEarned),
      icon: TrendingUp,
    },
    {
      label: "Pending",
      value: formatCurrency(stats.pendingCommission),
      icon: Clock,
    },
    { label: "Paid out", value: formatCurrency(stats.totalPaidOut), icon: Banknote },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
      {/* Header - matches main site pill style */}
      <header className="sticky top-0 z-40 w-full bg-background/95 px-4 pt-4 backdrop-blur-xl sm:px-6 dark:bg-background/90">
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto]"
        >
          Skip to main content
        </a>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-border bg-background/80 px-5 shadow-sm backdrop-blur-xl sm:px-6 dark:bg-background/80 dark:border-border">
          {/* Logo */}
          <Link
            href="/partner"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-lg"
          >
            <Logo className="text-xl font-bold tracking-tight text-foreground sm:text-2xl" withPeriod />
          </Link>

          {/* Desktop: centered label */}
          <div className="hidden md:flex md:flex-1 md:items-center md:justify-center">
            <span className="rounded-2xl px-4 py-2 text-[15px] font-medium text-muted-foreground">
              Partner Dashboard
            </span>
          </div>

          {/* Desktop: Theme toggle + Sign out */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign out
            </button>
          </div>

          {/* Mobile: Theme toggle + Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav overlay - matches main site MobileNav */}
        {mobileMenuOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Partner navigation"
              data-state={mobileMenuOpen ? "open" : "closed"}
              className={`fixed inset-0 z-[100] flex flex-col bg-background transition-[opacity,visibility] duration-300 ease-out ${
                mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
                <Link
                  href="/partner"
                  className="text-lg font-semibold tracking-tight text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Logo withPeriod={false} />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col items-center justify-center px-6 py-8">
                <p className="text-[17px] font-semibold text-muted-foreground">
                  Partner Dashboard
                </p>
                <div className="mt-10 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:opacity-90"
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.5} />
                    Sign out
                  </button>
                </div>
              </nav>
            </div>,
            document.body
          )}
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1600px] min-w-0 overflow-x-clip px-4 pb-24 pt-10 sm:px-6 lg:px-8 xl:px-10"
      >
        {/* Share and earn - Premium hero card */}
        <Card className="overflow-hidden border border-border/60 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <div className="bg-gradient-to-b from-muted/30 to-transparent">
            <CardHeader className="pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Your referral link
              </CardDescription>
              <CardTitle className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Share and earn
              </CardTitle>
              <CardDescription className="mt-2 max-w-lg text-base leading-relaxed">
                {partner.commissionOneTimePct}% one-time, {partner.commissionRecurringPct}%
                recurring. 30-day attribution.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center rounded-lg border border-border/60 bg-background/50 px-4 py-3 font-mono text-sm ring-1 ring-border/30">
                  <span className="truncate text-foreground/90">{referralUrl}</span>
                </div>
                <Button
                onClick={copyLink}
                variant={copied ? "outline" : "default"}
                size="lg"
                className={cn(
                  "shrink-0 gap-2 rounded-xl",
                  copied &&
                    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-400"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" strokeWidth={2} />
                    Copy link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          </div>
        </Card>

        {/* Stats - Premium metric cards */}
        <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="overflow-hidden border border-border/60 transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-border/40"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                      {stat.value}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/30">
                    <stat.icon
                      className="h-6 w-6 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Content grid - Referred leads & Payment history */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Referred leads card */}
          <Card className="overflow-hidden border border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/30">
                    <Share2
                      className="h-6 w-6 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Referred leads
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Leads from your link
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2 text-muted-foreground hover:text-foreground">
                  <Link href="/partner">
                    View program
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="scrollbar-thin max-h-[340px] overflow-y-auto">
                {referredLeads.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-6 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/30">
                      <Users
                        className="h-8 w-8 text-muted-foreground/50"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground">
                        No referred leads yet
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Share your link to get started
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyLink} className="rounded-lg">
                      Copy link
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {referredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-6 px-6 py-4 transition-colors hover:bg-muted/20"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {lead.name}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                            {lead.status.replace(/_/g, " ")} · {formatDate(lead.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatCurrency(lead.commission)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment history card */}
          <Card className="overflow-hidden border border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/30">
                  <Receipt
                    className="h-6 w-6 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Payment history
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Payouts we&apos;ve sent you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="scrollbar-thin max-h-[340px] overflow-y-auto">
                {payouts.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-6 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/30">
                      <Banknote
                        className="h-8 w-8 text-muted-foreground/50"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground">
                        No payouts yet
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Earn commission and we&apos;ll pay you out
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {payouts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-6 px-6 py-4 transition-colors hover:bg-muted/20"
                      >
                        <div>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrency(p.amount)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {p.paidAt
                              ? formatDate(p.paidAt)
                              : formatDate(p.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize rounded-md",
                            p.status === "paid" &&
                              "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                          )}
                        >
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-border/60 pt-14">
          <div className="mx-auto max-w-2xl">
            <h3 className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              FAQ
            </h3>
            <div className="mt-8 space-y-2">
              {faqItems.map((item, index) => (
                <Card key={index} className="overflow-hidden border border-border/60">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-muted/20 [&[data-state=open]>svg]:rotate-180">
                        {item.question}
                        <ChevronDown
                          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                          strokeWidth={2}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border/60 px-5 py-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {"getAnswer" in item && typeof item.getAnswer === "function"
                            ? item.getAnswer(partner)
                            : item.answer}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/partner"
              className="transition-colors hover:text-foreground"
            >
              Partner Program
            </Link>
            <Link
              href="/partner/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
