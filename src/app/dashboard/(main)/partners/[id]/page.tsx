"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Mail,
  Percent,
  Calendar,
  UserCheck,
  Receipt,
  Plus,
  Loader2,
  Banknote,
  Trash2,
  X,
  BarChart3,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SITE_URL } from "@/lib/constants";

type Partner = {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  commissionOneTimePct: number;
  commissionRecurringPct: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

type ReferredLead = {
  id: string;
  name: string;
  email: string;
  status: string;
  paidAt: string | null;
  oneTimeAmount: number | null;
  recurringAmount: number | null;
  commission: number;
  createdAt: string;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
};

type PartnerDetail = {
  partner: Partner;
  stats: {
    referredLeadsCount: number;
    totalCommissionEarned: number;
    pendingCommission: number;
    totalPaidOut: number;
  };
  referredLeads: ReferredLead[];
  payouts: Payout[];
};

const statusConfig: Record<string, { className: string }> = {
  active: {
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  paused: {
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  suspended: {
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
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

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [data, setData] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [notes, setNotes] = useState("");
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [markingPaidPayoutId, setMarkingPaidPayoutId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    type: "lead" | "payout" | "partner";
    id: string;
    label: string;
    permanent?: boolean;
  } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    params.then((p) => setPartnerId(p.id));
  }, [params]);

  useEffect(() => {
    if (!partnerId) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/partners/${partnerId}`, { signal: controller.signal })
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d) => d != null && setData(d))
      .catch((err) => {
        if (err?.name !== "AbortError") setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [partnerId]);

  useEffect(() => {
    if (data?.partner.notes !== undefined) {
      setNotes(data.partner.notes ?? "");
    }
  }, [data?.partner.notes]);

  useEffect(() => {
    if (!deleteModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setDeleteModal(null);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [deleteModal, deleting]);

  function copyPartnerLink(code: string) {
    const url = `${SITE_URL}/partner?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleNotesBlur() {
    if (!partnerId || notes === (data?.partner.notes ?? "")) return;
    setUpdatingNotes(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok && data) {
        setData({ ...data, partner: { ...data.partner, notes } });
      }
    } catch {
      // ignore
    } finally {
      setUpdatingNotes(false);
    }
  }

  async function handleRecordPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId || !data) return;
    const amount = parseFloat(payoutAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    setSubmittingPayout(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, notes: payoutNotes || undefined }),
      });
      if (res.ok) {
        const payout = await res.json();
        setData({
          ...data,
          payouts: [payout, ...data.payouts],
        });
        setPayoutAmount("");
        setPayoutNotes("");
        setShowPayoutForm(false);
      } else {
        const errText = await res.text();
        let errMsg = "Failed to record payout";
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error) errMsg = parsed.error;
        } catch {
          if (errText) errMsg = errText;
        }
        alert(errMsg);
      }
    } catch {
      alert("Failed to record payout");
    } finally {
      setSubmittingPayout(false);
    }
  }

  async function handleMarkPayoutPaid(payoutId: string) {
    if (!partnerId || !data) return;
    setMarkingPaidPayoutId(payoutId);
    try {
      const res = await fetch(`/api/partners/${partnerId}/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (res.ok) {
        const payout = await res.json();
        setData({
          ...data,
          payouts: data.payouts.map((p) => (p.id === payoutId ? payout : p)),
        });
      } else {
        const errText = await res.text();
        let errMsg = "Failed to mark as paid";
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error) errMsg = parsed.error;
        } catch {
          if (errText) errMsg = errText;
        }
        alert(errMsg);
      }
    } catch {
      alert("Failed to mark payout as paid");
    } finally {
      setMarkingPaidPayoutId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteModal || !partnerId || !data) return;
    if (!deletePassword.trim()) {
      setDeleteError("Password is required");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const verifyRes = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.ok) {
        setDeleteError(verifyData.error || "Invalid password");
        return;
      }
      if (deleteModal.type === "partner") {
        const url = deleteModal.permanent
          ? `/api/partners/${partnerId}?permanent=true`
          : `/api/partners/${partnerId}`;
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete partner");
        setDeleteModal(null);
        setDeletePassword("");
        router.push("/dashboard/partners");
        return;
      }
      if (deleteModal.type === "lead") {
        const res = await fetch(`/api/leads/${deleteModal.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete lead");
      } else {
        const res = await fetch(`/api/partners/${partnerId}/payouts/${deleteModal.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete payout");
      }
      const refetch = await fetch(`/api/partners/${partnerId}`);
      if (refetch.ok) {
        const fresh = await refetch.json();
        setData(fresh);
      }
      setDeleteModal(null);
      setDeletePassword("");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteModal(type: "lead" | "payout" | "partner", id: string, label: string, permanent?: boolean) {
    setDeleteModal({ type, id, label, permanent });
    setDeletePassword("");
    setDeleteError(null);
  }

  async function handleStatusChange(newStatus: string) {
    if (!partnerId || !data) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData({ ...data, partner: { ...data.partner, status: newStatus } });
      }
    } catch {
      // ignore
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-muted/60" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-muted/40" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="space-y-8">
        <Link
          href="/dashboard/partners"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Partners
        </Link>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <h2 className="text-base font-semibold text-foreground">Partner not found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            This partner may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const { partner, stats, referredLeads, payouts } = data;
  const statusOptions = ["active", "paused", "suspended"] as const;

  const statCards = [
    {
      label: "Referred leads",
      value: stats.referredLeadsCount,
      sub: "attributed",
      icon: UserCheck,
      className: "text-foreground",
    },
    {
      label: "Commission earned",
      value: formatCurrency(stats.totalCommissionEarned),
      icon: BarChart3,
      className: "text-foreground",
    },
    {
      label: "Pending",
      value: formatCurrency(stats.pendingCommission),
      sub: "unpaid",
      icon: Hourglass,
      className: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Paid out",
      value: formatCurrency(stats.totalPaidOut),
      icon: Banknote,
      className: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-6">
        <Link
          href="/dashboard/partners"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Partners
        </Link>
        {partner.deletedAt && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              This partner was deleted on {formatDate(partner.deletedAt)}. Viewing read-only for records.
            </div>
            <button
              type="button"
              onClick={() => openDeleteModal("partner", partner.id, partner.name, true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
            >
              <Trash2 className="mr-1.5 inline h-4 w-4" strokeWidth={1.5} />
              Permanently delete
            </button>
          </div>
        )}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/60">
              <span className="text-xl font-semibold text-foreground/80">
                {partner.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {partner.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-muted/60 px-2.5 py-1 font-mono text-sm text-muted-foreground">
                  {partner.code}
                </code>
                <button
                  type="button"
                  onClick={() => copyPartnerLink(partner.code)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {copiedCode ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
          {!partner.deletedAt && (
          <div className="flex flex-wrap items-center gap-2">
            {updatingStatus && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                openDeleteModal("partner", partner.id, partner.name);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
              aria-label={`Delete ${partner.name}`}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
              {statusOptions.map((s) => {
                const isSelected = partner.status === s;
                const cfg = statusConfig[s] ?? statusConfig.paused;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    disabled={updatingStatus || partner.status === s}
                    aria-pressed={partner.status === s}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                      isSelected
                        ? cfg.className
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 transition-all duration-300 ease-out hover:border-border hover:bg-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80">
                  {stat.label}
                </p>
                <p className={`mt-2 text-xl font-semibold tabular-nums tracking-tight ${stat.className}`}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                )}
              </div>
              <stat.icon
                className={`h-5 w-5 opacity-40 ${stat.className}`}
                strokeWidth={1.5}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Profile */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          {/* Info fields */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/80">
              Profile
            </h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="group">
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Email
                </dt>
                <dd className="mt-2">
                  <a
                    href={`mailto:${partner.email}`}
                    className="text-sm font-medium text-foreground transition-colors hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    {partner.email}
                  </a>
                </dd>
              </div>
              <div className="group">
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  <Percent className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Commission
                </dt>
                <dd className="mt-2 text-sm font-medium text-foreground">
                  {partner.commissionOneTimePct}% one-time · {partner.commissionRecurringPct}% recurring
                </dd>
              </div>
              <div className="group sm:col-span-2">
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Member since
                </dt>
                <dd className="mt-2 text-sm font-medium text-foreground">
                  {formatDate(partner.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
          {/* Notes sidebar */}
          <div className="border-t border-border/60 bg-muted/20 p-6 lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between">
              <label
                htmlFor="partner-notes"
                className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
              >
                Internal notes
              </label>
              {updatingNotes && (
                <span className="text-xs text-muted-foreground">Saving…</span>
              )}
            </div>
            <Textarea
              id="partner-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              disabled={updatingNotes || !!partner.deletedAt}
              placeholder="Add notes about this partner…"
              className="mt-3 min-h-[120px] rounded-xl border-border/60 bg-background/80 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Referred leads & Payouts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="shrink-0 border-b border-border/60 px-6 py-5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Referred leads
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Leads attributed via this partner&apos;s referral link
            </p>
          </div>
          <div className="scrollbar-thin min-h-[280px] max-h-[360px] overflow-y-auto">
          {referredLeads.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center p-12">
              <EmptyState
                icon={UserCheck}
                heading="No referred leads yet"
                description="Leads will appear when someone submits the contact form after visiting via this partner's link."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {referredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 px-6 py-4 transition-colors duration-200 hover:bg-muted/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="capitalize text-muted-foreground">
                      {lead.status.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground">
                      {lead.oneTimeAmount != null || lead.recurringAmount != null
                        ? formatCurrency((lead.oneTimeAmount ?? 0) + (lead.recurringAmount ?? 0))
                        : "—"}
                    </span>
                    <span className="font-medium text-foreground">
                      {lead.paidAt ? (
                        formatCurrency(lead.commission)
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">{formatDate(lead.createdAt)}</span>
                    {!partner.deletedAt && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal("lead", lead.id, `${lead.name} (${lead.email})`)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label={`Delete ${lead.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="shrink-0 flex flex-col gap-4 border-b border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Payment history
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {partner.deletedAt ? "Historical payouts (read-only)." : "Record payouts and mark as paid when complete."}
              </p>
            </div>
            {!partner.deletedAt && (
            <Button
              size="sm"
              onClick={() => {
                const willOpen = !showPayoutForm;
                setShowPayoutForm(willOpen);
                if (willOpen && stats.pendingCommission > 0) {
                  setPayoutAmount(stats.pendingCommission.toFixed(2));
                } else if (!willOpen) {
                  setPayoutAmount("");
                  setPayoutNotes("");
                }
              }}
              className="h-9 rounded-xl bg-emerald-600 px-4 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
              Record payout
            </Button>
            )}
          </div>
          {showPayoutForm && !partner.deletedAt && (
            <form
              onSubmit={handleRecordPayout}
              className="border-b border-border/60"
            >
              <div className="bg-gradient-to-b from-muted/30 to-muted/10 px-6 py-6 sm:px-8 sm:py-8">
                <div className="mx-auto max-w-md">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    New payout
                  </p>
                  <div className="mt-6 space-y-6">
                    {/* Amount */}
                    <div>
                      <label
                        htmlFor="payout-amount"
                        className="block text-sm font-medium text-foreground"
                      >
                        Amount
                      </label>
                      {stats.pendingCommission > 0 && (
                        <button
                          type="button"
                          onClick={() => setPayoutAmount(stats.pendingCommission.toFixed(2))}
                          className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 transition-colors duration-200 hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          Use pending {formatCurrency(stats.pendingCommission)}
                        </button>
                      )}
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="payout-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          className="h-12 rounded-xl border-border/60 pl-8 text-lg font-semibold tabular-nums"
                        />
                      </div>
                    </div>
                    {/* Notes */}
                    <div>
                      <label
                        htmlFor="payout-notes"
                        className="block text-sm font-medium text-foreground"
                      >
                        Reference <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input
                        id="payout-notes"
                        value={payoutNotes}
                        onChange={(e) => setPayoutNotes(e.target.value)}
                        placeholder="PayPal ID, bank ref, check #…"
                        className="mt-2 h-11 rounded-xl border-border/60"
                      />
                    </div>
                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={submittingPayout}
                        className="h-11 flex-1 rounded-xl bg-emerald-600 font-medium hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                      >
                        {submittingPayout ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Recording…
                          </>
                        ) : (
                          "Record payout"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowPayoutForm(false);
                          setPayoutAmount("");
                          setPayoutNotes("");
                        }}
                        className="h-11 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
          <div className="scrollbar-thin min-h-[280px] max-h-[360px] overflow-y-auto">
          {payouts.length === 0 && !showPayoutForm ? (
            <div className="flex min-h-[280px] items-center justify-center p-12">
              <EmptyState
                icon={Receipt}
                heading="No payouts yet"
                description="Record payouts when you pay this partner their commission."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col gap-4 px-6 py-5 transition-colors duration-200 hover:bg-muted/5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
                    {/* Amount */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                          {formatCurrency(p.amount)}
                        </p>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                            p.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                        <span>{p.paidAt ? formatDate(p.paidAt) : "Pending"}</span>
                        {p.notes && (
                          <>
                            <span className="hidden text-muted-foreground/50 sm:inline">·</span>
                            <span className="truncate max-w-[180px]">{p.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {!partner.deletedAt && (
                      <>
                    {p.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPayoutPaid(p.id)}
                        disabled={markingPaidPayoutId === p.id}
                        className="h-9 rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                      >
                        {markingPaidPayoutId === p.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Banknote className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {markingPaidPayoutId === p.id ? "Marking…" : "Mark paid"}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        openDeleteModal("payout", p.id, `${formatCurrency(p.amount)} payout`)
                      }
                      className="rounded-lg p-2 text-muted-foreground opacity-60 transition-all duration-200 hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label="Delete payout"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={() => !deleting && setDeleteModal(null)}
          />
          <div
            role="document"
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-2xl animate-in fade-in duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="delete-modal-title" className="text-lg font-semibold tracking-tight text-foreground">
                {deleteModal.type === "partner" && deleteModal.permanent
                  ? "Permanently delete partner"
                  : `Delete ${deleteModal.type === "lead" ? "referred lead" : deleteModal.type === "payout" ? "payout" : "partner"}`}
              </h2>
              <button
                type="button"
                onClick={() => !deleting && setDeleteModal(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {deleteModal.type === "partner" && deleteModal.permanent
                ? `This will permanently remove ${deleteModal.label} from the database. All payouts and records will be deleted. No recovery possible. Enter your dashboard password to confirm.`
                : deleteModal.type === "partner"
                  ? `This will remove ${deleteModal.label} and their payouts. Referred leads will be kept but unlinked. Enter your dashboard password to confirm.`
                  : `This will permanently remove ${deleteModal.label}. Enter your dashboard password to confirm.`}
            </p>
            <div className="mt-6">
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="Enter password"
                disabled={deleting}
                className="mt-2 h-11 rounded-xl"
                autoComplete="current-password"
              />
              {deleteError && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{deleteError}</p>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleting || !deletePassword.trim()}
                className="h-11 flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteModal.type === "partner" && deleteModal.permanent ? "Delete permanently" : "Delete"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => !deleting && setDeleteModal(null)}
                disabled={deleting}
                className="h-11 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
