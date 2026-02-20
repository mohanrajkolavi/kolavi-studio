"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CompetitorComparisonTool() {
  const [yourUrl, setYourUrl] = useState("");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const updateCompetitor = (i: number, v: string) => {
    setCompetitors((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!yourUrl.trim() || !email.trim() || submitted || isLoading) return;

    setIsLoading(true);
    setSubmissionError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Competitor Comparison Request",
          email: email.trim(),
          message: `Competitor comparison requested.\nYour site: ${yourUrl.trim()}\nCompetitors: ${competitors.filter(Boolean).join(", ")}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmissionError((data as { error?: string }).error || `Request failed (${res.status})`);
      }
    } catch {
      setSubmissionError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-green-50/50 p-6 dark:bg-green-950/20">
        <p className="font-semibold text-green-800 dark:text-green-200">
          Request received! We&apos;ll analyze your site and competitors, then send the comparison matrix within 48 hours.
        </p>
        <Button asChild className="mt-4">
          <Link href="/tools/speed-audit">Get Your Speed Audit While You Wait</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="yourUrl" className="block text-sm font-medium">Your website URL</label>
        <Input
          id="yourUrl"
          type="url"
          placeholder="https://yourmedspa.com"
          value={yourUrl}
          onChange={(e) => setYourUrl(e.target.value)}
          required
          className="mt-2"
        />
      </div>
      <div>
        <span className="block text-sm font-medium mb-2" id="competitors-label">Top 3 competitor URLs</span>
        <div role="group" aria-labelledby="competitors-label">
          {competitors.map((c, i) => (
            <Input
              key={i}
              type="url"
              placeholder={`Competitor ${i + 1} URL`}
              value={c}
              onChange={(e) => updateCompetitor(i, e.target.value)}
              className="mt-2"
            />
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email for report</label>
        <Input
          id="email"
          type="email"
          placeholder="you@yourmedspa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        We&apos;ll check PageSpeed scores, treatment page count, blog frequency, and GEO optimization. Connect PageSpeed API later for instant results.
      </p>
      {submissionError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {submissionError}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full rounded-2xl bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
        {isLoading ? "Sending..." : "Get My Comparison"}
      </Button>
    </form>
  );
}
