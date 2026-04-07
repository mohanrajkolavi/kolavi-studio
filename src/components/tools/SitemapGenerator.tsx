"use client";

import { useState, useCallback, useId } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Loader2,
  Check,
  Copy,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileCode,
  List,
  Sparkles,
  Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SitemapUrlEntry {
  loc: string;
  depth: number;
  lastmod?: string;
  priority: string;
  changefreq?: string;
}

interface SitemapStats {
  totalUrls: number;
  crawlDepth: number;
  crawlTimeMs: number;
  robotsTxtFound: boolean;
}

interface SitemapResult {
  xml: string;
  urls: SitemapUrlEntry[];
  stats: SitemapStats;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const MAX_PAGES_OPTIONS = [
  { value: "10", label: "10 URLs" },
  { value: "25", label: "25 URLs" },
  { value: "50", label: "50 URLs" },
  { value: "100", label: "100 URLs" },
  { value: "250", label: "250 URLs" },
  { value: "500", label: "500 URLs" },
];

const CRAWL_DEPTH_OPTIONS = [
  { value: "1", label: "1 level" },
  { value: "2", label: "2 levels" },
  { value: "3", label: "3 levels" },
  { value: "4", label: "4 levels" },
  { value: "5", label: "5 levels" },
];

const CHANGE_FREQ_OPTIONS = [
  { value: "none", label: "Don't include" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const LASTMOD_OPTIONS = [
  { value: "none", label: "Don't include" },
  { value: "today", label: "Today's date" },
  { value: "crawl", label: "From server headers" },
];

const PRIORITY_OPTIONS = [
  { value: "auto", label: "Auto (by depth)" },
  { value: "custom", label: "Custom" },
  { value: "none", label: "Don't include" },
];

const selectClasses =
  "flex h-11 sm:h-12 w-full rounded-xl border border-input bg-background px-3 sm:px-4 text-[14px] sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SitemapGenerator() {
  const formId = useId();

  // Form state
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState("100");
  const [crawlDepth, setCrawlDepth] = useState("2");
  const [changeFreq, setChangeFreq] = useState("none");
  const [lastmodMode, setLastmodMode] = useState("today");
  const [priorityMode, setPriorityMode] = useState("auto");
  const [customPriority, setCustomPriority] = useState("0.5");
  const [includePaths, setIncludePaths] = useState("");
  const [excludePaths, setExcludePaths] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Results state
  const [isCrawling, setIsCrawling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SitemapResult | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "xml">("preview");

  const handleCopyXml = useCallback(async () => {
    if (!results) return;
    await navigator.clipboard.writeText(results.xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
    trackEvent("sitemap_generator_copy");
  }, [results]);

  const handleDownload = useCallback(() => {
    if (!results) return;
    const blob = new Blob([results.xml], { type: "application/xml" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(blobUrl);
    trackEvent("sitemap_generator_download");
  }, [results]);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setIsCrawling(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/sitemap-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmedUrl,
          maxPages: Number(maxPages),
          crawlDepth: Number(crawlDepth),
          changeFreq: changeFreq === "none" ? undefined : changeFreq,
          lastmodMode,
          priorityMode,
          customPriority: priorityMode === "custom" ? Number(customPriority) : undefined,
          includePaths: includePaths.trim() || undefined,
          excludePaths: excludePaths.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate sitemap.");

      setResults({ xml: data.xml, urls: data.urls, stats: data.stats });

      trackEvent("sitemap_generator_submit", {
        domain: new URL(trimmedUrl).hostname,
        maxPages,
        urlsFound: String(data.stats.totalUrls),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setActiveTab("preview");
  };

  /* ------------------------------------------------------------------ */
  /*  Results View                                                       */
  /* ------------------------------------------------------------------ */

  if (results) {
    const { stats, urls } = results;
    const timeSeconds = (stats.crawlTimeMs / 1000).toFixed(1);
    const hasChangefreq = urls.some((u) => u.changefreq);
    const hasPriority = urls.some((u) => u.priority);

    return (
      <div className="w-full animate-reveal" role="region" aria-label="Sitemap generation results">
        {/* Success header */}
        <div className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 text-green-500 mb-5 border border-green-500/20">
            <Check className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />
          </div>
          <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-foreground mb-2">
            Your Sitemap Is Ready
          </h2>
          <p className="text-[14px] sm:text-[16px] text-muted-foreground max-w-md mx-auto">
            Found <span className="font-semibold text-foreground">{stats.totalUrls} URLs</span> in {timeSeconds}s
            {stats.robotsTxtFound && " - robots.txt respected"}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 mb-4 p-1 bg-muted rounded-xl w-fit mx-auto" role="tablist" aria-label="Sitemap view">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "preview"}
            aria-controls={`${formId}-preview`}
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "xml"}
            aria-controls={`${formId}-xml`}
            onClick={() => setActiveTab("xml")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === "xml"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" aria-hidden="true" />
            XML
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "preview" ? (
          <div id={`${formId}-preview`} role="tabpanel" className="rounded-2xl border border-border bg-background overflow-hidden">
            {/* Table header */}
            <div className={`grid ${hasChangefreq && hasPriority ? "grid-cols-[1fr_auto_auto_auto]" : hasChangefreq || hasPriority ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]"} gap-2 sm:gap-4 px-4 py-3 bg-muted/50 border-b border-border text-[11px] sm:text-xs font-semibold text-muted-foreground`}>
              <span>URL</span>
              <span className="text-center w-12 sm:w-16">Depth</span>
              {hasPriority && <span className="text-center w-14 sm:w-16 hidden sm:block">Priority</span>}
              {hasChangefreq && <span className="text-center w-16 hidden sm:block">Frequency</span>}
            </div>
            {/* URL rows */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50 overscroll-contain">
              {urls.map((entry, i) => (
                <div
                  key={entry.loc}
                  className={`grid ${hasChangefreq && hasPriority ? "grid-cols-[1fr_auto_auto_auto]" : hasChangefreq || hasPriority ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]"} gap-2 sm:gap-4 px-4 py-2.5 text-[12px] sm:text-sm ${
                    i % 2 === 0 ? "" : "bg-muted/20"
                  }`}
                >
                  <span className="text-foreground truncate font-mono text-[11px] sm:text-xs min-w-0">
                    {entry.loc.replace(/^https?:\/\//, "")}
                  </span>
                  <span className="text-center w-12 sm:w-16">
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.depth === 0
                        ? "bg-primary/10 text-primary"
                        : entry.depth <= 2
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {entry.depth}
                    </span>
                  </span>
                  {hasPriority && (
                    <span className="text-center w-14 sm:w-16 text-muted-foreground tabular-nums hidden sm:block">
                      {entry.priority}
                    </span>
                  )}
                  {hasChangefreq && (
                    <span className="text-center w-16 text-muted-foreground hidden sm:block">
                      {entry.changefreq || "-"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div id={`${formId}-xml`} role="tabpanel" className="rounded-2xl border border-border bg-background overflow-hidden">
            <pre className="max-h-[400px] overflow-auto p-4 text-[11px] sm:text-xs leading-relaxed font-mono text-foreground/90 whitespace-pre overscroll-contain">
              {results.xml}
            </pre>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <Button
            onClick={handleCopyXml}
            variant="outline"
            size="lg"
            className="rounded-2xl h-12 sm:h-14 text-[14px] sm:text-[16px]"
            aria-label="Copy XML to clipboard"
          >
            {copiedXml ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                Copy XML
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            size="lg"
            className="rounded-2xl h-12 sm:h-14 text-[14px] sm:text-[16px]"
            aria-label="Download sitemap.xml file"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Download sitemap.xml
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="rounded-2xl h-12 sm:h-14 text-[14px] sm:text-[16px]"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            New Sitemap
          </Button>
        </div>

        {/* Stats summary */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5 sm:p-3 text-center">
            <p className="text-[18px] sm:text-[22px] font-bold text-foreground tabular-nums">{stats.totalUrls}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">URLs Found</p>
          </div>
          <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5 sm:p-3 text-center">
            <p className="text-[18px] sm:text-[22px] font-bold text-foreground tabular-nums">{stats.crawlDepth}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Max Depth</p>
          </div>
          <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5 sm:p-3 text-center">
            <p className="text-[18px] sm:text-[22px] font-bold text-foreground tabular-nums">{timeSeconds}s</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Crawl Time</p>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Form View                                                          */
  /* ------------------------------------------------------------------ */

  return (
    <form onSubmit={handleGenerate} className="w-full animate-reveal" aria-label="XML Sitemap Generator">
      <div className="space-y-4 sm:space-y-5">
        {/* Website URL */}
        <div>
          <label htmlFor={`${formId}-url`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
            Website URL <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id={`${formId}-url`}
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              aria-required="true"
              aria-describedby={`${formId}-url-hint`}
              aria-invalid={error ? "true" : undefined}
              className="h-11 sm:h-12 text-[14px] sm:text-sm pl-10"
            />
          </div>
          <p id={`${formId}-url-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
            Enter the full URL including https://
          </p>
        </div>

        {/* Max URLs */}
        <div>
          <label htmlFor={`${formId}-max`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
            Maximum URLs to include
          </label>
          <select
            id={`${formId}-max`}
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
            aria-describedby={`${formId}-max-hint`}
            className={selectClasses}
          >
            {MAX_PAGES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p id={`${formId}-max-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
            XML sitemaps are limited to 50,000 URLs
          </p>
        </div>

        {/* Crawl Depth - visible by default like competitor */}
        <div>
          <label htmlFor={`${formId}-depth`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
            Maximum crawl depth
          </label>
          <select
            id={`${formId}-depth`}
            value={crawlDepth}
            onChange={(e) => setCrawlDepth(e.target.value)}
            aria-describedby={`${formId}-depth-hint`}
            className={selectClasses}
          >
            {CRAWL_DEPTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p id={`${formId}-depth-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
            How many levels deep to crawl from the starting URL
          </p>
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls={`${formId}-advanced`}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors pt-1"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
          {showAdvanced ? "Hide" : "Show"} advanced options
        </button>

        {showAdvanced && (
          <div id={`${formId}-advanced`} className="space-y-4 sm:space-y-5 animate-reveal rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
            {/* Last Modified + Change Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor={`${formId}-lastmod`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                  Last modified date
                </label>
                <select
                  id={`${formId}-lastmod`}
                  value={lastmodMode}
                  onChange={(e) => setLastmodMode(e.target.value)}
                  aria-describedby={`${formId}-lastmod-hint`}
                  className={selectClasses}
                >
                  {LASTMOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p id={`${formId}-lastmod-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  Helps search engines understand when content was last updated
                </p>
              </div>

              <div>
                <label htmlFor={`${formId}-freq`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                  Change frequency
                </label>
                <select
                  id={`${formId}-freq`}
                  value={changeFreq}
                  onChange={(e) => setChangeFreq(e.target.value)}
                  aria-describedby={`${formId}-freq-hint`}
                  className={selectClasses}
                >
                  {CHANGE_FREQ_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p id={`${formId}-freq-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  Hints to search engines about how often pages change
                </p>
              </div>
            </div>

            {/* Priority */}
            <div>
              <span className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                Priority
              </span>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Priority mode">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={priorityMode === opt.value}
                    onClick={() => setPriorityMode(opt.value)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                      priorityMode === opt.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                Relative importance of pages within your site (0.0 to 1.0)
              </p>
              {priorityMode === "custom" && (
                <div className="mt-3">
                  <label htmlFor={`${formId}-priority-val`} className="block text-xs text-muted-foreground mb-1">
                    Custom priority value
                  </label>
                  <Input
                    id={`${formId}-priority-val`}
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value)}
                    className="h-10 sm:h-11 text-[14px] sm:text-sm w-32"
                  />
                </div>
              )}
            </div>

            {/* Include / Exclude Paths */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor={`${formId}-include`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                  Include paths <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  id={`${formId}-include`}
                  placeholder={"/blog/\n/products/\n/docs/"}
                  value={includePaths}
                  onChange={(e) => setIncludePaths(e.target.value)}
                  aria-describedby={`${formId}-include-hint`}
                  rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none font-mono"
                />
                <p id={`${formId}-include-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  One per line. Only include URLs containing these paths.
                </p>
              </div>
              <div>
                <label htmlFor={`${formId}-exclude`} className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                  Exclude paths <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  id={`${formId}-exclude`}
                  placeholder={"/admin/\n/api/\n/temp/"}
                  value={excludePaths}
                  onChange={(e) => setExcludePaths(e.target.value)}
                  aria-describedby={`${formId}-exclude-hint`}
                  rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none font-mono"
                />
                <p id={`${formId}-exclude-hint`} className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  One per line. Exclude URLs containing these paths.
                </p>
              </div>
            </div>

            {/* Info note */}
            <div className="flex gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Our crawler respects robots.txt rules and follows internal links only. JavaScript-rendered pages (SPAs) may not be fully discovered.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isCrawling || !url.trim()}
        className="mt-6 sm:mt-8 w-full rounded-2xl shadow-premium text-[14px] sm:text-[16px] h-12 sm:h-14"
        aria-busy={isCrawling}
      >
        {isCrawling ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" aria-hidden="true" />
            Crawling site...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" aria-hidden="true" />
            Generate Sitemap
          </>
        )}
      </Button>

      <p className="mt-2.5 sm:mt-3 text-[10px] sm:text-xs text-center text-muted-foreground">
        Free, no signup required. Up to 500 pages per crawl.
      </p>
    </form>
  );
}
