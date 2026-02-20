"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TREATMENTS: { name: string; volume: number }[] = [
  { name: "Botox", volume: 110000 },
  { name: "Dysport", volume: 22000 },
  { name: "Fillers", volume: 60000 },
  { name: "CoolSculpting", volume: 33000 },
  { name: "Laser Hair Removal", volume: 90000 },
  { name: "Chemical Peels", volume: 27000 },
  { name: "Microneedling", volume: 40000 },
  { name: "IV Therapy", volume: 18000 },
  { name: "PDO Threads", volume: 12000 },
  { name: "Kybella", volume: 14000 },
];

export function TreatmentVisualizer() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Botox"]));
  const [rankingCount, setRankingCount] = useState(1);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      if (next.size === 0) return prev;

      if (rankingCount > next.size) {
        setRankingCount(Math.max(1, next.size));
      }
      return next;
    });
  };

  const selectedTreatments = TREATMENTS.filter((t) => selected.has(t.name)).sort((a, b) => b.volume - a.volume);
  const totalVolume = selectedTreatments.reduce((s, t) => s + t.volume, 0);
  const rankingVolume = selectedTreatments.slice(0, Math.min(rankingCount, selectedTreatments.length)).reduce((s, t) => s + t.volume, 0);
  const missedVolume = totalVolume - rankingVolume;
  const missedPatients = Math.round(missedVolume * 0.02 * 12); // ~2% convert to patients, annualized

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="ranking-count" className="block text-sm font-medium mb-2">How many treatments do you currently rank for?</label>
        <input
          id="ranking-count"
          type="range"
          min={1}
          max={Math.max(1, selected.size)}
          value={rankingCount}
          onChange={(e) => setRankingCount(Number(e.target.value))}
          className="w-full"
        />
        <p className="mt-1 text-sm text-muted-foreground">{rankingCount} treatment(s) ranking</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Select treatments you offer:</p>
        <div className="flex flex-wrap gap-2">
          {TREATMENTS.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => toggle(t.name)}
              aria-pressed={selected.has(t.name)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${selected.has(t.name)
                  ? "bg-orange-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/30 p-6">
          <p className="text-sm font-medium text-muted-foreground">Current state</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            ~{Math.round(rankingVolume / 1000)}K searches/month
          </p>
          <p className="mt-1 text-sm">Only {rankingCount} treatment(s) ranking</p>
        </div>
        <div className="rounded-2xl border-2 border-orange-500/50 bg-orange-50/30 p-6 dark:border-orange-400/40 dark:bg-orange-950/20">
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Potential state</p>
          <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
            ~{Math.round(totalVolume / 1000)}K searches/month
          </p>
          <p className="mt-1 text-sm">All {selected.size} treatments ranking</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-orange-500/50 bg-orange-50/50 p-6 dark:border-orange-400/40 dark:bg-orange-950/20">
        <p className="text-lg font-semibold text-orange-800 dark:text-orange-200">
          Missed opportunity: ~{Math.round(missedVolume / 1000)}K monthly searches
        </p>
        <p className="mt-1 text-muted-foreground">
          Estimated {missedPatients.toLocaleString()}+ potential patients/year not finding you
        </p>
      </div>

      <Button asChild size="lg" className="w-full rounded-2xl bg-orange-600 hover:bg-orange-700">
        <Link href="/tools/treatment-analyzer">Analyze My Treatment Menu</Link>
      </Button>
    </div>
  );
}
