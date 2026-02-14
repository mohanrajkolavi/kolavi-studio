"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import {
  UsersRound,
  UserPlus,
  CheckCircle,
  ChevronRight,
  CircleDot,
  Hourglass,
  PauseCircle,
  CircleSlash,
  Banknote,
  Trash2,
  X,
  Loader2,
  Archive,
  Mail,
} from "lucide-react";

type Partner = {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  supabaseUserId?: string | null;
  commissionOneTimePct: number;
  commissionRecurringPct: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

type Application = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  audience: string;
  promotionMethod: string;
  message: string | null;
  createdAt: string;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const statusConfig: Record<string, { label: string; icon: typeof CircleDot; className: string }> = {
  active: {
    label: "Active",
    icon: CircleDot,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  pending: {
    label: "Pending",
    icon: Hourglass,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  suspended: {
    label: "Suspended",
    icon: CircleSlash,
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<{
    partners: number;
    active: number;
    paused: number;
    suspended: number;
    totalAmountProcessed: number;
    pendingAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"partners" | "applications" | "deleted">("partners");
  const [deletedPartners, setDeletedPartners] = useState<Partner[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string; permanent?: boolean } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);

  const [newPartner, setNewPartner] = useState({
    code: "",
    name: "",
    email: "",
    status: "active",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partnersRes, appsRes, statsRes, deletedRes] = await Promise.all([
        fetch("/api/partners"),
        fetch("/api/partner/applications"),
        fetch("/api/partners/stats"),
        fetch("/api/partners?deleted=true"),
      ]);
      if (partnersRes.ok) {
        const d = await partnersRes.json();
        setPartners(d.partners ?? []);
      }
      if (appsRes.ok) {
        const d = await appsRes.json();
        setApplications(d.applications ?? []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }
      if (deletedRes.ok) {
        const d = await deletedRes.json();
        setDeletedPartners(d.partners ?? []);
      }
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!addModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddModalOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [addModalOpen]);

  async function handleCreatePartner(e: React.FormEvent) {
    e.preventDefault();
    setUpdating("create");
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPartner),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      setNewPartner({ code: "", name: "", email: "", status: "active" });
      setAddModalOpen(false);
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create partner");
    } finally {
      setUpdating(null);
    }
  }

  async function handleStatusChange(partnerId: string, newStatus: string, e: React.MouseEvent) {
    e.stopPropagation();
    setUpdating(partnerId);
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchData();
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setUpdating(null);
    }
  }

  async function handleSendInvite(partnerId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setInviting(partnerId);
    try {
      const res = await fetch("/api/partner/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      alert("Invitation email sent. Partner will receive a link to set their password.");
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setInviting(null);
    }
  }

  async function handleApproveApplication(app: Application, sendInvite = false) {
    const code = prompt(
      "Enter partner code (6–50 alphanumeric):",
      app.name.replace(/\s/g, "").slice(0, 8).toUpperCase() + "01"
    );
    if (!code || code.trim().length < 6) return;
    setUpdating(app.id);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: app.name,
          email: app.email,
          phone: app.phone ?? undefined,
          status: "active",
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || "Failed to create partner");
      const createdId = created.id;
      const patchRes = await fetch(`/api/partner/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!patchRes.ok) {
        if (createdId) {
          try {
            await fetch(`/api/partners/${createdId}`, { method: "DELETE" });
          } catch {
            console.error("Rollback: failed to delete orphaned partner", createdId);
          }
        }
        throw new Error("Failed to approve application. Changes were rolled back.");
      }
      if (sendInvite) {
        if (!createdId) {
          console.warn("Partner approved but no ID returned; invite not sent");
          alert("Partner approved but no ID returned; invite not sent.");
        } else {
          const inviteRes = await fetch("/api/partner/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partnerId: createdId }),
          });
          if (inviteRes.ok) {
            alert("Partner approved and invitation email sent.");
          } else {
            const inviteData = await inviteRes.json();
            alert(`Partner approved. Invite failed: ${inviteData.error || "Unknown error"}`);
          }
        }
      }
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setUpdating(null);
    }
  }

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

  async function handleDeletePartner() {
    if (!deleteModal) return;
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
      const url = deleteModal.permanent
        ? `/api/partners/${deleteModal.id}?permanent=true`
        : `/api/partners/${deleteModal.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete partner");
      setDeleteModal(null);
      setDeletePassword("");
      await fetchData();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const statCards = [
    {
      label: "Partners",
      value: stats?.partners ?? partners.length,
      icon: UsersRound,
      className: "text-foreground",
    },
    {
      label: "Active",
      value: stats?.active ?? 0,
      icon: CircleDot,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Paused",
      value: stats?.paused ?? 0,
      icon: PauseCircle,
      className: "text-slate-600 dark:text-slate-400",
    },
    {
      label: "Suspended",
      value: stats?.suspended ?? 0,
      icon: CircleSlash,
      className: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Processed",
      value: formatCurrency(stats?.totalAmountProcessed ?? 0),
      icon: Banknote,
      className: "text-foreground",
    },
    {
      label: "Pending",
      value: formatCurrency(stats?.pendingAmount ?? 0),
      icon: Hourglass,
      className: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-10 pb-4">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Partner Program
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          15% one-time, 10% recurring. Approve applications and manage your partner network.
        </p>
      </header>

      {/* Stats grid */}
      <section
        aria-label="Overview"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 transition-all duration-300 ease-out hover:border-border hover:bg-card hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80">
                  {stat.label}
                </p>
                <p
                  className={`mt-2 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${stat.className}`}
                >
                  {stat.value}
                </p>
              </div>
              <stat.icon
                className={`h-5 w-5 opacity-40 transition-opacity group-hover:opacity-60 sm:h-6 sm:w-6 ${stat.className}`}
                strokeWidth={1.5}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Main content card */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {/* Tabs + Add button */}
        <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Sections"
            className="flex gap-1 rounded-xl bg-muted/40 p-1 w-fit"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "partners"}
              aria-controls="partners-panel"
              tabIndex={activeTab === "partners" ? 0 : -1}
              onClick={() => setActiveTab("partners")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                activeTab === "partners"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Partners
              <span
                className={`ml-2 tabular-nums ${
                  activeTab === "partners" ? "text-muted-foreground" : "text-muted-foreground/70"
                }`}
              >
                {partners.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "applications"}
              aria-controls="applications-panel"
              tabIndex={activeTab === "applications" ? 0 : -1}
              onClick={() => setActiveTab("applications")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                activeTab === "applications"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Applications
              <span
                className={`ml-2 tabular-nums ${
                  activeTab === "applications" ? "text-muted-foreground" : "text-muted-foreground/70"
                }`}
              >
                {applications.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "deleted"}
              aria-controls="deleted-panel"
              tabIndex={activeTab === "deleted" ? 0 : -1}
              onClick={() => setActiveTab("deleted")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                activeTab === "deleted"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Deleted
              <span
                className={`ml-2 tabular-nums ${
                  activeTab === "deleted" ? "text-muted-foreground" : "text-muted-foreground/70"
                }`}
              >
                {deletedPartners.length}
              </span>
            </button>
          </div>
          {activeTab !== "deleted" && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
          >
            <UserPlus className="mr-2 h-4 w-4" strokeWidth={2} />
            Add partner
          </Button>
          )}
        </div>

        {/* Partners tab */}
        {activeTab === "partners" && (
          <div id="partners-panel" role="tabpanel" tabIndex={activeTab === "partners" ? 0 : -1} className="min-h-[320px]">
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : partners.length === 0 ? (
              <div className="p-16">
                <EmptyState
                  icon={UsersRound}
                  heading="No partners yet"
                  description="Add a partner manually or approve an application from the Applications tab."
                  action={
                    <Button
                      onClick={() => setAddModalOpen(true)}
                      className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add partner
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {partners.map((p) => {
                  const config = statusConfig[p.status] ?? statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/dashboard/partners/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/dashboard/partners/${p.id}`);
                        }
                      }}
                      className="flex cursor-pointer flex-col gap-4 px-6 py-5 transition-colors duration-200 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                          <span className="text-sm font-semibold text-foreground/80">
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{p.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                        </div>
                        <div className="hidden shrink-0 sm:block">
                          <code className="rounded-lg bg-muted/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                            {p.code}
                          </code>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${config.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {p.status === "active" && !p.supabaseUserId && (
                          <button
                            type="button"
                            onClick={(e) => handleSendInvite(p.id, e)}
                            disabled={inviting === p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/10"
                            title="Send invitation email to set up account"
                          >
                            {inviting === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                            Send invite
                          </button>
                        )}
                        {p.status !== "active" && (
                          <button
                            type="button"
                            onClick={(e) => handleStatusChange(p.id, "active", e)}
                            disabled={updating === p.id}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({ id: p.id, name: p.name });
                            setDeletePassword("");
                            setDeleteError(null);
                          }}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Applications tab */}
        {activeTab === "applications" && (
          <div id="applications-panel" role="tabpanel" tabIndex={activeTab === "applications" ? 0 : -1}>
          <div className="min-h-[320px]">
            {loading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : applications.length === 0 ? (
              <div className="p-16">
                <EmptyState
                  icon={UsersRound}
                  heading="No pending applications"
                  description="Applications will appear here when someone submits the form at /partner/apply."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-6 py-4 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Applicant
                      </th>
                      <th className="hidden px-6 py-4 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground md:table-cell">
                        Audience
                      </th>
                      <th className="hidden px-6 py-4 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground lg:table-cell">
                        Promotion
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-border/40 transition-colors duration-200 last:border-0 hover:bg-muted/10"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">{app.name}</p>
                            <p className="text-sm text-muted-foreground">{app.email}</p>
                            {app.phone && (
                              <p className="text-xs text-muted-foreground/80">{app.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 text-sm capitalize text-muted-foreground md:table-cell">
                          {app.audience?.replace(/-/g, " ")}
                        </td>
                        <td className="hidden px-6 py-4 text-sm capitalize text-muted-foreground lg:table-cell">
                          {app.promotionMethod?.replace(/-/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveApplication(app, false)}
                              disabled={updating === app.id}
                              variant="outline"
                              className="h-9 rounded-xl px-4 text-sm font-medium"
                            >
                              {updating === app.id ? "..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveApplication(app, true)}
                              disabled={updating === app.id}
                              className="h-9 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
                              {updating === app.id ? "..." : "Approve & send invite"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Deleted tab */}
        {activeTab === "deleted" && (
          <div id="deleted-panel" role="tabpanel" tabIndex={activeTab === "deleted" ? 0 : -1} className="min-h-[320px]">
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : deletedPartners.length === 0 ? (
              <div className="p-16">
                <EmptyState
                  icon={Archive}
                  heading="No deleted partners"
                  description="Deleted partners appear here for at least 3 months for record-keeping."
                />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {deletedPartners.map((p) => {
                  const config = statusConfig[p.status] ?? statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/dashboard/partners/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/dashboard/partners/${p.id}`);
                        }
                      }}
                      className="flex cursor-pointer flex-col gap-4 px-6 py-5 transition-colors duration-200 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 opacity-75">
                          <span className="text-sm font-semibold text-foreground/80">
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{p.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                        </div>
                        <div className="hidden shrink-0 sm:block">
                          <code className="rounded-lg bg-muted/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                            {p.code}
                          </code>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${config.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                          {config.label}
                        </span>
                        {p.deletedAt && (
                          <span className="text-xs text-muted-foreground">
                            Deleted {formatDate(p.deletedAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({ id: p.id, name: p.name, permanent: true });
                            setDeletePassword("");
                            setDeleteError(null);
                          }}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                          aria-label={`Permanently delete ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add partner modal */}
      {addModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-partner-dialog-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              aria-label="Close dialog"
              onClick={() => setAddModalOpen(false)}
            />
            <div
              role="document"
              className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-2xl animate-in fade-in duration-200"
            >
              <h2
                id="add-partner-dialog-title"
                className="text-xl font-semibold tracking-tight text-foreground"
              >
                Add partner
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a new partner with a unique referral code.
              </p>
              <form onSubmit={handleCreatePartner} className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="partner-code"
                    className="block text-sm font-medium text-foreground"
                  >
                    Partner code
                  </label>
                  <Input
                    id="partner-code"
                    value={newPartner.code}
                    onChange={(e) => setNewPartner((p) => ({ ...p, code: e.target.value }))}
                    placeholder="JOHN2025"
                    required
                    minLength={6}
                    maxLength={50}
                    className="mt-2 h-11 rounded-xl border-border/60"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    6–50 alphanumeric, unique
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="partner-name"
                    className="block text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="partner-name"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Partner name"
                    required
                    className="mt-2 h-11 rounded-xl border-border/60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="partner-email"
                    className="block text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="partner-email"
                    type="email"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner((p) => ({ ...p, email: e.target.value }))}
                    placeholder="partner@example.com"
                    required
                    className="mt-2 h-11 rounded-xl border-border/60"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={updating === "create"}
                    className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {updating === "create" ? "Creating..." : "Create partner"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddModalOpen(false)}
                    className="h-11 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete partner modal */}
      {deleteModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-partner-modal-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
                <h2 id="delete-partner-modal-title" className="text-lg font-semibold tracking-tight text-foreground">
                  {deleteModal.permanent ? "Permanently delete partner" : "Delete partner"}
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
                {deleteModal.permanent
                  ? `This will permanently remove ${deleteModal.name} from the database. All payouts and records will be deleted. No recovery possible. Enter your dashboard password to confirm.`
                  : `This will remove ${deleteModal.name} and their payouts. Referred leads will be kept but unlinked. Enter your dashboard password to confirm.`}
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
                  onClick={handleDeletePartner}
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
                      {deleteModal.permanent ? "Delete permanently" : "Delete"}
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
          </div>,
          document.body
        )}
    </div>
  );
}
