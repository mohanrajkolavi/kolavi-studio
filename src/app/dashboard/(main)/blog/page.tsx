"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/dashboard/TagInput";
import { Loader2, Sparkles, ArrowLeft, X, Copy, FileText, Eye, Check, CheckCircle2, AlertTriangle, XCircle, ExternalLink, History, ChevronDown } from "lucide-react";
import { SEO } from "@/lib/constants";
import { auditArticle, MIN_PUBLISH_SCORE } from "@/lib/seo/article-audit";

/** API history entry (snake_case). */
type HistoryEntry = {
  id: string;
  created_at: string;
  title: string;
  meta_description: string;
  outline: string[];
  content: string;
  suggested_slug?: string | null;
  suggested_categories?: string[] | null;
  suggested_tags?: string[] | null;
};

function historyEntryToContent(entry: HistoryEntry): GeneratedContent {
  return {
    title: entry.title,
    metaDescription: entry.meta_description,
    outline: entry.outline ?? [],
    content: entry.content,
    suggestedSlug: entry.suggested_slug ?? undefined,
    suggestedCategories: entry.suggested_categories ?? undefined,
    suggestedTags: entry.suggested_tags ?? undefined,
  };
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = 60 * 1000, h = 60 * min, day = 24 * h;
  if (diff < min) return "Just now";
  if (diff < h) return `${Math.floor(diff / min)} min ago`;
  if (diff < day) return `${Math.floor(diff / h)} hours ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return d.toLocaleDateString();
}

/** Convert HTML to plain text for display and copy. */
function htmlToPlainText(html: string): string {
  if (!html?.trim()) return "";
  const t = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return t.replace(/\n{3,}/g, "\n\n").replace(/\n\s*\n/g, "\n\n").trim();
}

type GeneratedContent = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
};

type IntentType = "informational" | "navigational" | "commercial" | "transactional";

const INTENT_OPTIONS: { value: IntentType; label: string }[] = [
  { value: "informational", label: "Informational" },
  { value: "navigational", label: "Navigational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
];

/** Sample data to preview the output window layout on localhost without generating. ~1800+ words. */
const SAMPLE_OUTPUT: GeneratedContent = {
  title: "7 Proven SEO Tips for Medical Spas in 2025",
  metaDescription:
    "Learn how to rank higher and attract more clients with these SEO strategies tailored for medical spas and aesthetic practices.",
  outline: [
    "Why SEO Matters for Medical Spas",
    "Keyword Research for Aesthetic Services",
    "Local SEO and Google Business Profile",
    "On-Page Optimization Basics",
    "Content That Converts",
    "Technical SEO Checklist",
    "Measuring and Improving Over Time",
  ],
  content: `
<p>Medical spas compete for visibility in a crowded market. A solid SEO strategy helps you reach clients who are already searching for your services. This guide covers practical steps you can take in 2025 to improve your search rankings and fill your calendar with the right patients.</p>

<h2>Why SEO Matters for Medical Spas</h2>
<p>Potential clients search for treatments like Botox, fillers, and laser services before they book. If your practice doesn't show up on the first page, you're missing appointments. SEO aligns your site with what people are actually typing into Google.</p>
<p>Unlike traditional advertising, SEO brings in people who are already looking for what you offer. They have intent. They're comparing options, reading reviews, and checking prices. When your practice appears in those results with a clear title and a helpful description, you're more likely to get the click and eventually the booking.</p>
<p>Medical spa SEO also builds trust over time. A site that ranks well for relevant terms is often seen as more established and credible. Combined with strong reviews and a professional online presence, good SEO supports the decision to choose your practice over a competitor.</p>

<h2>Keyword Research for Aesthetic Services</h2>
<p>Focus on terms that reflect intent: "Botox near me," "best laser hair removal [city]," and "medical spa consultation." Use tools to find volume and difficulty, then create content around phrases your ideal clients use.</p>
<p>Start with the services you offer. List every treatment: injectables, body contouring, skin tightening, facials, and so on. For each, think about how someone would search. They might use the brand name (e.g., "Kybella"), the outcome ("double chin treatment"), or a comparison ("Botox vs. filler"). All of these are valid keywords to target on different pages.</p>
<p>Local modifiers matter. People often add "near me," your city name, or "best [service] in [city]." These queries are highly commercial and worth optimizing for. Create service pages that include your location naturally in the title and body, and consider a dedicated location page if you serve multiple areas.</p>
<p>Search volume and competition vary. Some terms have high volume and high difficulty; others are lower on both. A mix helps: target a few competitive head terms on pillar pages and many long-tail, lower-competition phrases in blog posts and FAQs. Over time, this builds topical authority and captures traffic at different stages of the funnel.</p>

<h2>Local SEO and Google Business Profile</h2>
<p>For medical spas, local SEO often drives the most qualified traffic. Your Google Business Profile (GBP) is central. Keep your business name, address, phone number, and website consistent everywhere they appear online. Inconsistencies can hurt local rankings and confuse both users and search engines.</p>
<p>Choose categories that match what you do. Primary category might be "Medical spa" or "Laser hair removal service," with secondary categories for other main offerings. Use the profile to highlight services, add photos of your space and treatments (within guidelines), and post updates such as new services, seasonal offers, or educational tips.</p>
<p>Encourage reviews and respond to them. Positive reviews support both credibility and local pack visibility. When you get a review, reply professionally. If someone leaves negative feedback, address it calmly and offer to resolve the issue offline. A thoughtful response can turn a bad experience into a chance to show how you handle feedback.</p>
<p>Build citations on directories that matter in your industry and region. Consistency in NAP (name, address, phone) across your website, GBP, and other listings helps Google trust your business information and can improve local rankings.</p>

<h2>On-Page Optimization Basics</h2>
<p>Each page should have a clear focus. One primary topic or keyword per page works better than trying to cover everything. The title tag is the main signal: keep it under about 60 characters, include the primary keyword, and make it compelling so people want to click. The meta description doesn't directly affect rankings but influences click-through; use it to summarize the page and include a call to action when it fits.</p>
<p>Headings structure the content. Use one H1 (usually the same as or very close to the title). Then use H2s for major sections and H3s for subsections. Include relevant keywords in headings where it sounds natural. This helps users and search engines understand the page.</p>
<p>Images need descriptive file names and alt text. For medical spas, alt text should describe the image (e.g., "treatment room with laser device") rather than stuffing keywords. Compress images so pages load quickly; speed is part of user experience and can affect rankings on mobile.</p>
<p>Internal links connect your pages and spread authority. Link from high-level pages (e.g., a "Treatments" hub) to specific service pages, and from blog posts to relevant services. Use anchor text that describes the destination page instead of generic "click here."</p>

<h2>Content That Converts</h2>
<p>Content supports SEO and conversion. Blog posts and service pages that answer real questions attract search traffic and position your practice as a resource. When someone reads a clear, accurate article and then sees your services and booking options, they're more likely to trust you and take the next step.</p>
<p>Match content to intent. Informational queries (e.g., "how long does Botox last") deserve thorough, helpful answers. Commercial queries (e.g., "best medical spa in [city]") suit comparison or list-style content that highlights what you offer. Transactional intent (e.g., "book Botox appointment") is best met with clear service pages and a visible CTA to book or contact.</p>
<p>Update content periodically. If you have older posts that still get traffic, refresh them with new information, stats, or FAQs. Google tends to favor fresh, accurate content. Updating also gives you a reason to re-share the page on social or in email.</p>
<p>Include clear calls to action. After explaining a treatment or answering a question, direct the reader to book a consultation, view your services, or call. One primary CTA per page or section keeps the path simple.</p>

<h2>Technical SEO Checklist</h2>
<p>A technically solid site helps Google crawl and index your pages. Ensure your site has a sitemap and that it's submitted in Google Search Console. Fix any critical crawl errors and avoid blocking important pages with robots.txt or noindex unless you have a good reason.</p>
<p>Mobile experience matters. Many searches happen on phones, and Google uses mobile-first indexing. Your site should be responsive, with readable text and tappable buttons. Test on real devices and use Google's tools to check for mobile usability issues.</p>
<p>Page speed affects both rankings and conversions. Compress images, minimize heavy scripts, and consider a fast host and a CDN if you have a lot of visitors. Even small improvements in load time can reduce bounce rate and support better rankings.</p>
<p>Use HTTPS. Secure sites are the norm, and browsers and search engines expect it. If your site is still on HTTP, moving to HTTPS is a baseline step for security and SEO.</p>

<h2>Measuring and Improving Over Time</h2>
<p>Track what's working. Google Search Console shows which queries bring impressions and clicks, which pages rank, and whether there are indexing or quality issues. Use this data to see which topics and pages deserve more attention or better optimization.</p>
<p>Analytics tells you what happens after the click. How long do people stay? Do they visit multiple pages? Do they book or contact? Connecting search data to conversions helps you prioritize the content and pages that actually drive business.</p>
<p>SEO results usually take time. Expect several months before you see meaningful changes in rankings and traffic, especially for competitive terms. Local SEO can show results a bit sooner. Stay consistent with content, technical upkeep, and profile management, and adjust based on data rather than short-term fluctuations.</p>

<h2>Frequently Asked Questions</h2>
<h3>How long does it take to see SEO results?</h3>
<p>Typically 3–6 months for meaningful traction. Local SEO can show improvements sooner. Results depend on competition, your current site strength, and how consistently you implement changes.</p>
<h3>Do I need a blog for medical spa SEO?</h3>
<p>Yes. Articles that answer common questions help you rank and build trust with potential clients. A blog also gives you more pages to target long-tail keywords and link internally to your service pages.</p>
<h3>What is the most important SEO factor for medical spas?</h3>
<p>For most practices, local SEO and Google Business Profile are the highest impact. After that, on-page optimization and helpful content round out a strong foundation.</p>
<h3>Can I do medical spa SEO myself?</h3>
<p>You can handle basics like updating your GBP, writing simple service pages, and publishing blog posts. For technical SEO, link building, and ongoing strategy, many practices hire an agency or consultant.</p>
`.trim(),
  suggestedSlug: "seo-tips-medical-spas-2025",
  suggestedCategories: ["SEO", "Medical Spa"],
  suggestedTags: ["SEO", "medical spa", "digital marketing", "2025"],
};

export default function BlogMakerPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [peopleAlsoSearchFor, setPeopleAlsoSearchFor] = useState<string[]>([]);
  const [intent, setIntent] = useState<IntentType[]>([]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [editing, setEditing] = useState<GeneratedContent | null>(null);
  const [contentView, setContentView] = useState<"preview" | "text">("preview");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [metaCopyField, setMetaCopyField] = useState<"title" | "metaDescription" | "slug" | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    link?: string;
  }>({ type: null, message: "" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<"auth" | "config" | "error" | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const recentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!recentOpen) return;
    function handleClick(e: MouseEvent) {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) setRecentOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [recentOpen]);

  useEffect(() => {
    if (generated !== null) return;
    setHistoryLoading(true);
    setHistoryError(null);
    fetch("/api/blog/history", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          setHistoryError("auth");
          return [];
        }
        if (res.status === 503) {
          setHistoryError("config");
          return [];
        }
        if (!res.ok) {
          setHistoryError("error");
          return [];
        }
        return res.json();
      })
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {
        setHistoryError("error");
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [generated]);

  const seoAudit = useMemo(() => {
    if (!editing) return null;
    try {
      return auditArticle({
        title: editing.title,
        metaDescription: editing.metaDescription,
        content: editing.content,
        slug: editing.suggestedSlug,
        focusKeyword: keywords[0] ?? undefined,
      });
    } catch (e) {
      return {
        score: 0,
        items: [
          {
            id: "audit-error",
            severity: "fail" as const,
            label: "Audit",
            message: e instanceof Error ? e.message : "SEO audit failed.",
          },
        ],
        summary: { pass: 0, warn: 0, fail: 1 },
        publishable: false,
      };
    }
  }, [editing, keywords]);

  async function handleCopyForWordPress() {
    if (!editing?.content) return;
    try {
      await navigator.clipboard.writeText(editing.content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setStatus({ type: "error", message: "Copy failed" });
    }
  }

  async function handleCopyMetaField(field: "title" | "metaDescription" | "slug") {
    if (!editing) return;
    const value =
      field === "title"
        ? editing.title
        : field === "metaDescription"
          ? editing.metaDescription ?? ""
          : editing.suggestedSlug ?? "";
    try {
      await navigator.clipboard.writeText(value);
      setMetaCopyField(field);
      setTimeout(() => setMetaCopyField(null), 2000);
    } catch {
      setStatus({ type: "error", message: "Copy failed" });
    }
  }

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGenerating(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords.join(", "),
          peopleAlsoSearchFor: peopleAlsoSearchFor.join(", "),
          intent: intent.length > 0 ? intent : ["informational"],
          competitorUrls: competitorUrls,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate blog post";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setGenerated(result);
      setEditing({ ...result });
      setContentView("preview");
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate blog post",
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Header – Apple/Google style: generous space, refined typography */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Blog Maker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate SEO-optimized posts with AI. Tip: up to 6 keywords, 3 people also search for, and 2 competitors for best results.
          </p>
        </div>
        {generated ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const current = editing;
              setGenerated(null);
              setEditing(null);
              if (current && current.title !== SAMPLE_OUTPUT.title) {
                fetch("/api/blog/history", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(current),
                  credentials: "include",
                }).catch(() => {});
              }
            }}
            className="shrink-0 border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Start over
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setKeywords(["medical spa SEO", "aesthetic practice marketing"]);
              setPeopleAlsoSearchFor(["how long for SEO results", "medical spa blog"]);
              setIntent(["informational"]);
              setGenerated(SAMPLE_OUTPUT);
              setEditing({ ...SAMPLE_OUTPUT });
              setContentView("preview");
            }}
            className="shrink-0 border-border text-muted-foreground hover:text-foreground"
          >
            View sample output
          </Button>
        )}
      </header>

      {status.type && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-4 rounded-2xl px-5 py-4 text-sm ${
            status.type === "success"
              ? "bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-red-50/90 text-red-800 dark:bg-red-950/50 dark:text-red-200"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p>{status.message}</p>
            {status.type === "success" && status.link && (
              <a
                href={status.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-medium underline underline-offset-2 hover:no-underline"
              >
                View post →
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStatus({ type: null, message: "", link: undefined })}
            className="shrink-0 rounded-2xl p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!generated ? (
        <form
          onSubmit={handleGenerate}
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          {generating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 animate-in fade-in duration-200 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-5 text-sm font-medium text-muted-foreground">
                Generating your post…
              </p>
            </div>
          )}

          <div className="space-y-0">
            {/* Keywords & PASF */}
            <section className="grid gap-8 p-8 sm:grid-cols-2 sm:p-10">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Keywords
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Primary focus. First keyword is most important. Max 6.
                  </p>
                </div>
                <TagInput
                  tags={keywords}
                  onTagsChange={setKeywords}
                  placeholder="Add a keyword, press Enter"
                  maxTags={6}
                  disabled={generating}
                  className="min-h-12 rounded-2xl bg-background px-4 py-3"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    People also search for
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Related phrases for FAQs. Max 3.
                  </p>
                </div>
                <TagInput
                  tags={peopleAlsoSearchFor}
                  onTagsChange={setPeopleAlsoSearchFor}
                  placeholder="Add a phrase, press Enter"
                  maxTags={3}
                  disabled={generating}
                  className="min-h-12 rounded-2xl bg-background px-4 py-3"
                />
              </div>
            </section>

            {/* Search intent */}
            <section className="space-y-6 border-t border-border/50 p-8 sm:p-10">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Search intent
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select one or more to shape tone and structure
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {INTENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`inline-flex cursor-pointer items-center rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      intent.includes(opt.value)
                        ? "bg-orange-600 text-white shadow-md shadow-orange-500/20 dark:bg-orange-500 dark:shadow-orange-400/20"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${generating ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={intent.includes(opt.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIntent([...intent, opt.value]);
                        } else {
                          setIntent(intent.filter((i) => i !== opt.value));
                        }
                      }}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </section>

            {/* Competitor URLs */}
            <section className="space-y-3 border-t border-border/50 p-8 sm:p-10">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Competitor articles
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  URLs for structure reference. Fetched via Jina Reader. Max 2.
                </p>
              </div>
              <TagInput
                tags={competitorUrls}
                onTagsChange={setCompetitorUrls}
                placeholder="Paste URL, press Enter"
                maxTags={2}
                disabled={generating}
                className="min-h-12 rounded-2xl bg-background px-4 py-3"
              />
            </section>

            {/* Submit: Recent button (same size as Generate post) opposite Generate post */}
            <section className="flex flex-wrap items-center justify-between gap-6 border-t border-border/50 p-8 sm:p-10">
              <div className="relative shrink-0" ref={recentRef}>
                <Button
                  type="button"
                  onClick={() => setRecentOpen((o) => !o)}
                  variant="outline"
                  className="h-12 rounded-full border-2 border-border px-8 text-base font-medium text-foreground shadow-sm hover:bg-muted/60 hover:text-foreground"
                >
                  <History className="mr-2 h-4 w-4" />
                  Recent
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${recentOpen ? "rotate-180" : ""}`} />
                </Button>
                {recentOpen && (
                  <div className="absolute left-full top-1/2 z-50 ml-2 w-80 -translate-y-1/2 rounded-xl border border-border bg-card py-2 shadow-lg">
                    {historyLoading ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">Loading…</p>
                    ) : historyError === "auth" ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">Sign in to see recent posts.</p>
                    ) : historyError === "config" ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">History not available. Check .env.local and SETUP.md.</p>
                    ) : historyError === "error" ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">Could not load history.</p>
                    ) : history.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground leading-snug">No recent posts. Generate a post and click Start over to save it here.</p>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {history.map((entry) => (
                          <li key={entry.id}>
                            <button
                              type="button"
                              onClick={() => {
                                const content = historyEntryToContent(entry);
                                setGenerated(content);
                                setEditing(content);
                                setContentView("preview");
                                setRecentOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50"
                            >
                              <span className="font-medium text-foreground line-clamp-1">
                                {entry.title.length > 55 ? `${entry.title.slice(0, 55)}…` : entry.title}
                              </span>
                              <span className="block text-xs text-muted-foreground">{relativeTime(entry.created_at)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={generating || keywords.length === 0}
                className="h-12 shrink-0 rounded-full bg-orange-600 px-8 text-base font-medium text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/25 dark:bg-orange-500 dark:shadow-orange-400/20 dark:hover:bg-orange-600 disabled:shadow-none"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate post
              </Button>
            </section>
          </div>
        </form>
      ) : editing ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-stretch">
            {/* Left: outline column. Right: content column. Both columns match height; content box ends where outline ends. */}
            <aside className="order-1 flex min-w-0 flex-col gap-4 lg:order-none">
              {/* SEO Audit – Google Search Central (developers.google.com/search/docs) – show first */}
              {editing && seoAudit && (
                <div className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      SEO Audit
                    </p>
                    <a
                      href="https://developers.google.com/search/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Google Search Central
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 flex flex-wrap items-baseline gap-2">
                      <span
                        className={`text-2xl font-bold tabular-nums ${
                          seoAudit.publishable
                            ? "text-emerald-600 dark:text-emerald-400"
                            : seoAudit.score >= 50
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {seoAudit.score}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {seoAudit.summary.pass} pass · {seoAudit.summary.warn} warn · {seoAudit.summary.fail} fail
                      </span>
                      {seoAudit.publishable ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Publishable
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {seoAudit.score < MIN_PUBLISH_SCORE
                            ? `Below ${MIN_PUBLISH_SCORE}% — fix before publishing`
                            : "Fix critical issues before publishing"}
                        </span>
                      )}
                    </div>
                    {(seoAudit.items.some((i) => i.id === "ai-phrases" && (i.severity === "warn" || i.severity === "fail")) ||
                      seoAudit.items.some((i) => i.id === "ai-typography" && (i.severity === "warn" || i.severity === "fail"))) && (
                      <p className="mb-3 text-[11px] text-muted-foreground">
                        Replace flagged phrases and em-dashes/curly quotes. Target under 30% AI detection.
                      </p>
                    )}
                    <ul className="space-y-2">
                      {[...seoAudit.items]
                        .sort((a, b) => {
                          const aiItems = ["ai-phrases", "ai-typography"];
                          const aAi = aiItems.includes(a.id ?? "") && (a.severity === "warn" || a.severity === "fail");
                          const bAi = aiItems.includes(b.id ?? "") && (b.severity === "warn" || b.severity === "fail");
                          if (aAi && !bAi) return -1;
                          if (!aAi && bAi) return 1;
                          return 0;
                        })
                        .map((item) => {
                        const Icon =
                          item.severity === "pass"
                            ? CheckCircle2
                            : item.severity === "warn"
                              ? AlertTriangle
                              : XCircle;
                        const iconClass =
                          item.severity === "pass"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : item.severity === "warn"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400";
                        return (
                          <li
                            key={item.id}
                            className="flex gap-2 rounded-lg bg-muted/30 px-2.5 py-2"
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {item.message}
                              </p>
                              {item.guideline && (
                                <p className="mt-1 text-[10px] text-muted-foreground/80">
                                  {item.guideline}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {(keywords.length > 0 || peopleAlsoSearchFor.length > 0) && (
                <div className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Generated from
                    </p>
                  </div>
                  <div className="space-y-4 p-4">
                    {keywords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Keywords
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((k, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {peopleAlsoSearchFor.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          People also search for
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {peopleAlsoSearchFor.map((p, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {intent.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Intent
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {intent.map((i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                            >
                              {INTENT_OPTIONS.find((o) => o.value === i)?.label ?? i}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Outline
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Section headings; edit as needed.
                  </p>
                </div>
                <div className="space-y-3 p-4">
                  {editing.outline.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-semibold tabular-nums text-foreground">
                        {index + 1}
                      </span>
                      <Textarea
                        value={item}
                        onChange={(e) => {
                          const newOutline = [...editing.outline];
                          newOutline[index] = e.target.value;
                          setEditing({ ...editing, outline: newOutline });
                        }}
                        rows={2}
                        className="min-h-[2.5rem] flex-1 resize-y rounded-xl border-border bg-background text-xs leading-snug"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right: Content panel – absolute wrapper so row height = outline only; content box ends exactly where outline ends */}
            <div className="order-2 relative min-h-0 min-w-0 lg:order-none">
              <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* Meta – header bar + fields with inline copy */}
              <div className="shrink-0 flex flex-col border-b border-border">
                <div className="flex items-center px-4 py-3 bg-muted/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta</span>
                </div>
                <div className="space-y-5 p-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="edit-title" className="text-sm font-medium text-foreground">Title</label>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                          editing.title.length > SEO.TITLE_MAX_CHARS
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {editing.title.length}/{SEO.TITLE_MAX_CHARS}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="edit-title"
                        value={editing.title}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                        className="h-10 rounded-lg border-border bg-background pr-10 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMetaField("title")}
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy title"
                      >
                        {metaCopyField === "title" ? (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Meta description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="edit-meta" className="text-sm font-medium text-foreground">Meta description</label>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                          editing.metaDescription.length > SEO.META_DESCRIPTION_MAX_CHARS
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {editing.metaDescription.length}/{SEO.META_DESCRIPTION_MAX_CHARS}
                      </span>
                    </div>
                    <div className="relative">
                      <Textarea
                        id="edit-meta"
                        value={editing.metaDescription}
                        onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                        rows={2}
                        className="min-h-[3.5rem] resize-y rounded-lg border-border bg-background pr-10 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMetaField("metaDescription")}
                        className="absolute right-2 top-2 h-8 w-8 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy meta description"
                      >
                        {metaCopyField === "metaDescription" ? (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* URL slug */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="edit-slug" className="text-sm font-medium text-foreground">URL slug</label>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {(editing.suggestedSlug ?? "").length}/75
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="edit-slug"
                        value={editing.suggestedSlug ?? ""}
                        onChange={(e) => setEditing({ ...editing, suggestedSlug: e.target.value })}
                        className="h-10 rounded-lg border-border bg-background font-mono pr-10 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMetaField("slug")}
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy URL slug"
                      >
                        {metaCopyField === "slug" ? (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content – view switcher + actions; redesigned toolbar */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="shrink-0 flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/30 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</span>
                  <div className="flex items-center gap-3">
                    <div className="flex rounded-lg bg-background shadow-sm ring-1 ring-border/60" role="group" aria-label="View mode">
                      {[
                        { id: "preview" as const, label: "Preview", icon: Eye },
                        { id: "text" as const, label: "Text", icon: FileText },
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setContentView(id)}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                            contentView === id
                              ? "bg-muted text-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <span className="h-5 w-px bg-border" aria-hidden />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing({ ...generated! })}
                        className="h-8 rounded-lg border-border bg-background px-3 text-xs font-medium"
                      >
                        Reset edits
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCopyForWordPress}
                        className="h-8 rounded-lg bg-orange-600 px-3 text-xs font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {copyFeedback ? "Copied!" : "Copy for WordPress"}
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Content box: fills remaining height so it ends where outline ends; scroll inside. Consistent gap around nested card. */}
                <div className="min-h-[320px] flex-1 overflow-y-auto p-4">
                  {contentView === "preview" && (
                    <div className="rounded-2xl border border-border bg-background shadow-sm">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none px-5 py-4 text-foreground"
                        dangerouslySetInnerHTML={{ __html: editing.content || "<p>(No content)</p>" }}
                      />
                    </div>
                  )}
                  {contentView === "text" && (
                    <div className="rounded-2xl border border-border bg-background px-5 py-4 shadow-sm">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {htmlToPlainText(editing.content) || "(No content)"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
