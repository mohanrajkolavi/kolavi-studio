"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
} from "lucide-react";

type IndexingAction = "URL_UPDATED" | "URL_DELETED";

type Result = {
  url: string;
  action: IndexingAction;
  success: boolean;
  error?: string;
  notifyTime?: string;
};

export default function IndexingPage() {
  const [urls, setUrls] = useState<string[]>([""]);
  const [action, setAction] = useState<IndexingAction>("URL_UPDATED");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  // Status check
  const [statusUrl, setStatusUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<Result | null>(null);

  function addUrlField() {
    setUrls((prev) => [...prev, ""]);
  }

  function removeUrlField(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function updateUrl(index: number, value: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validUrls = urls.map((u) => u.trim()).filter(Boolean);
    if (validUrls.length === 0) return;

    setSubmitting(true);
    setResults([]);

    try {
      const body =
        validUrls.length === 1
          ? { url: validUrls[0], action }
          : { urls: validUrls, action };

      const res = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.results) {
        setResults(data.results);
      } else {
        setResults([data]);
      }
    } catch (err) {
      setResults([
        {
          url: validUrls[0],
          action,
          success: false,
          error: err instanceof Error ? err.message : "Request failed",
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusCheck(e: React.FormEvent) {
    e.preventDefault();
    const url = statusUrl.trim();
    if (!url) return;

    setChecking(true);
    setStatusResult(null);

    try {
      const res = await fetch(
        `/api/indexing?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();
      setStatusResult({
        url,
        action: "URL_UPDATED",
        success: data.success,
        error: data.error,
        notifyTime: data.latestUpdate?.notifyTime,
      });
    } catch (err) {
      setStatusResult({
        url,
        action: "URL_UPDATED",
        success: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Google Instant Indexing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit URLs to Google for instant crawling and indexing, or check
          indexing status.
        </p>
      </div>

      {/* ---- Submit URLs ---- */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Submit URLs</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAction("URL_UPDATED")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                action === "URL_UPDATED"
                  ? "bg-orange-600 text-white dark:bg-orange-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Update / Add
            </button>
            <button
              type="button"
              onClick={() => setAction("URL_DELETED")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                action === "URL_DELETED"
                  ? "bg-red-600 text-white dark:bg-red-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>

          {/* URL inputs */}
          <div className="space-y-2">
            {urls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/page"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  required={i === 0}
                  className="flex-1"
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrlField(i)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove URL"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addUrlField}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add URL
            </button>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Indexing
              </>
            )}
          </Button>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Results
            </h3>
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  r.success
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                }`}
              >
                {r.success ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="break-all font-medium">{r.url}</p>
                  {r.success ? (
                    <p className="text-emerald-700 dark:text-emerald-300">
                      Successfully submitted ({r.action === "URL_DELETED" ? "removal" : "update"} request)
                    </p>
                  ) : (
                    <p className="text-red-700 dark:text-red-300">{r.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Check Status ---- */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Check Indexing Status</h2>
        <form onSubmit={handleStatusCheck} className="flex gap-3">
          <Input
            type="url"
            placeholder="https://example.com/page"
            value={statusUrl}
            onChange={(e) => setStatusUrl(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Check
              </>
            )}
          </Button>
        </form>

        {statusResult && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              statusResult.success
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }`}
          >
            {statusResult.success ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-medium">{statusResult.url}</p>
                  {statusResult.notifyTime ? (
                    <p className="text-emerald-700 dark:text-emerald-300">
                      Last notified:{" "}
                      {new Date(statusResult.notifyTime).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      No indexing notifications found for this URL.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium">{statusResult.url}</p>
                  <p className="text-red-700 dark:text-red-300">
                    {statusResult.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---- Setup info ---- */}
      <section className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        <h3 className="mb-2 font-semibold text-foreground">Setup Requirements</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Enable the <strong>Indexing API</strong> in your Google Cloud project.
          </li>
          <li>
            Create a <strong>service account</strong> and download the JSON key.
          </li>
          <li>
            Set <code className="rounded bg-muted px-1.5 py-0.5">GOOGLE_SERVICE_ACCOUNT_JSON</code>{" "}
            env variable to the full JSON content.
          </li>
          <li>
            Add the service account email as an <strong>owner</strong> in Google
            Search Console for each property.
          </li>
          <li>
            URLs are automatically submitted when articles are published with a URL.
          </li>
        </ul>
      </section>
    </div>
  );
}
