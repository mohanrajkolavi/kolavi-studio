"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { Users, Search, Mail, Phone, Briefcase, X } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessType: string | null;
  message: string;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type LeadStatus = "new" | "contacted" | "proposal_sent" | "won" | "lost";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "proposal_sent", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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

const statusStyles: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  contacted: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  proposal_sent: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200",
  won: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  lost: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    search: "",
  });
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.source) params.append("source", filters.source);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch leads");
      const data = await response.json();
      setLeads(data.leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.source, filters.search]);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on status/source change; search runs on submit
  }, [filters.status, filters.source]);

  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    setUpdating(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await fetchLeads();
      if (selectedLead?.id === leadId) {
        const updated = await fetch(`/api/leads/${leadId}`).then((r) => r.json());
        setSelectedLead(updated);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(null);
    }
  }

  async function handleNotesUpdate(leadId: string, notes: string) {
    setUpdating(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error("Failed to update notes");
      await fetchLeads();
      if (selectedLead?.id === leadId) {
        const updated = await fetch(`/api/leads/${leadId}`).then((r) => r.json());
        setSelectedLead(updated);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    } finally {
      setUpdating(null);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchLeads();
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage contact form submissions and track pipeline
        </p>
      </header>

      <section className="rounded-lg border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <nav
                aria-label="Filter by status"
                className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0"
              >
                {[
                  { value: "", label: "All" },
                  ...STATUS_OPTIONS,
                ].map((opt) => (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, status: opt.value }))}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.status === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </nav>
              <form onSubmit={handleSearch} className="flex shrink-0 items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="leads-search"
                  placeholder="Search name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border/60 bg-muted/40 pl-11 focus-visible:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:focus-visible:bg-white/[0.08] sm:w-48"
                />
              </div>
              <select
                id="leads-source"
                value={filters.source}
                onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
                className="h-11 rounded-xl border border-border/60 bg-muted/40 px-4 text-sm focus:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/[0.08]"
              >
                <option value="">All sources</option>
                <option value="contact_form">Contact Form</option>
                <option value="typeform">Typeform</option>
                <option value="tally">Tally</option>
                <option value="google_form">Google Form</option>
              </select>
              <Button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              >
                Search
              </Button>
            </form>
            </div>
          </div>
      </section>

      {/* Leads list */}
      <section>
        <h2 className="sr-only">Leads list</h2>
        {loading ? (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : leads.length === 0 ? (
          <div className="overflow-hidden rounded-lg border border-dashed border-border/60 bg-muted/20">
            <EmptyState
              icon={Users}
              heading="No leads found"
              description="Leads will appear here when someone submits the contact form. Try adjusting your filters."
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-medium text-muted-foreground md:table-cell">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">
                      Received
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      className={`group border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30 cursor-pointer ${
                        lead.status === "new" ? "bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedLead(lead)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedLead(lead);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                          {lead.email}
                        </p>
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-muted-foreground md:table-cell">
                        {lead.source.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            statusStyles[lead.status] || "bg-muted text-muted-foreground"
                          }`}
                        >
                          {lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatRelativeDate(lead.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          disabled={updating === lead.id}
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 rounded-xl border border-border/60 bg-muted/40 px-3 text-xs focus:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/[0.08]"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
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

      {/* Lead detail modal */}
      {selectedLead && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Modal backdrop: click to close
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-modal-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLead(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedLead(null);
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Modal content: stop propagation except Escape so overlay can close */}
          <div
            role="document"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-border/60 bg-card"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelectedLead(null);
              else e.stopPropagation();
            }}
          >
            <div className="sticky top-0 z-10 flex flex-row items-start justify-between gap-4 border-b border-border/60 bg-card p-5">
              <div className="min-w-0 flex-1">
                <h2 id="lead-modal-title" className="text-base font-semibold text-foreground">
                  {selectedLead.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">
                  {selectedLead.email}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                      statusStyles[selectedLead.status] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selectedLead.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedLead.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLead(null)}
                className="shrink-0 rounded-full hover:bg-muted/50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-6 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedLead.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {selectedLead.phone}
                      </p>
                    </div>
                  </div>
                )}
                {selectedLead.businessType && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Business</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {selectedLead.businessType}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 sm:col-span-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Source</p>
                    <p className="mt-0.5 text-sm text-muted-foreground capitalize">
                      {selectedLead.source.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">Message</p>
                <p className="mt-2 rounded-xl bg-muted/40 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed dark:bg-white/5">
                  {selectedLead.message}
                </p>
              </div>

              <div>
                <label htmlFor="lead-status" className="block text-sm font-medium text-foreground">
                  Update status
                </label>
                <select
                  id="lead-status"
                  value={selectedLead.status}
                  onChange={(e) =>
                    handleStatusChange(selectedLead.id, e.target.value as LeadStatus)
                  }
                  disabled={updating === selectedLead.id}
                  className="mt-2 flex h-11 w-full max-w-xs rounded-xl border border-border/60 bg-muted/40 px-4 text-sm focus:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/[0.08]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lead-notes" className="block text-sm font-medium text-foreground">
                  Internal notes
                </label>
                <Textarea
                  id="lead-notes"
                  value={selectedLead.notes || ""}
                  onChange={(e) => {
                    setSelectedLead({ ...selectedLead, notes: e.target.value });
                  }}
                  onBlur={() => {
                    handleNotesUpdate(selectedLead.id, selectedLead.notes ?? "");
                  }}
                  className="mt-2 min-h-[100px] rounded-xl border border-border/60 bg-muted/40 focus-visible:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:focus-visible:bg-white/[0.08]"
                  rows={3}
                  placeholder="Add notes for your team..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
