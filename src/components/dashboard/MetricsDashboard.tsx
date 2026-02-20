"use client";

import { useEffect, useState } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

function MetricCard({ label, value, subtext }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

export function MetricsDashboard() {
  const [leads, setLeads] = useState<{ count: number; speedAudit: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/leads?limit=1000");
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        const items = data.leads ?? [];
        const speedAudit = items.filter((l: { source?: string }) => l.source === "speed_audit").length;
        setLeads({ count: items.length, speedAudit });
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeads();
  }, []);

  if (isLoading) {
    return <div className="mt-8 text-muted-foreground">Loading metrics...</div>;
  }

  if (error) {
    return <div className="mt-8 text-red-500">Failed to load metrics.</div>;
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Leads"
        value={leads?.count ?? "—"}
        subtext="From contact, speed audit, tools"
      />
      <MetricCard
        label="Speed Audit Requests"
        value={leads?.speedAudit ?? "—"}
        subtext="Primary lead magnet"
      />
      <MetricCard
        label="Weekly Visitors"
        value="—"
        subtext="Connect GA4 API for live data"
      />
      <MetricCard
        label="Conversion Rate"
        value="—"
        subtext="Visitor → Lead"
      />
    </div>
  );
}
