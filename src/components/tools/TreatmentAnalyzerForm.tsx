"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TreatmentAnalyzerForm() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Treatment Analyzer Request",
          email,
          message: `Treatment coverage analysis requested for: ${url.trim()}\n\nWe'll analyze their treatment pages and send the report.`,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit");
        } else {
          throw new Error("Failed to submit");
        }
      }

      // Response body not used for success case


      setStatus({
        type: "success",
        message: "Request received! We'll analyze your treatment coverage and send the report within 48 hours.",
      });
      setUrl("");
      setEmail("");
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="url" className="block text-sm font-medium">
          Your med spa website URL
        </label>
        <Input
          id="url"
          type="url"
          placeholder="https://yourmedspa.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={isSubmitting}
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email to receive the report
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@yourmedspa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
          className="mt-2"
        />
      </div>
      {status && (
        <div
          role="alert"
          aria-live={status.type === "error" ? "assertive" : "polite"}
          className={`rounded-lg p-4 text-sm ${status.type === "success"
            ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
        >
          {status.message}
        </div>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full rounded-2xl bg-orange-600 font-semibold hover:bg-orange-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Analyze My Treatment Menu"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No credit card required. Report delivered in 48 hours.
      </p>
    </form>
  );
}
