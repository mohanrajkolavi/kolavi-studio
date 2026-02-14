"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/dashboard/TagInput";
import { useBlogGeneration } from "@/components/dashboard/BlogGenerationProvider";
import { Loader2, Sparkles, ArrowLeft, X, Copy, FileText, Eye, Check, CheckCircle2, AlertTriangle, XCircle, ExternalLink, ChevronDown, ChevronUp, GripVertical, Trash2, Plus, Save, Search, PenLine } from "lucide-react";
import { GenerationLoadingOverlay } from "@/components/dashboard/GenerationLoadingOverlay";
import { SEO } from "@/lib/constants";
import { auditArticle, MIN_PUBLISH_SCORE } from "@/lib/seo/article-audit";
import type { AuditItem } from "@/lib/seo/article-audit";
import type {
  BriefChunkResult,
  BriefOverridesForDraft,
  GeneratedContent,
  GenerationInput,
  OutlineSectionForEditor,
  PipelineResult,
  ResearchChunkResult,
  ResearchSerpItem,
  ResearchSerpResult,
} from "@/lib/blog/generation-types";
import { pipelineToGenerated } from "@/lib/blog/generation-types";

/** Result state shape (matches BlogGenerationProvider). */
type ResultState = {
  pipelineResult: PipelineResult | null;
  fallbackGenerated: GeneratedContent | null;
  input: GenerationInput;
};

/** E-E-A-T & Content Quality API response (Python content_audit — Google quality rater signals). */
type ContentAuditQualityResult = {
  results: {
    experience_signals?: { score: number; experience_sentences: string[] } | { error: string };
    title_hyperbole?: { is_clickbait: boolean; trigger_word?: string; sentiment_polarity?: number; sentiment_trigger?: string } | { error: string };
    data_density?: { density_score: number; data_point_count: number; word_count: number } | { error: string };
    skimmability?: { pass_fail: string; problematic_sections: { section_label: string; word_count: number; issue: string }[] } | { error: string };
    temporal_consistency?: { consistency_score: string; title_year?: number; stale_year_references: string[] } | { error: string };
    answer_first_structure?: { direct_answer_ratio: number; buried_answers: { heading_text: string; first_sentence: string; word_count: number }[]; total_questions: number } | { error: string };
    entity_density?: { density_percent: number; top_entities: [string, string][]; unique_entity_count: number; skipped_reason?: string } | { error: string };
    readability_variance?: { variance_score: string; fatigue_sentences: string[]; monotony_detected: boolean } | { error: string };
    lazy_phrasing?: { score: number; found_transitions: string[]; found_hype: string[]; found_tells: string[] } | { error: string };
    sentence_starts?: { is_repetitive: boolean; repeating_word: string | null } | { error: string };
  };
};

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

function isEeatError(r: unknown): r is { error: string } {
  return typeof r === "object" && r !== null && "error" in r && typeof (r as { error: unknown }).error === "string";
}

/** Show a readable error message; if the value is JSON like {"error":"..."}, extract the message. */
function displayError(msg: string | null | undefined): string {
  if (msg == null || msg === "") return "";
  const trimmed = msg.trim();
  if (trimmed.startsWith("{") && trimmed.includes('"error"')) {
    try {
      const o = JSON.parse(trimmed) as { error?: string };
      if (typeof o?.error === "string") return o.error;
    } catch {
      // not valid JSON, fall through
    }
  }
  return msg;
}

function EeatResultsDisplay({
  results,
  open: openDetails,
  filter = "all",
}: {
  results: ContentAuditQualityResult["results"];
  open: boolean;
  filter?: "all" | "correct" | "issues";
}) {
  const items: Array<{
    key: string;
    label: string;
    summary: (r: unknown) => string;
    detail: (r: unknown) => string | null;
    isProblematic?: (r: unknown) => boolean;
    isSkipped?: (r: unknown) => boolean;
  }> = [
    {
      key: "experience_signals",
      label: "Experience signals",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : `${(r as { score: number }).score}/100`,
      detail: (r: unknown) =>
        isEeatError(r) ? null : (r as { experience_sentences: string[] }).experience_sentences?.length
          ? `Sentences: ${(r as { experience_sentences: string[] }).experience_sentences.length}`
          : "No experience signal sentences detected",
      isProblematic: (r) => !isEeatError(r) && (r as { score: number }).score < 1,
    },
    {
      key: "title_hyperbole",
      label: "Title hyperbole",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : (r as { is_clickbait: boolean }).is_clickbait ? "Clickbait" : "OK",
      detail: (r: unknown) =>
        isEeatError(r) ? null : (r as { trigger_word?: string }).trigger_word
          ? `Trigger: ${(r as { trigger_word: string }).trigger_word}`
          : null,
      isProblematic: (r) => !isEeatError(r) && (r as { is_clickbait: boolean }).is_clickbait,
    },
    {
      key: "data_density",
      label: "Data density",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : `${(r as { density_score: number }).density_score} per 100 words`,
      detail: (r: unknown) =>
        isEeatError(r) ? null : `${(r as { data_point_count: number }).data_point_count} data points`,
      isProblematic: (r) => !isEeatError(r) && (r as { density_score: number }).density_score < 1,
    },
    {
      key: "skimmability",
      label: "Skimmability",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : (r as { pass_fail: string }).pass_fail === "pass" ? "Pass" : "Issues",
      detail: (r: unknown) =>
        isEeatError(r) ? null : (r as { problematic_sections: { section_label: string; issue: string }[] }).problematic_sections?.length
          ? (r as { problematic_sections: { section_label: string; issue: string }[] }).problematic_sections.map((s) => `${s.section_label}: ${s.issue}`).join("; ")
          : null,
      isProblematic: (r) => !isEeatError(r) && (r as { pass_fail: string }).pass_fail !== "pass",
    },
    {
      key: "temporal_consistency",
      label: "Temporal consistency",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : (r as { consistency_score: string }).consistency_score === "pass" ? "Pass" : "Stale refs",
      detail: (r: unknown) =>
        isEeatError(r) ? null : (r as { stale_year_references: string[] }).stale_year_references?.length
          ? (r as { stale_year_references: string[] }).stale_year_references.join(", ")
          : null,
      isProblematic: (r) => !isEeatError(r) && (r as { consistency_score: string }).consistency_score !== "pass",
    },
    {
      key: "answer_first_structure",
      label: "Answer-first",
      summary: (r: unknown) => {
        if (isEeatError(r)) return (r as { error: string }).error;
        const d = r as { direct_answer_ratio: number; total_questions: number };
        if ((d.total_questions ?? 0) === 0) return "No question headings";
        return `${d.direct_answer_ratio}% direct`;
      },
      detail: (r: unknown) => {
        if (isEeatError(r)) return null;
        const d = r as { buried_answers: unknown[]; total_questions: number };
        if ((d.total_questions ?? 0) === 0)
          return "No H2/H3 starting with What/How/Who/Why/Where found";
        return d.buried_answers?.length
          ? `${d.buried_answers.length} buried answer(s)`
          : null;
      },
      isProblematic: (r) => {
        if (isEeatError(r)) return false;
        const d = r as { direct_answer_ratio: number; total_questions: number; buried_answers: unknown[] };
        // Flag when there are question headings but most answers are buried
        return (d.total_questions ?? 0) > 0 && d.direct_answer_ratio < 50;
      },
      isSkipped: (r) => !isEeatError(r) && ((r as { total_questions: number }).total_questions ?? 0) === 0,
    },
    {
      key: "entity_density",
      label: "Entity density",
      summary: (r: unknown) =>
        isEeatError(r)
          ? (r as { error: string }).error
          : (r as { skipped_reason?: string }).skipped_reason
            ? "Skipped (spacy not installed)"
            : `${(r as { density_percent: number }).density_percent}%`,
      detail: (r: unknown) =>
        isEeatError(r)
          ? null
          : (r as { skipped_reason?: string }).skipped_reason
            ? (r as { skipped_reason: string }).skipped_reason
            : (r as { top_entities: [string, string][] }).top_entities?.length
              ? (r as { top_entities: [string, string][] }).top_entities.map((e) => e[0]).slice(0, 5).join(", ")
              : null,
      isSkipped: (r) => !isEeatError(r) && !!(r as { skipped_reason?: string }).skipped_reason,
    },
    {
      key: "readability_variance",
      label: "Readability variance",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : (r as { variance_score: string }).variance_score === "pass" ? "Pass" : "Issues",
      detail: (r: unknown) =>
        isEeatError(r) ? null : (r as { monotony_detected: boolean; fatigue_sentences: string[] }).monotony_detected
          ? "Monotony"
          : (r as { fatigue_sentences: string[] }).fatigue_sentences?.length
            ? `${(r as { fatigue_sentences: string[] }).fatigue_sentences.length} long sentences`
            : null,
      isProblematic: (r) => !isEeatError(r) && (r as { variance_score: string }).variance_score !== "pass",
    },
    {
      key: "lazy_phrasing",
      label: "Generic phrasing",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : `${(r as { score: number }).score}% filler`,
      detail: (r: unknown) => {
        if (isEeatError(r)) return null;
        const x = r as { found_transitions: string[]; found_hype: string[]; found_tells: string[] };
        const parts: string[] = [];
        if (x.found_transitions?.length) parts.push(`Transitions: ${[...new Set(x.found_transitions)].join(", ")}`);
        if (x.found_hype?.length) parts.push(`Hype: ${[...new Set(x.found_hype)].join(", ")}`);
        if (x.found_tells?.length) parts.push(`Generic: ${[...new Set(x.found_tells)].join(", ")}`);
        return parts.length ? parts.join(" · ") : null;
      },
      isProblematic: (r) => !isEeatError(r) && (r as { score: number }).score >= 1,
    },
    {
      key: "sentence_starts",
      label: "Sentence variety",
      summary: (r: unknown) =>
        isEeatError(r) ? (r as { error: string }).error : (r as { is_repetitive: boolean }).is_repetitive ? "Repetitive" : "Pass",
      detail: (r: unknown) =>
        isEeatError(r) ? null : (r as { repeating_word: string | null }).repeating_word
          ? `Repeating: "${(r as { repeating_word: string }).repeating_word}"`
          : null,
      isProblematic: (r) => !isEeatError(r) && (r as { is_repetitive: boolean }).is_repetitive,
    },
  ];

  const qualityKeys = ["experience_signals", "title_hyperbole", "data_density", "skimmability"];
  const structureKeys = ["temporal_consistency", "answer_first_structure", "entity_density", "readability_variance"];
  const writingKeys = ["lazy_phrasing", "sentence_starts"];
  const groups: { label: string; keys: string[] }[] = [
    { label: "E-E-A-T Signals", keys: qualityKeys },
    { label: "Content Structure", keys: structureKeys },
    { label: "Writing Quality", keys: writingKeys },
  ];

  const itemMap = new Map(items.map((i) => [i.key, i]));

  return (
    <div className="space-y-3">
      {groups.map(({ label, keys: groupKeys }) => {
        let groupItems = groupKeys
          .map((key) => {
            const item = itemMap.get(key);
            const r = results[key as keyof typeof results];
            if (!item || r == null) return null;
            return { key, item, r };
          })
          .filter((x): x is NonNullable<typeof x> => x != null);
        if (filter !== "all") {
          groupItems = groupItems.filter(({ item, r }) => {
            const ok = !isEeatError(r) && !(item.isProblematic?.(r) ?? false);
            const skipped = item.isSkipped?.(r) ?? false;
            const isIssue = !ok && !skipped;
            if (filter === "correct") return ok;
            if (filter === "issues") return isIssue || skipped;
            return true;
          });
        }
        if (groupItems.length === 0) return null;
        return (
          <div key={label} className="space-y-3">
            <p className="sticky top-0 z-10 bg-card/95 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
              {label}
            </p>
            {groupItems.map(({ key, item, r }) => {
              const { label: itemLabel, summary, detail, isProblematic, isSkipped } = item;
              const ok = !isEeatError(r) && !(isProblematic?.(r) ?? false);
              const skipped = isSkipped?.(r) ?? false;
              const isIssue = !ok && !skipped;
              return (
                <div
                  key={key}
                  className={`flex gap-3 rounded-xl px-3 py-2.5 ${
                    isIssue ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-muted/30 dark:bg-muted/20"
                  }`}
                >
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : skipped ? (
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{itemLabel}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{summary(r)}</p>
                    {openDetails && detail(r) && (
                      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{detail(r)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

type IntentType = "informational" | "navigational" | "commercial" | "transactional";

const INTENT_OPTIONS: { value: IntentType; label: string }[] = [
  { value: "informational", label: "Informational" },
  { value: "navigational", label: "Navigational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
];

/**
 * Sample data for the Blog Maker output UI. Run real generation for live results.
 * Pairs with sample keywords (e.g. "medical spa SEO").
 * Updated for Output Quality Plan: targetWords sum to 2000 (standard preset), per-section guidance.
 */
const SAMPLE_OUTPUT: GeneratedContent = {
  title: "7 Proven SEO Tips for Medical Spas in 2026",
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
<p>Medical spas compete for visibility in a crowded market. A solid SEO strategy helps you reach clients who are already searching for your services. This guide covers practical steps you can take in 2026 to improve your search rankings and fill your calendar with the right patients.</p>

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
  suggestedSlug: "seo-tips-medical-spas-2026",
  suggestedCategories: ["SEO", "Medical Spa"],
  suggestedTags: ["SEO", "medical spa", "digital marketing", "2026"],
};

/** Sample SERP (9 results, 3x3 grid) for Select competitors demo. Matches production. */
const SAMPLE_RESEARCH_SERP: ResearchSerpResult = {
  results: [
    { position: 1, title: "7 Proven SEO Tips for Medical Spas in 2026", url: "https://example.com/medical-spa-seo-guide" },
    { position: 2, title: "Medical Spa Marketing: Aesthetic Practice SEO", url: "https://example.com/aesthetic-practice-marketing" },
    { position: 3, title: "Local SEO for Medical Spas and Med Spas", url: "https://example.com/local-seo-medical-spa" },
    { position: 4, title: "How to Rank Your Med Spa on Google", url: "https://example.com/rank-med-spa-google" },
    { position: 5, title: "Medical Spa Website SEO Checklist 2026", url: "https://example.com/med-spa-seo-checklist" },
    { position: 6, title: "Aesthetic Practice Digital Marketing Guide", url: "https://example.com/aesthetic-digital-marketing" },
    { position: 7, title: "Google Business Profile for Medical Spas", url: "https://example.com/gbp-medical-spa" },
    { position: 8, title: "Content Strategy for Med Spa SEO", url: "https://example.com/med-spa-content-strategy" },
    { position: 9, title: "Medical Spa Keywords and Search Intent", url: "https://example.com/med-spa-keywords" },
  ],
};

/** Sample research chunk for demo — matches production Research summary UI. */
const SAMPLE_RESEARCH: ResearchChunkResult = {
  urlCount: 3,
  articleCount: 3,
  currentDataFacts: 24,
  competitorUrls: [
    "https://example.com/medical-spa-seo-guide",
    "https://example.com/aesthetic-practice-marketing",
    "https://example.com/local-seo-medical-spa",
  ],
  competitorTitles: [
    "7 Proven SEO Tips for Medical Spas in 2026",
    "Medical Spa Marketing: Aesthetic Practice SEO",
    "Local SEO for Medical Spas and Med Spas",
  ],
};

/** Sample brief chunk for demo — outline editable before draft (matches SAMPLE_OUTPUT outline). Target words sum to 2000. */
const SAMPLE_BRIEF: BriefChunkResult = {
  outline: [
    "Why SEO Matters for Medical Spas",
    "Keyword Research for Aesthetic Services",
    "Local SEO and Google Business Profile",
    "On-Page Optimization Basics",
    "Content That Converts",
    "Technical SEO Checklist",
    "Measuring and Improving Over Time",
  ].map((heading, i) => {
    const targets = [220, 280, 280, 290, 310, 310, 310];
    const topicMap: Record<number, string[]> = {
      0: ["why medical spa SEO", "search intent", "competitive visibility"],
      1: ["keyword research", "aesthetic services", "local modifiers"],
      2: ["local SEO", "Google Business Profile", "reviews", "citations"],
      3: ["on-page optimization", "title tags", "headings", "meta description"],
      4: ["content strategy", "intent matching", "conversion", "CTAs"],
      5: ["technical SEO", "sitemap", "mobile", "page speed", "HTTPS"],
      6: ["analytics", "Search Console", "improvement", "tracking"],
    };
    return {
      heading,
      level: "h2" as const,
      reason: i === 0 ? "Establish relevance and intent" : "Cover key subtopics for medical spa SEO",
      topics: topicMap[i as keyof typeof topicMap] ?? [heading.toLowerCase(), "medical spa", "SEO"],
      targetWords: targets[i] ?? 280,
    };
  }),
  briefSummary: {
    similaritySummary: "Top results focus on local SEO, Google Business Profile, and on-page basics.",
    extraValueThemes: [
      "Emphasize 2026-specific guidance (Core Web Vitals, SGE considerations).",
      "Include a short FAQ section to capture featured snippets.",
    ],
    freshnessNote: "Content references 2026 best practices; consider annual refresh.",
  },
};

/** Full pipeline sample for UI work without tokens. Draft has placeholder meta; user clicks "Generate meta" to get SEO-optimized title/meta/slug. */
const SAMPLE_PIPELINE_RESULT: PipelineResult = {
  article: {
    content: SAMPLE_OUTPUT.content,
    outline: SAMPLE_OUTPUT.outline,
    suggestedSlug: "medical-spa-seo",
    suggestedCategories: SAMPLE_OUTPUT.suggestedCategories ?? [],
    suggestedTags: SAMPLE_OUTPUT.suggestedTags ?? [],
  },
  title: "Draft",
  metaDescription: "",
  sourceUrls: [
    "https://developers.google.com/search/docs",
    "https://support.google.com/business",
    "https://blog.google/products/search",
  ],
  auditResult: {
    score: 88,
    publishable: true,
    summary: { pass: 19, warn: 0, fail: 0 },
    items: [
      { id: "title-length", severity: "pass", label: "Title length", message: "Title is 52 chars.", level: 2 },
      { id: "title-keyword", severity: "pass", label: "Title keyword", message: "Title contains target keyword.", level: 2 },
      { id: "meta-description", severity: "pass", label: "Meta description length", message: "Meta description is 128 chars.", level: 2 },
      { id: "content-thin", severity: "pass", label: "Content depth", message: "Content is 1847 words.", level: 1 },
      { id: "keyword-stuffing", severity: "pass", label: "Keyword use", message: "Focus keyword used naturally (12 times).", level: 2 },
      { id: "headings-hierarchy", severity: "pass", label: "Heading hierarchy", message: "Found 14 heading(s) with valid structure.", level: 2 },
      { id: "paragraph-length", severity: "pass", label: "Paragraph length", message: "Paragraphs within 75 words.", level: 2 },
      { id: "slug-length", severity: "pass", label: "URL slug length", message: "Slug is 24 chars.", level: 2 },
      { id: "rm-meta-keyword", severity: "pass", label: "Rank Math: Keyword in meta", message: "Primary keyword in meta description.", level: 3, source: "rankmath" },
      { id: "rm-first10", severity: "pass", label: "Rank Math: Keyword in intro", message: "Primary keyword appears in first 10% of content.", level: 3, source: "rankmath" },
      { id: "rm-slug-keyword", severity: "pass", label: "Rank Math: Keyword in URL", message: "Primary keyword in slug.", level: 3, source: "rankmath" },
      { id: "rm-subheading-keyword", severity: "pass", label: "Rank Math: Keyword in subheadings", message: "Primary keyword in subheadings.", level: 3, source: "rankmath" },
      { id: "rm-title-position", severity: "pass", label: "Rank Math: Keyword position in title", message: "Primary keyword in first 50% of title.", level: 3, source: "rankmath" },
      { id: "rm-number-in-title", severity: "pass", label: "Rank Math: Number in title", message: "Title contains a number.", level: 3, source: "rankmath" },
    ],
  },
  schemaMarkup: {
    article: { "@context": "https://schema.org", "@type": "Article", headline: "Draft" },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How long does it take to see SEO results?", acceptedAnswer: { "@type": "Answer", text: "Typically 3–6 months for meaningful traction. Local SEO can show improvements sooner." } },
        { "@type": "Question", name: "Do I need a blog for medical spa SEO?", acceptedAnswer: { "@type": "Answer", text: "Yes. Articles that answer common questions help you rank and build trust with potential clients." } },
      ],
    },
    breadcrumb: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [] },
    faqSchemaNote: "FAQ block added from article H2/H3 pairs; inject on publish.",
  },
  faqEnforcement: {
    passed: true,
    violations: [],
  },
  factCheck: {
    verified: true,
    hallucinations: [],
    issues: [],
    skippedRhetorical: [],
  },
  publishTracking: { keyword: "medical spa SEO" },
  generationTimeMs: 42_500,
  briefSummary: {
    similaritySummary:
      "Top results focus on local SEO, Google Business Profile, and on-page basics. Many include checklist-style tips and 2024–2025 updates.",
    extraValueThemes: [
      "Emphasize 2026-specific guidance (Core Web Vitals, SGE considerations).",
      "Include a short FAQ section to capture featured snippets.",
    ],
    freshnessNote: "Content references 2026 best practices; consider annual refresh.",
  },
  outlineDrift: {
    passed: true,
    expected: SAMPLE_OUTPUT.outline.slice(0, 7),
    actual: [...SAMPLE_OUTPUT.outline.slice(0, 7), "Frequently Asked Questions"],
    missing: [],
    extra: ["Frequently Asked Questions"],
  },
};

const SAMPLE_INPUT: GenerationInput = {
  keywords: ["medical spa SEO", "aesthetic practice marketing"],
  peopleAlsoSearchFor: ["how long for SEO results", "medical spa blog"],
  intent: ["informational"],
  competitorUrls: [],
  wordCountPreset: "standard",
};

const SAMPLE_RESULT: ResultState = {
  pipelineResult: SAMPLE_PIPELINE_RESULT,
  fallbackGenerated: null,
  input: SAMPLE_INPUT,
};

export default function BlogMakerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    generating,
    generated: contextGenerated,
    result: contextResult,
    error: generationError,
    progress: generationProgress,
    generationStartedAt,
    startGeneration,
    clearResult,
    clearError,
    phase,
    jobId,
    chunkOutputs,
    errorChunk,
    startResearchFetch,
    startBrief,
    startReviseBrief,
    startDraft,
    startValidate,
    retryFromChunk,
  } = useBlogGeneration();

  const [keywords, setKeywords] = useState<string[]>([]);
  const [peopleAlsoSearchFor, setPeopleAlsoSearchFor] = useState<string[]>([]);
  const [intent, setIntent] = useState<IntentType[]>([]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [wordCountPreset, setWordCountPreset] = useState<"auto" | "concise" | "standard" | "in_depth" | "custom">("auto");
  const [wordCountCustom, setWordCountCustom] = useState<number | "">("");
  const [sampleOutput, setSampleOutput] = useState<GeneratedContent | null>(null);
  const [sampleResult, setSampleResult] = useState<ResultState | null>(null);
  const [editing, setEditing] = useState<GeneratedContent | null>(null);
  const [contentView, setContentView] = useState<"preview" | "outline">("preview");
  const [loadingHistory, setLoadingHistory] = useState(false);
  /** Demo workflow: same as production (research → brief → draft → validate) with sample data, ~10s per stage. */
  const [demoRunning, setDemoRunning] = useState(false);
  type DemoStep = "research" | "select_done" | "fetch" | "research_done" | "brief" | "brief_done" | "draft" | "validate" | "complete";
  const [demoStep, setDemoStep] = useState<DemoStep>("research");
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoStartedAt, setDemoStartedAt] = useState<number | null>(null);
  const [demoElapsedTick, setDemoElapsedTick] = useState(0);
  const [demoChunkOutputs, setDemoChunkOutputs] = useState<{
    research: ResearchChunkResult | null;
    researchSerp: ResearchSerpResult | null;
    brief: BriefChunkResult | null;
  }>({ research: null, researchSerp: null, brief: null });
  /** Selected competitor URLs (max 3) for Select competitors step. */
  const [selectedSerpUrls, setSelectedSerpUrls] = useState<string[]>([]);
  /** Custom competitor URL (max 1) — user can add one custom URL instead of picking from SERP. */
  const [customCompetitorUrl, setCustomCompetitorUrl] = useState("");
  /** Jump-to stage for refining one screen without running full demo (no tokens). */
  const [jumpToStage, setJumpToStage] = useState<string>("");
  /** Step mode: editable outline (with originalIndex for briefOverrides). */
  const [editedOutline, setEditedOutline] = useState<Array<OutlineSectionForEditor & { originalIndex: number }>>([]);
  /** Target total words for outline; used by Redistribute and Revise Brief. */
  const [targetTotal, setTargetTotal] = useState<number>(0);
  /** Which step to show when in step mode (1=Select competitors, 2=Research summary, 3=Outline). null = show latest. */
  const [stepView, setStepView] = useState<number | null>(null);
  /** Cache SERP so "Back to previous section" from research summary can still show competitors (provider may clear researchSerp). */
  const lastResearchSerpRef = useRef<ResearchSerpResult | null>(null);

  /** Jump demo to a specific stage for refining that screen without running the full flow. */
  const jumpDemoTo = useCallback((stage: "select" | "outline" | "result") => {
    setStatus({ type: null, message: "" });
    clearResult();
    setSampleResult(null);
    setSampleOutput(null);
    setEditing(null);
    setSelectedSerpUrls([]);
    setCustomCompetitorUrl("");
    setKeywords(SAMPLE_INPUT.keywords);
    setPeopleAlsoSearchFor(SAMPLE_INPUT.peopleAlsoSearchFor);
    setIntent(SAMPLE_INPUT.intent as IntentType[]);
    setCompetitorUrls(SAMPLE_INPUT.competitorUrls);
    setWordCountPreset((SAMPLE_INPUT.wordCountPreset as "auto" | "concise" | "standard" | "in_depth" | "custom") ?? "auto");
    setWordCountCustom(SAMPLE_INPUT.wordCountCustom ?? "");
    lastResearchSerpRef.current = SAMPLE_RESEARCH_SERP;

    if (stage === "select") {
      setDemoRunning(false);
      setDemoStep("select_done");
      setDemoChunkOutputs({ research: null, researchSerp: SAMPLE_RESEARCH_SERP, brief: null });
      setDemoProgress(25);
      setDemoStartedAt(null);
      setSelectedSerpUrls(SAMPLE_RESEARCH_SERP.results.slice(0, 3).map((r) => r.url));
      setStepView(1);
    } else if (stage === "outline") {
      setDemoRunning(false);
      setDemoStep("brief_done");
      setDemoChunkOutputs({ research: SAMPLE_RESEARCH, researchSerp: SAMPLE_RESEARCH_SERP, brief: SAMPLE_BRIEF });
      const demoOutline = SAMPLE_BRIEF.outline.map((s, i) => ({ ...s, originalIndex: i }));
      setEditedOutline(demoOutline);
      setTargetTotal(demoOutline.reduce((acc, s) => acc + (s.targetWords || 150), 0));
      setDemoProgress(50);
      setDemoStartedAt(null);
      setStepView(2);
    } else {
      setDemoRunning(false);
      setDemoChunkOutputs({ research: null, researchSerp: null, brief: null });
      setStepView(null);
      setSampleResult(SAMPLE_RESULT);
      const initial = pipelineToGenerated(SAMPLE_PIPELINE_RESULT);
      setSampleOutput(initial);
      setEditing({ ...initial });
      setContentView("preview");
      setStrategyOpen(true);
      setSchemaOpen(false);
      setAuditListFilter("all");
      setQualityListFilter("all");
      setEeatListFilter("all");
      setEeatResult(null);
      setEeatError(null);
    }
    setJumpToStage("");
  }, [clearResult]);

  const result = contextResult ?? sampleResult;
  const generated = contextGenerated ?? sampleOutput;
  const pipelineResult = result?.pipelineResult ?? null;
  const defaultGenerationInput = useMemo(
    () => ({
      keywords: [],
      peopleAlsoSearchFor: [],
      intent: [],
      competitorUrls: [],
      wordCountPreset: "auto",
    }),
    []
  );
  const generationInput = result?.input ?? defaultGenerationInput;
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [metaCopyField, setMetaCopyField] = useState<"title" | "metaDescription" | "slug" | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(true);
  const [eeatLoading, setEeatLoading] = useState(false);
  const [eeatError, setEeatError] = useState<string | null>(null);
  const [eeatResult, setEeatResult] = useState<ContentAuditQualityResult | null>(null);
  const [auditListFilter, setAuditListFilter] = useState<"all" | "correct" | "issues">("all");
  const [qualityListFilter, setQualityListFilter] = useState<"all" | "correct" | "issues">("all");
  const [eeatListFilter, setEeatListFilter] = useState<"all" | "correct" | "issues">("all");
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    link?: string;
  }>({ type: null, message: "" });
  const autoRunEeatDoneRef = useRef(false);
  /** Track auto-retry count for E-E-A-T (max 1 retry). */
  const eeatAutoRetryRef = useRef(0);
  /** Last (title, content) we sent to E-E-A-T successfully; used to debounce re-run on meta/content edits */
  const lastEeatInputRef = useRef<{ title: string; content: string } | null>(null);
  const editingSnapshotRef = useRef<{ title: string; content: string }>({ title: "", content: "" });
  /** Track if we've auto-saved this generation to avoid duplicate saves */
  const autoSavedRef = useRef<string | null>(null);
  /** When we load from history or save, we get an id; use it for PATCH on subsequent saves */
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const currentHistoryIdRef = useRef<string | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [generateMetaLoading, setGenerateMetaLoading] = useState(false);
  /** Meta options from "Generate meta" — user picks one to apply */
  const [metaOptions, setMetaOptions] = useState<
    { title: string; metaDescription: string; suggestedSlug: string; audit: { score: number; publishable: boolean } }[] | null
  >(null);
  useEffect(() => {
    currentHistoryIdRef.current = currentHistoryId;
  }, [currentHistoryId]);
  useEffect(() => {
    if (generated) setEditing({ ...generated });
  }, [generated]);

  // Step mode: sync editable outline when brief is ready (stable deps so effect runs when outline content changes)
  const outlineKey = JSON.stringify(chunkOutputs.brief?.outline);
  useEffect(() => {
    const outline = chunkOutputs.brief?.outline;
    if (outline?.length) {
      const sections = outline.map((s, i) => ({ ...s, originalIndex: i }));
      setEditedOutline(sections);
      const sum = sections.reduce((acc, s) => acc + (s.targetWords || 150), 0);
      setTargetTotal(sum);
    }
  }, [chunkOutputs.brief, outlineKey]);

  // Pre-select first 3 SERP results in production when SERP first arrives (do not overwrite user's later changes)
  const serpPreSelectDoneRef = useRef(false);
  useEffect(() => {
    const serp = chunkOutputs.researchSerp;
    if (!serp?.results?.length || demoRunning) {
      if (!serp) serpPreSelectDoneRef.current = false;
      return;
    }
    if (serpPreSelectDoneRef.current) return;
    serpPreSelectDoneRef.current = true;
    setSelectedSerpUrls(serp.results.slice(0, 3).map((r) => r.url));
  }, [chunkOutputs.researchSerp, demoRunning]);

  // Pre-select first 3 in demo when Select competitors step is shown (same as production)
  const demoSerpPreSelectDoneRef = useRef(false);
  useEffect(() => {
    if (!demoRunning) {
      demoSerpPreSelectDoneRef.current = false;
      return;
    }
    const serp = demoChunkOutputs.researchSerp;
    if (!serp?.results?.length) {
      demoSerpPreSelectDoneRef.current = false;
      return;
    }
    if (demoSerpPreSelectDoneRef.current) return;
    demoSerpPreSelectDoneRef.current = true;
    setSelectedSerpUrls(serp.results.slice(0, 3).map((r) => r.url));
  }, [demoRunning, demoChunkOutputs.researchSerp]);

  // Tick every second while generating so total elapsed time updates
  const [elapsedTick, setElapsedTick] = useState(0);
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => setElapsedTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [generating]);

  // Demo: tick every second for elapsed display
  useEffect(() => {
    if (!demoRunning) return;
    const id = setInterval(() => setDemoElapsedTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [demoRunning]);

  // Demo workflow: run each stage ~10s like production; select_done/research_done/brief_done show real UI with sample data
  const demoStepDurationMs = 5_000;
  useEffect(() => {
    if (!demoRunning || demoStartedAt == null) return;
    const elapsed = Date.now() - demoStartedAt;
    if (demoStep === "research" && elapsed >= demoStepDurationMs) {
      setDemoChunkOutputs({ research: null, researchSerp: SAMPLE_RESEARCH_SERP, brief: null });
      setDemoStep("select_done");
      setDemoStartedAt(null);
      setDemoProgress(25);
      setSelectedSerpUrls(SAMPLE_RESEARCH_SERP.results.slice(0, 3).map((r) => r.url));
      return;
    }
    if (demoStep === "fetch" && elapsed >= demoStepDurationMs) {
      setDemoChunkOutputs((prev) => ({ research: SAMPLE_RESEARCH, researchSerp: prev.researchSerp ?? SAMPLE_RESEARCH_SERP, brief: null }));
      setDemoStep("brief");
      setDemoStartedAt(Date.now());
      setDemoProgress(25);
      return;
    }
    if (demoStep === "brief" && elapsed >= demoStepDurationMs) {
      setDemoChunkOutputs((prev) => ({ ...prev, brief: SAMPLE_BRIEF, research: prev.research ?? SAMPLE_RESEARCH, researchSerp: prev.researchSerp ?? SAMPLE_RESEARCH_SERP }));
      const demoOutline = SAMPLE_BRIEF.outline.map((s, i) => ({ ...s, originalIndex: i }));
      setEditedOutline(demoOutline);
      setTargetTotal(demoOutline.reduce((acc, s) => acc + (s.targetWords || 150), 0));
      setDemoStep("brief_done");
      setDemoStartedAt(null);
      setDemoProgress(50);
      return;
    }
    if (demoStep === "draft" && elapsed >= demoStepDurationMs) {
      setDemoStep("validate");
      setDemoStartedAt(Date.now());
      setDemoProgress(75);
      return;
    }
    if (demoStep === "validate" && elapsed >= demoStepDurationMs) {
      setDemoRunning(false);
      setDemoStartedAt(null);
      setDemoChunkOutputs({ research: null, researchSerp: null, brief: null });
      setDemoStep("complete");
      setSampleResult(SAMPLE_RESULT);
      const initial = pipelineToGenerated(SAMPLE_PIPELINE_RESULT);
      setSampleOutput(initial);
      setEditing({ ...initial });
      setContentView("preview");
      setStrategyOpen(true);
      setSchemaOpen(false);
      setAuditListFilter("all");
      setQualityListFilter("all");
      setEeatListFilter("all");
      setEeatResult(null);
      setEeatError(null);
      return;
    }
    // Progress bar during running steps
    if (demoStep === "research") setDemoProgress(Math.min(25, (elapsed / demoStepDurationMs) * 25));
    if (demoStep === "fetch") setDemoProgress(25);
    if (demoStep === "brief") setDemoProgress(25 + (elapsed / demoStepDurationMs) * 25);
    if (demoStep === "draft") setDemoProgress(50 + (elapsed / demoStepDurationMs) * 25);
    if (demoStep === "validate") setDemoProgress(75 + (elapsed / demoStepDurationMs) * 25);
  }, [demoRunning, demoStartedAt, demoStep, demoElapsedTick]);

  // Reset auto-save flag, history id, and SERP cache when starting new generation
  useEffect(() => {
    if (generating) {
      autoSavedRef.current = null;
      setCurrentHistoryId(null);
      currentHistoryIdRef.current = null;
      lastResearchSerpRef.current = null;
    }
  }, [generating]);

  // Scroll error banner into view when generation fails so user sees the message
  const generationErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (generationError && generationError !== generationErrorRef.current) {
      generationErrorRef.current = generationError;
      const el = document.getElementById("generation-error-banner");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (!generationError) {
      generationErrorRef.current = null;
    }
  }, [generationError]);

  /** Save current or partial content to history (appears on Recent). Returns id if created. */
  const saveToHistory = useCallback(
    async (payload: {
      title: string;
      metaDescription: string;
      outline: string[];
      content: string;
      suggestedSlug?: string;
      suggestedCategories?: string[];
      suggestedTags?: string[];
      focusKeyword?: string;
      generationTimeMs?: number;
    }) => {
      setSaveInProgress(true);
      setSaveStatus("idle");
      setSaveErrorMessage(null);
      const id = currentHistoryIdRef.current ?? null;
      const url = id ? `/api/blog/history?id=${encodeURIComponent(id)}` : "/api/blog/history";
      const method = id ? "PATCH" : "POST";
      const body = {
        title: payload.title,
        metaDescription: payload.metaDescription,
        outline: payload.outline,
        content: payload.content,
        suggestedSlug: payload.suggestedSlug ?? null,
        suggestedCategories: payload.suggestedCategories ?? null,
        suggestedTags: payload.suggestedTags ?? null,
        focusKeyword: payload.focusKeyword ?? null,
        ...(typeof payload.generationTimeMs === "number" && { generationTimeMs: payload.generationTimeMs }),
      };
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = (data as { error?: string }).error ?? `Save failed (${res.status})`;
          setSaveErrorMessage(errMsg);
          setSaveStatus("error");
          return null;
        }
        const newId = (data as { id?: string }).id ?? id;
        if (newId && !currentHistoryIdRef.current) {
          // Only update ref so future saves use PATCH; do NOT set currentHistoryId (state).
          // currentHistoryId is only set when loading from Recent — that keeps Generate meta
          // visible for newly generated content.
          currentHistoryIdRef.current = newId;
        }
        setSaveStatus("saved");
        return newId;
      } catch (err) {
        setSaveErrorMessage(err instanceof Error ? err.message : "Network error");
        setSaveStatus("error");
        return null;
      } finally {
        setSaveInProgress(false);
      }
    },
    []
  );

  // Auto-save to history when generation completes (once per content)
  useEffect(() => {
    if (!generated || !result || generating) return;
    if (sampleResult != null) return;
    const contentHash = `${generated.title}-${generated.content.slice(0, 100)}`;
    if (autoSavedRef.current === contentHash) return;
    const currentKw = keywords[0]?.trim();
    const genKw = generationInput.keywords[0]?.trim();
    const focusKeyword = (currentKw && currentKw.length > 0) ? currentKw : (genKw && genKw.length > 0 ? genKw : undefined);
    const generationTimeMs = pipelineResult?.generationTimeMs;
    saveToHistory({
      title: generated.title,
      metaDescription: generated.metaDescription,
      outline: generated.outline,
      content: generated.content,
      suggestedSlug: generated.suggestedSlug,
      suggestedCategories: generated.suggestedCategories,
      suggestedTags: generated.suggestedTags,
      focusKeyword,
      ...(typeof generationTimeMs === "number" && { generationTimeMs }),
    }).then((id) => {
      if (id) autoSavedRef.current = contentHash;
    });
  }, [generated, result, keywords, generationInput.keywords, pipelineResult?.generationTimeMs, generating, sampleResult, saveToHistory]);

  // Clear "Saved to Recent" message after a short delay
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  // Keep ref updated so debounced save always uses latest editing state
  const editingRef = useRef(editing);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  // Debounced auto-save when user edits (result stage): updates history so saved article stays on Recent
  const keywordsFirst = keywords[0];
  const genKwFirst = generationInput.keywords?.[0];
  const genTimeMs = pipelineResult?.generationTimeMs;
  useEffect(() => {
    if (!editing) return;
    // Skip for demo sample; allow when loaded from Recent (currentHistoryId set)
    if (sampleResult != null && !currentHistoryIdRef.current) return;
    const t = setTimeout(() => {
      const current = editingRef.current;
      if (!current) return;
      const currentKw = keywordsFirst?.trim();
      const genKw = genKwFirst?.trim();
      const focusKeyword = (currentKw && currentKw.length > 0) ? currentKw : (genKw && genKw.length > 0 ? genKw : undefined);
      saveToHistory({
        ...current,
        focusKeyword,
        ...(typeof genTimeMs === "number" && { generationTimeMs: genTimeMs }),
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [editing, editing?.title, editing?.metaDescription, editing?.content, editing?.outline, editing?.suggestedSlug, editing?.suggestedCategories, editing?.suggestedTags, keywords, keywordsFirst, generationInput.keywords, genKwFirst, genTimeMs, sampleResult, saveToHistory]);

  // Load history entry if historyId query param is present
  useEffect(() => {
    const historyId = searchParams.get("historyId");
    if (!historyId || loadingHistory || editing) return;

    setLoadingHistory(true);
    fetch(`/api/blog/history?id=${historyId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history entry");
        return res.json();
      })
      .then((data) => {
        // Convert history entry to GeneratedContent format
        const historyContent: GeneratedContent = {
          title: data.title,
          metaDescription: data.meta_description,
          outline: data.outline || [],
          content: data.content,
          suggestedSlug: data.suggested_slug || undefined,
          suggestedCategories: data.suggested_categories || undefined,
          suggestedTags: data.suggested_tags || undefined,
        };
        setEditing(historyContent);
        setSampleOutput(historyContent);
        if (data.id) {
          setCurrentHistoryId(data.id);
          currentHistoryIdRef.current = data.id;
        }
        // Set keywords state so primary keyword is available when saving
        if (data.focus_keyword) {
          setKeywords([data.focus_keyword]);
        }
        setSampleResult({
          pipelineResult: null,
          fallbackGenerated: historyContent,
          input: {
            keywords: data.focus_keyword ? [data.focus_keyword] : [],
            peopleAlsoSearchFor: [],
            intent: [],
            competitorUrls: [],
          },
        });
        // Remove historyId from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete("historyId");
        router.replace(`/dashboard/blog${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
      })
      .catch((err) => {
        console.error("Failed to load history entry:", err);
        setStatus({
          type: "error",
          message: "Failed to load previous generation. Please try again.",
        });
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [searchParams, loadingHistory, editing, router]);

  // Reset E-E-A-T auto-run flag and retry counter when pipeline result changes (e.g. new generation)
  useEffect(() => {
    if (!contextResult?.pipelineResult) return;
    autoRunEeatDoneRef.current = false;
    eeatAutoRetryRef.current = 0;
  }, [contextResult?.pipelineResult]);

  // Auto-run E-E-A-T once when generation completes (real API result only, not sample)
  useEffect(() => {
    if (
      !contextResult?.pipelineResult ||
      !editing?.content ||
      eeatLoading ||
      autoRunEeatDoneRef.current
    )
      return;
    autoRunEeatDoneRef.current = true;
    setEeatLoading(true);
    setEeatError(null);
    const title = editing.title;
    const content = editing.content;
    const doFetch = () =>
      fetch("/api/content-audit/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, content, html: content }),
      });
    doFetch()
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.results) {
          setEeatResult({ results: data.results });
          lastEeatInputRef.current = { title, content };
        } else {
          throw new Error(data.error || "No results");
        }
      })
      .catch((firstErr) => {
        // Auto-retry once on failure; do not mutate state until we give up
        if (eeatAutoRetryRef.current < 1) {
          eeatAutoRetryRef.current += 1;
          return new Promise<void>((resolve) => setTimeout(resolve, 2000))
            .then(() => doFetch())
            .then((res) => res.json())
            .then((data) => {
              if (data.ok && data.results) {
                setEeatResult({ results: data.results });
                lastEeatInputRef.current = { title, content };
              } else {
                setEeatError(data.error || "No results (after retry)");
              }
            })
            .catch((retryErr) => {
              setEeatError(retryErr instanceof Error ? retryErr.message : "Request failed (after retry)");
            });
        } else {
          setEeatError(firstErr instanceof Error ? firstErr.message : "Request failed");
        }
      })
      .finally(() => setEeatLoading(false));
  }, [contextResult?.pipelineResult, editing?.content, editing?.title, eeatLoading]);

  // Keep a snapshot of current editing for use in debounced E-E-A-T re-run
  useEffect(() => {
    if (editing) {
      editingSnapshotRef.current = { title: editing.title, content: editing.content };
    }
  }, [editing]);

  // Re-run E-E-A-T when user edits title or content (debounced); no LLM tokens, Python only
  useEffect(() => {
    if (!editing?.content || eeatLoading) return;
    const last = lastEeatInputRef.current;
    if (last == null) return; // only re-run after we've had a successful run
    if (editing.title === last.title && editing.content === last.content) return;
    const t = setTimeout(() => {
      const current = editingSnapshotRef.current;
      if (!current.content) return;
      if (lastEeatInputRef.current?.title === current.title && lastEeatInputRef.current?.content === current.content) return;
      setEeatLoading(true);
      setEeatError(null);
      fetch("/api/content-audit/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: current.title,
          content: current.content,
          html: current.content,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.results) {
            setEeatResult({ results: data.results });
            lastEeatInputRef.current = current;
          } else {
            setEeatError(data.error || "No results");
          }
        })
        .catch((e) => {
          setEeatError(e instanceof Error ? e.message : "Request failed");
        })
        .finally(() => setEeatLoading(false));
    }, 1000);
    return () => clearTimeout(t);
  }, [editing?.title, editing?.content, eeatLoading]);

  const seoAudit = useMemo(() => {
    if (!editing) return null;
    try {
      return auditArticle({
        title: editing.title,
        metaDescription: editing.metaDescription,
        content: editing.content,
        slug: editing.suggestedSlug,
        focusKeyword: generationInput.keywords[0] ?? keywords[0] ?? undefined,
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
  }, [editing, keywords, generationInput.keywords]);

  /** Check if E-E-A-T has critical failures that should warn on the publishable badge. */
  const eeatHasCriticalIssues = useMemo(() => {
    if (!eeatResult?.results) return false;
    const r = eeatResult.results;
    // Critical: experience score 0, very low data density, or repetitive sentence starts
    const expFail = !isEeatError(r.experience_signals) && r.experience_signals && r.experience_signals.score === 0;
    const lazyFail = !isEeatError(r.lazy_phrasing) && r.lazy_phrasing && r.lazy_phrasing.score >= 8;
    const sentenceFail = !isEeatError(r.sentence_starts) && r.sentence_starts && r.sentence_starts.is_repetitive;
    const dataDensityFail = !isEeatError(r.data_density) && r.data_density && r.data_density.density_score < 0.3;
    return Boolean(expFail || lazyFail || sentenceFail || dataDensityFail);
  }, [eeatResult]);

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

  async function handleGenerateMeta() {
    if (!editing?.content) return;
    const primaryKeyword = generationInput.keywords[0]?.trim() || keywords[0]?.trim();
    if (!primaryKeyword) {
      setStatus({ type: "error", message: "Primary keyword needed. Add a keyword in the input and try again." });
      return;
    }
    setGenerateMetaLoading(true);
    setStatus({ type: null, message: "" });
    setMetaOptions(null);
    try {
      if (sampleResult && !currentHistoryId) {
        setEditing((prev) =>
          prev
            ? {
                ...prev,
                title: SAMPLE_OUTPUT.title,
                metaDescription: SAMPLE_OUTPUT.metaDescription,
                suggestedSlug: SAMPLE_OUTPUT.suggestedSlug ?? prev.suggestedSlug,
              }
            : prev
        );
        setStatus({ type: "success", message: "Meta generated from draft" });
      } else {
        const content = editing.content;
        const res = await fetch("/api/blog/meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content,
            primaryKeyword,
            intent: generationInput.intent?.[0] || intent[0] || "informational",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus({ type: "error", message: data.error ?? "Meta generation failed" });
          return;
        }
        const opts = data.options;
        if (Array.isArray(opts) && opts.length >= 2) {
          setMetaOptions(opts);
          setStatus({ type: "success", message: "2 meta options generated. Pick one below." });
        } else {
          setStatus({ type: "error", message: "Unexpected response: expected 2 options" });
        }
      }
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Meta generation failed" });
    } finally {
      setGenerateMetaLoading(false);
    }
  }

  function handleUseMetaOption(opt: { title: string; metaDescription: string; suggestedSlug: string }) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            title: opt.title,
            metaDescription: opt.metaDescription,
            suggestedSlug: opt.suggestedSlug ?? prev.suggestedSlug,
          }
        : prev
    );
    setMetaOptions(null);
    setStatus({ type: "success", message: "Meta applied" });
  }

  async function handleRunEeatAudit() {
    if (!editing?.content) return;
    setEeatLoading(true);
    setEeatError(null);
    try {
      const res = await fetch("/api/content-audit/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editing.title,
          content: editing.content,
          html: editing.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEeatError(data.error || data.detail || "Audit failed");
        setEeatResult(null);
        return;
      }
      if (data.ok && data.results) {
        setEeatResult({ results: data.results });
        if (editing) lastEeatInputRef.current = { title: editing.title, content: editing.content };
      } else {
        setEeatError(data.error || "No results");
        setEeatResult(null);
      }
    } catch (e) {
      setEeatError(e instanceof Error ? e.message : "Request failed");
      setEeatResult(null);
    } finally {
      setEeatLoading(false);
    }
  }

  function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    startGeneration({
      keywords,
      peopleAlsoSearchFor,
      intent: intent.length > 0 ? intent : ["informational"],
      competitorUrls,
      wordCountPreset,
      ...(wordCountPreset === "custom" && typeof wordCountCustom === "number" && wordCountCustom >= 500 && wordCountCustom <= 6000 && { wordCountCustom }),
    });
    setContentView("preview");
  }

  // Cache SERP when we have it so "Back to previous section" from step 2 still has data for step 1
  const serpForStep1 = chunkOutputs.researchSerp ?? lastResearchSerpRef.current;
  if (chunkOutputs.researchSerp) lastResearchSerpRef.current = chunkOutputs.researchSerp;

  const inStepMode =
    (phase === "reviewing" && (chunkOutputs.researchSerp || chunkOutputs.research || chunkOutputs.brief)) ||
    (demoRunning && (demoChunkOutputs.researchSerp || demoChunkOutputs.research || demoChunkOutputs.brief)) ||
    // Allow jump-to-stage for redesign: demo chunks present without running
    (demoChunkOutputs.researchSerp || demoChunkOutputs.research || demoChunkOutputs.brief);
  const maxStep =
    chunkOutputs.brief || demoChunkOutputs.brief
      ? 2
      : chunkOutputs.researchSerp || demoChunkOutputs.researchSerp
        ? 1
        : 0;
  const displayStep =
    stepView !== null ? (stepView <= 0 ? 0 : Math.min(stepView, maxStep)) : maxStep;
  const hasDemoChunks = !!(demoChunkOutputs.brief || demoChunkOutputs.researchSerp);
  // Input sections (Keywords, People also search for, Search intent) + bottom bar only on initial input (step 0), not on competitor or outline steps
  const showInputSections = !inStepMode || displayStep === 0;
  // When going back to step 1, use cached SERP if provider cleared it
  const showStep1Content = inStepMode && (serpForStep1 || demoChunkOutputs.researchSerp) && displayStep === 1;

  /** 30s auto-advance: Competitors → Research & Brief → Output (with defaults) */
  const AUTO_ADVANCE_MS = 30_000;
  const autoAdvanceCompetitorsDoneRef = useRef(false);
  const autoAdvanceBriefDoneRef = useRef(false);
  const autoAdvanceOutputDoneRef = useRef(false);

  // Section 2.1: Competitors — after 30s, auto-advance to next (with default selection)
  useEffect(() => {
    if (!showStep1Content || generating || demoRunning) {
      autoAdvanceCompetitorsDoneRef.current = false;
      return;
    }
    const serp = serpForStep1 ?? demoChunkOutputs.researchSerp;
    const results = (serp as { results?: ResearchSerpItem[] })?.results ?? [];
    if (results.length === 0) return;
    const defaultUrls = results.slice(0, 3).map((r) => r.url);
    const urlsToUse = selectedSerpUrls.length > 0 ? selectedSerpUrls : defaultUrls;
    if (selectedSerpUrls.length === 0) {
      setSelectedSerpUrls(defaultUrls);
    }
    const t = setTimeout(() => {
      const isValidCustom = (() => {
        const u = customCompetitorUrl.trim();
        if (!u) return false;
        try {
          new URL(u);
          return u.startsWith("http");
        } catch {
          return false;
        }
      })();
      const urls = isValidCustom ? [...urlsToUse, customCompetitorUrl.trim()] : urlsToUse;
      if (urls.length === 0) return;
      autoAdvanceCompetitorsDoneRef.current = true;
      if (demoRunning && demoChunkOutputs.researchSerp) {
        setDemoStep("fetch");
        setDemoStartedAt(Date.now());
        setDemoElapsedTick(0);
      } else if (jobId && urls.length >= 1 && urls.length <= 3) {
        startResearchFetch(jobId, urls);
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [showStep1Content, generating, demoRunning, serpForStep1, demoChunkOutputs.researchSerp, selectedSerpUrls, customCompetitorUrl, jobId, startResearchFetch]);

  // Section 2.2: Research & Brief — after 30s, auto-advance to draft (with current outline)
  useEffect(() => {
    const inBriefStep = inStepMode && (chunkOutputs.brief || demoChunkOutputs.brief) && displayStep === 2;
    if (!inBriefStep || generating || demoRunning || editedOutline.length === 0) {
      autoAdvanceBriefDoneRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      autoAdvanceBriefDoneRef.current = true;
      if (demoRunning && demoChunkOutputs.brief) {
        setDemoStep("draft");
        setDemoStartedAt(Date.now());
        setDemoElapsedTick(0);
      } else if (jobId) {
        const N = chunkOutputs.brief?.outline?.length ?? 0;
        const existing = editedOutline.filter((e) => e.originalIndex >= 0);
        const added = editedOutline.filter((e) => e.originalIndex < 0);
        const removedSectionIndexes = Array.from({ length: N }, (_, i) => i).filter(
          (i) => !existing.some((e) => e.originalIndex === i)
        );
        const reorderedSectionIndexes = editedOutline.map((e) =>
          e.originalIndex >= 0 ? e.originalIndex : -1 - added.indexOf(e)
        );
        const sections: BriefOverridesForDraft["sections"] = new Array(N);
        existing.forEach((e) => {
          if (e.originalIndex >= 0 && e.originalIndex < N) {
            sections[e.originalIndex] = {
              heading: e.heading,
              level: e.level,
              targetWords: e.targetWords,
              topics: e.topics,
              geoNote: e.geoNote,
            };
          }
        });
        const addedSections: BriefOverridesForDraft["addedSections"] = added.length
          ? added.map((e) => ({
              heading: e.heading,
              level: e.level,
              targetWords: e.targetWords,
              topics: e.topics,
              geoNote: e.geoNote,
            }))
          : undefined;
        startDraft(jobId, {
          sections,
          reorderedSectionIndexes,
          removedSectionIndexes,
          ...(addedSections?.length ? { addedSections } : {}),
        });
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [inStepMode, chunkOutputs.brief, demoChunkOutputs.brief, displayStep, generating, demoRunning, editedOutline, jobId, startDraft]);

  // Section 2.3: Output — after 30s, auto-generate meta and save to Recent
  useEffect(() => {
    if (!editing?.content || generating || saveInProgress || generateMetaLoading) return;
    if (sampleResult != null) return; // Skip for demo sample
    const t = setTimeout(async () => {
      if (autoAdvanceOutputDoneRef.current) return;
      const current = editingRef.current;
      if (!current?.content) return;
      autoAdvanceOutputDoneRef.current = true;
      const primaryKeyword = generationInput.keywords[0]?.trim() || keywords[0]?.trim();
      if (!primaryKeyword) return;
      setGenerateMetaLoading(true);
      try {
        const res = await fetch("/api/blog/meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: current.content,
            primaryKeyword,
            intent: generationInput.intent?.[0] || intent[0] || "informational",
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.options) && data.options.length > 0) {
          const best = data.options.reduce((a: { audit?: { score?: number } }, b: { audit?: { score?: number } }) =>
            (b.audit?.score ?? 0) > (a.audit?.score ?? 0) ? b : a
          );
          setEditing((prev) =>
            prev
              ? {
                  ...prev,
                  title: best.title,
                  metaDescription: best.metaDescription,
                  suggestedSlug: best.suggestedSlug ?? prev.suggestedSlug,
                }
              : prev
          );
          const currentKw = keywords[0]?.trim();
          const genKw = generationInput.keywords[0]?.trim();
          const focusKeyword = (currentKw && currentKw.length > 0) ? currentKw : (genKw && genKw.length > 0 ? genKw : undefined);
          const upToDate = editingRef.current;
          if (!upToDate) return;
          await saveToHistory({
            ...upToDate,
            title: best.title,
            metaDescription: best.metaDescription,
            suggestedSlug: best.suggestedSlug ?? upToDate.suggestedSlug,
            focusKeyword,
            ...(typeof pipelineResult?.generationTimeMs === "number" && { generationTimeMs: pipelineResult.generationTimeMs }),
          });
          setStatus({ type: "success", message: "Meta generated and saved to Recent" });
        }
      } catch {
        // Silent fail for auto
      } finally {
        setGenerateMetaLoading(false);
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [editing, generating, saveInProgress, generateMetaLoading, sampleResult, keywords, generationInput, intent, pipelineResult, saveToHistory]);

  return (
    <div className="min-w-0 space-y-12 overflow-x-clip">
      {/* Header – title + subtitle left; Back or Start over right, vertically centred */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Content Writer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Search Central + Rank Math optimized content. Enter a keyword to generate.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {generated ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveInProgress}
              onClick={async () => {
                if (!editing) return;
                const currentKw = keywords[0]?.trim();
                const genKw = generationInput.keywords[0]?.trim();
                const focusKeyword = (currentKw && currentKw.length > 0) ? currentKw : (genKw && genKw.length > 0 ? genKw : undefined);
                await saveToHistory({
                  ...editing,
                  focusKeyword,
                  ...(typeof pipelineResult?.generationTimeMs === "number" && { generationTimeMs: pipelineResult.generationTimeMs }),
                });
              }}
              className="shrink-0 border-border text-muted-foreground hover:text-foreground"
            >
              {saveInProgress ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save
            </Button>
            {saveStatus === "saved" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved to Recent
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-destructive" title={saveErrorMessage ?? undefined}>
                {saveErrorMessage ?? "Save failed"}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = editing;
                const wasSample = sampleResult != null;
                clearResult();
                setSampleOutput(null);
                setSampleResult(null);
                setEditing(null);
                setCurrentHistoryId(null);
                currentHistoryIdRef.current = null;
                if (current && !wasSample && current.title !== SAMPLE_OUTPUT.title) {
                  const currentKw = keywords[0]?.trim();
                  const genKw = generationInput.keywords[0]?.trim();
                  const focusKeyword = (currentKw && currentKw.length > 0) ? currentKw : (genKw && genKw.length > 0 ? genKw : undefined);
                  const generationTimeMs = pipelineResult?.generationTimeMs;
                  fetch("/api/blog/history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...current,
                      focusKeyword,
                      ...(typeof generationTimeMs === "number" && { generationTimeMs }),
                    }),
                    credentials: "include",
                  }).catch(() => {});
                }
              }}
              className="shrink-0 border-border text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Start over
            </Button>
          </>
          ) : inStepMode && displayStep >= 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[13px] text-muted-foreground hover:text-foreground"
              onClick={() => setStepView(displayStep === 2 ? 1 : 0)}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {displayStep === 2 ? "Back to Select competitors" : "Back to input"}
            </Button>
          ) : null}
        </div>
      </header>

      {(status.type || generationError) && (
        <div
          id="generation-error-banner"
          role="alert"
          className={`flex items-start justify-between gap-4 rounded-2xl px-5 py-4 text-sm ${
            status.type === "success"
              ? "bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-red-50/90 text-red-800 dark:bg-red-950/50 dark:text-red-200"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p>
              {generationError?.includes("Job not found")
                ? "This job is no longer available. Start a new run with the same settings below."
                : displayError((status.message || generationError) ?? null) || "Something went wrong."}
            </p>
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
            {!status.type && generationError && errorChunk && (
              <div className="mt-3 flex flex-wrap gap-2">
                {generationError.includes("Job not found") ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      clearError();
                      retryFromChunk(errorChunk);
                    }}
                    className="rounded-full"
                  >
                    Start new run
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearError();
                        retryFromChunk(errorChunk);
                      }}
                      className="rounded-full border-red-300 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/40"
                    >
                      Retry from {errorChunk === "research" ? "Research" : errorChunk === "brief" ? "Analysis" : errorChunk === "draft" ? "Draft" : "Validation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearError();
                        startGeneration({
                          keywords,
                          peopleAlsoSearchFor,
                          intent: intent.length > 0 ? intent : ["informational"],
                          competitorUrls,
                          wordCountPreset,
                          ...(wordCountPreset === "custom" && typeof wordCountCustom === "number" && wordCountCustom >= 500 && wordCountCustom <= 6000 && { wordCountCustom }),
                        });
                      }}
                      className="rounded-full"
                    >
                      Retry from start
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus({ type: null, message: "", link: undefined });
              clearError();
            }}
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
          className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
            (generating && phase !== "reviewing") || (demoRunning && ["research", "fetch", "brief", "draft", "validate"].includes(demoStep))
              ? "h-[420px]"
              : ""
          }`}
        >
          <GenerationLoadingOverlay
            visible={(generating && phase !== "reviewing") || (demoRunning && ["research", "fetch", "brief", "draft", "validate"].includes(demoStep))}
            progress={generationProgress}
            generationStartedAt={generationStartedAt}
            chunkOutputs={chunkOutputs}
            demoRunning={demoRunning}
            demoStep={demoStep}
            demoProgress={demoProgress}
            demoStartedAt={demoStartedAt}
            demoElapsedTick={demoElapsedTick}
            demoChunkOutputs={demoChunkOutputs}
          />

          <div className="space-y-0">
            {/* Step mode: select competitors — 3x3 grid, improved card layout and UX */}
            {showStep1Content && (
              <section className="flex min-h-0 max-h-[100dvh] flex-col px-5 py-6 sm:px-8 sm:py-10">
                <div className="mx-auto flex w-full max-w-5xl flex-1 min-h-0 flex-col">
                  {/* Header */}
                  <header className="shrink-0 mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 items-center rounded-full bg-muted/50 px-2.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                          Step 1
                        </span>
                        <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                          Select competitors
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          clearResult();
                          setSelectedSerpUrls([]);
                          setCustomCompetitorUrl("");
                          if (demoRunning) {
                            setDemoRunning(false);
                            setDemoChunkOutputs({ research: null, researchSerp: null, brief: null });
                          }
                        }}
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-md hover:bg-muted/40 -mr-1"
                      >
                        Change keywords
                      </button>
                    </div>
                    <p className="mt-2.5 text-[15px] text-muted-foreground leading-relaxed whitespace-nowrap overflow-x-auto">
                      Pick up to 3 sources. We&apos;ll use them to build your outline and draft. Up to 1 can be a custom URL.
                    </p>
                  </header>

                  {/* Custom URL — 1 slot for user-provided URL (single line) */}
                  <div className="shrink-0 mb-5">
                    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <Plus className="h-4 w-4" />
                        </span>
                        <label htmlFor="custom-competitor-url" className="shrink-0 text-[13px] font-medium text-foreground whitespace-nowrap">
                          Custom URL (optional)
                        </label>
                        <Input
                          id="custom-competitor-url"
                          type="url"
                          value={customCompetitorUrl}
                          onChange={(e) => setCustomCompetitorUrl(e.target.value)}
                          placeholder="https://example.com/article"
                          className="h-10 flex-1 min-w-[200px] rounded-lg border-0 bg-muted/30 text-[14px] placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-orange-500/25 focus-visible:bg-muted/40 transition-colors"
                        />
                        {customCompetitorUrl.trim() && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                            onClick={() => setCustomCompetitorUrl("")}
                            aria-label="Clear custom URL"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid: 3x3, equal-height cards; pt avoids first row being clipped by scroll */}
                  <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-3 pb-4 content-start">
                    {((demoChunkOutputs.researchSerp ?? serpForStep1)!.results).slice(0, 9).map((item: ResearchSerpItem) => {
                        const selected = selectedSerpUrls.includes(item.url);
                        const hasValidCustom = (() => {
                          const t = customCompetitorUrl.trim();
                          if (!t) return false;
                          try {
                            const u = new URL(t);
                            return u.protocol === "http:" || u.protocol === "https:";
                          } catch {
                            return false;
                          }
                        })();
                        const serpMax = hasValidCustom ? 2 : 3;
                        const atMax = selectedSerpUrls.length >= serpMax && !selected;
                        const selectionIndex = selected ? selectedSerpUrls.indexOf(item.url) + 1 : 0;
                        let domain = "";
                        try {
                          domain = new URL(item.url).hostname;
                        } catch {
                          domain = item.url;
                        }
                        const toggleSelection = () => {
                          if (atMax) return;
                          setSelectedSerpUrls((prev) =>
                            selected ? prev.filter((u) => u !== item.url) : prev.length >= serpMax ? prev : [...prev, item.url]
                          );
                        };
                        return (
                          <li
                            key={item.url}
                            className={`group relative flex h-full min-h-[140px] flex-col rounded-xl border-2 text-left select-none ${
                              atMax ? "cursor-not-allowed border-border/30 bg-muted/10 opacity-60" : "cursor-pointer border-border/40 bg-card"
                            } ${selected ? "border-orange-500 bg-orange-500/5 shadow-md ring-2 ring-orange-500/20" : ""}`}
                          >
                            <button
                              type="button"
                              tabIndex={atMax ? -1 : 0}
                              aria-pressed={selected}
                              disabled={atMax}
                              title={atMax ? "Maximum 3 selected. Deselect one to change." : selected ? "Click to deselect" : "Click to select"}
                              onClick={toggleSelection}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleSelection();
                                }
                              }}
                              className="flex min-h-0 flex-1 flex-col rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                            {/* Top row: position + selection check */}
                            <div className="flex items-start justify-between gap-2 p-3 pb-1 sm:p-4 sm:pb-2">
                              <span
                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums transition-colors ${
                                  selected ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {selected ? selectionIndex : item.position}
                              </span>
                              {selected && (
                                <span className="rounded-full bg-orange-500 p-0.5 text-white" aria-hidden>
                                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </span>
                              )}
                            </div>

                            {/* Title: fills space, clamps to 2 lines */}
                            <div className="min-h-0 flex-1 px-3 pb-1 sm:px-4 sm:pb-2">
                              <p className="text-[13px] sm:text-[14px] font-medium text-foreground leading-snug line-clamp-2">
                                {item.title || "Untitled"}
                              </p>
                            </div>
                            </button>

                            {/* Bottom: domain + open link as badges (click opens URL only, does not toggle card) */}
                            <div className="flex flex-wrap items-center gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
                              {domain && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={item.url}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400/90 truncate max-w-full"
                                >
                                  {domain}
                                </a>
                              )}
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open: ${item.url}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] sm:text-xs font-medium text-muted-foreground shrink-0"
                              >
                                Open
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                              </a>
                            </div>
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={atMax}
                              onChange={() => {
                                setSelectedSerpUrls((prev) =>
                                  selected ? prev.filter((u) => u !== item.url) : prev.length >= serpMax ? prev : [...prev, item.url]
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="sr-only"
                              aria-label={selected ? `Deselect ${item.title || item.url}` : `Select ${item.title || item.url}`}
                            />
                          </li>
                        );
                    })}
                  </ul>

                  {/* Footer: sticky feel with clear CTA */}
                  <div className="shrink-0 flex flex-col gap-3 pt-6 mt-2">
                    {(() => {
                      const isValidCustom = (() => {
                        const t = customCompetitorUrl.trim();
                        if (!t) return false;
                        try {
                          const u = new URL(t);
                          return u.protocol === "http:" || u.protocol === "https:";
                        } catch {
                          return false;
                        }
                      })();
                      const totalSelected = selectedSerpUrls.length + (isValidCustom ? 1 : 0);
                      const urlsToFetch = isValidCustom ? [...selectedSerpUrls, customCompetitorUrl.trim()] : selectedSerpUrls;
                      return (
                        <>
                          {totalSelected === 0 && (
                            <p className="text-[13px] text-muted-foreground">
                              Select at least one source to continue.
                            </p>
                          )}
                          {totalSelected >= 3 && (
                            <p className="text-[13px] text-muted-foreground">
                              Maximum reached. Deselect a card or clear the custom URL to change.
                            </p>
                          )}
                          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                            <span className="text-[13px] text-muted-foreground">
                              <span className="font-semibold text-foreground tabular-nums">{totalSelected}</span>
                              <span> / 3 selected</span>
                              {isValidCustom && <span className="ml-1 text-muted-foreground/70">(1 custom)</span>}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saveInProgress}
                          onClick={async () => {
                            const title = keywords.length ? `${keywords.join(", ")} (in progress)` : "Draft (in progress)";
                            await saveToHistory({
                              title,
                              metaDescription: "",
                              outline: [],
                              content: "",
                              focusKeyword: keywords[0]?.trim() || undefined,
                            });
                          }}
                          className="h-11 rounded-full px-8 text-[15px] font-medium border-border"
                        >
                          {saveInProgress ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                          Save
                        </Button>
                        {saveStatus === "error" && (
                          <span className="text-xs text-destructive" title={saveErrorMessage ?? undefined}>
                            {saveErrorMessage ?? "Save failed"}
                          </span>
                        )}
                        <Button
                          type="button"
                          disabled={totalSelected === 0}
                          onClick={() => {
                            if (demoRunning && demoChunkOutputs.researchSerp) {
                              setDemoStep("fetch");
                              setDemoStartedAt(Date.now());
                              setDemoElapsedTick(0);
                              return;
                            }
                            setStepView(null);
                            if (jobId && urlsToFetch.length >= 1 && urlsToFetch.length <= 3) {
                              startResearchFetch(jobId, urlsToFetch);
                            }
                          }}
                          className="w-full sm:w-auto h-11 rounded-full bg-foreground px-8 text-[15px] font-medium text-background shadow-sm hover:bg-foreground/90 hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100"
                        >
                          {totalSelected === 0 ? "Select at least one" : "Continue"}
                        </Button>
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </section>
            )}

            {/* Step mode: outline editor (research & brief run in sequence; no separate research summary) */}
            {inStepMode && (chunkOutputs.brief || demoChunkOutputs.brief) && displayStep === 2 && (
              <section className="flex min-h-0 max-h-[100dvh] flex-col w-full bg-background">
                <div className="flex w-full flex-1 min-h-0 flex-col px-8 sm:px-12 lg:px-20 xl:px-24">
                  {/* Header — spacious, minimal, excellent */}
                  <header className="shrink-0 pt-14 pb-10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-[26px] font-semibold text-foreground tracking-tight leading-tight">
                          Article outline
                        </h2>
                        <p className="mt-3 text-[15px] text-muted-foreground leading-[1.6]">
                          Define your article structure. Edit headings, set word targets, use Redistribute or Revise Brief to adjust word count, then continue to draft.
                        </p>
                      </div>
                    </div>
                    {editedOutline.length > 0 && (
                      <div className="mt-10 flex flex-wrap items-center gap-6 w-full">
                        <div className="flex items-center gap-4">
                          <div className="flex items-baseline gap-2 rounded-full bg-muted/40 px-4 py-2">
                            <span className="tabular-nums text-[15px] font-semibold text-foreground">{editedOutline.length}</span>
                            <span className="text-[14px] text-muted-foreground">sections</span>
                          </div>
                          <div className="flex items-baseline gap-2 rounded-full bg-muted/40 px-4 py-2">
                            <span className="tabular-nums text-[15px] font-semibold text-foreground">
                              {editedOutline.reduce((sum, s) => sum + (s.targetWords || 0), 0)}
                            </span>
                            <span className="text-[14px] text-muted-foreground">words</span>
                          </div>
                        </div>
                        <div className="h-5 w-px bg-border/70" aria-hidden />
                        <div className="flex flex-wrap items-center gap-3">
                          <label htmlFor="target-total" className="text-[13px] text-muted-foreground sr-only sm:not-sr-only">Target words</label>
                          <Input
                            id="target-total"
                            type="number"
                            min={500}
                            max={6000}
                            step={100}
                            value={targetTotal}
                            onChange={(e) => setTargetTotal(Math.max(0, Number(e.target.value) || 0))}
                            className="h-10 w-28 rounded-xl border-0 bg-muted/30 px-4 text-[15px] font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-orange-500/25 focus-visible:bg-muted/40 transition-colors duration-200"
                            aria-label="Target word count"
                            placeholder="Target"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const sum = editedOutline.reduce((s, x) => s + (x.targetWords || 150), 0);
                              if (sum <= 0 || targetTotal <= 0) return;
                              setEditedOutline((prev) =>
                                prev.map((s) => ({
                                  ...s,
                                  targetWords: Math.max(50, Math.round((s.targetWords || 150) * (targetTotal / sum))),
                                }))
                              );
                            }}
                            className="h-10 rounded-full px-5 text-[14px] font-medium bg-muted/50 text-foreground hover:bg-muted border border-transparent hover:border-border/60 transition-all duration-200"
                          >
                            Redistribute
                          </button>
                          {(jobId || demoChunkOutputs.brief) && (
                            <button
                              type="button"
                              disabled={generating && phase !== "reviewing"}
                              onClick={() => {
                                const sum = editedOutline.reduce((s, x) => s + (x.targetWords || 150), 0);
                                const effectiveTarget = Math.max(
                                  500,
                                  Math.min(6000, (targetTotal >= 500 && targetTotal <= 6000 ? targetTotal : sum) || sum || 1500)
                                );
                                if (jobId) startReviseBrief(jobId, Math.round(effectiveTarget));
                                else if (demoChunkOutputs.brief && sum > 0) {
                                  setEditedOutline((prev) =>
                                    prev.map((s) => ({
                                      ...s,
                                      targetWords: Math.max(50, Math.round((s.targetWords || 150) * (effectiveTarget / sum))),
                                    }))
                                  );
                                }
                              }}
                              className="h-10 rounded-full px-5 text-[14px] font-medium bg-orange-500/15 text-orange-600 border border-orange-500/30 hover:bg-orange-500/25 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/25 transition-all duration-200 disabled:opacity-50"
                            >
                              Revise Brief
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const outline = (demoChunkOutputs.brief ?? chunkOutputs.brief)?.outline ?? [];
                            const sections = outline.map((s, i) => ({ ...s, originalIndex: i }));
                            setEditedOutline(sections);
                            setTargetTotal(sections.reduce((acc, s) => acc + (s.targetWords || 150), 0));
                          }}
                          className="ml-auto h-10 rounded-full px-5 text-[14px] font-medium bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all duration-200"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </header>

                  {/* Section list */}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 pb-12">
                    {editedOutline.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-28 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/25 mb-8 ring-1 ring-border/30">
                          <FileText className="h-10 w-10 text-muted-foreground/80" />
                        </div>
                        <h3 className="text-[19px] font-semibold text-foreground tracking-tight">No sections yet</h3>
                        <p className="mt-4 text-[15px] text-muted-foreground leading-[1.65]">
                          Add sections to build your article structure. Each section needs a heading and optional word target.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const nextId = -1 - editedOutline.filter((e) => e.originalIndex < 0).length;
                            setEditedOutline((prev) => [...prev, { heading: "New section", level: "h2" as const, targetWords: 150, topics: [], reason: "", originalIndex: nextId }]);
                          }}
                          className="outline-empty-btn mt-10 h-12 px-10 rounded-full bg-foreground text-background text-[15px] font-semibold"
                        >
                          Add first section
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                          {editedOutline.map((section, idx) => (
                            <article
                              key={`${section.originalIndex}-${idx}`}
                              className={`group outline-section-row flex items-start gap-5 py-5 px-5 -mx-4 rounded-xl first:pt-5 border border-border/30
                                ${section.level === "h3" ? "ml-4 pl-5 border-l-2 border-l-orange-500/50" : ""}`}
                            >
                              <div className="flex shrink-0 items-center gap-2 pt-1">
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums transition-colors duration-200
                                    ${section.level === "h2"
                                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                      : "bg-muted/50 text-muted-foreground"
                                    }`}
                                  aria-hidden
                                >
                                  {idx + 1}
                                </span>
                                <span className="cursor-grab active:cursor-grabbing p-2 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/40 transition-colors duration-200 -ml-1" aria-hidden title="Drag to reorder">
                                  <GripVertical className="h-4 w-4" />
                                </span>
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col gap-3.5">
                                <div className="flex flex-wrap items-center gap-3">
                                  <Input
                                    value={section.heading}
                                    onChange={(e) =>
                                      setEditedOutline((prev) =>
                                        prev.map((s, i) => (i === idx ? { ...s, heading: e.target.value } : s))
                                      )
                                    }
                                    className={`flex-1 min-w-[200px] h-10 rounded-lg border-0 bg-muted/30 px-4 text-[15px] font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-orange-500/25 focus-visible:bg-muted/40 hover:bg-muted/35 transition-all duration-200 ${
                                      section.level === "h3" ? "text-[14px] font-normal" : ""
                                    }`}
                                    placeholder="Section heading"
                                  />
                                  <select
                                    value={section.level}
                                    onChange={(e) =>
                                      setEditedOutline((prev) =>
                                        prev.map((s, i) => (i === idx ? { ...s, level: e.target.value as "h2" | "h3" } : s))
                                      )
                                    }
                                    className="h-10 w-[68px] rounded-lg border-0 bg-muted/30 px-3 text-[13px] font-medium text-muted-foreground focus:ring-2 focus:ring-orange-500/25 focus:outline-none hover:bg-muted/35 transition-all duration-200"
                                    aria-label="Heading level"
                                  >
                                    <option value="h2">H2</option>
                                    <option value="h3">H3</option>
                                  </select>
                                  <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 min-w-[88px] hover:bg-muted/35 transition-colors duration-200">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={2000}
                                      value={section.targetWords}
                                      onChange={(e) =>
                                        setEditedOutline((prev) =>
                                          prev.map((s, i) => (i === idx ? { ...s, targetWords: Number(e.target.value) || 0 } : s))
                                        )
                                      }
                                      className="h-7 w-14 border-0 bg-transparent p-0 text-center text-[13px] font-medium tabular-nums text-foreground focus-visible:ring-0"
                                    />
                                    <span className="text-[12px] text-muted-foreground">words</span>
                                  </div>
                                </div>
                                {section.topics?.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {section.topics.map((topic, ti) => (
                                      <span key={ti} className="inline-flex rounded-full bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={idx === 0} aria-label="Move up"
                                  onClick={() => setEditedOutline((prev) => {
                                    if (idx <= 0) return prev;
                                    const next = [...prev];
                                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                    return next;
                                  })}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={idx === editedOutline.length - 1} aria-label="Move down"
                                  onClick={() => setEditedOutline((prev) => {
                                    if (idx >= prev.length - 1) return prev;
                                    const next = [...prev];
                                    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                    return next;
                                  })}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-500/10" aria-label="Remove section"
                                  onClick={() => setEditedOutline((prev) => prev.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </article>
                          ))}
                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                const nextId = -1 - editedOutline.filter((e) => e.originalIndex < 0).length;
                                setEditedOutline((prev) => [...prev, { heading: "New section", level: "h2" as const, targetWords: 150, topics: [], reason: "", originalIndex: nextId }]);
                              }}
                              className="outline-add-btn flex w-full min-h-[80px] items-center justify-center gap-2.5 py-5 px-5 -mx-4 rounded-xl border border-dashed border-border/50 bg-muted/20 text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-orange-500/40 transition-all duration-200"
                            >
                              <Plus className="h-5 w-5" />
                              Add section
                            </button>
                          </div>
                        </div>
                    )}
                  </div>

                  {/* Footer */}
                  <footer className="shrink-0 flex flex-col gap-6 py-10 border-t border-border/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0 sm:justify-start">
                      {editedOutline.length > 0 ? (
                        <span className="inline-flex items-center gap-2.5 text-[15px]">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium text-foreground">{editedOutline.length} section{editedOutline.length === 1 ? "" : "s"} ready</span>
                        </span>
                      ) : (
                        <p className="text-[15px] text-muted-foreground">
                          Add at least one section to generate a draft.
                        </p>
                      )}
                      {saveStatus === "error" && (
                        <span className="text-xs text-destructive truncate" title={saveErrorMessage ?? undefined}>
                          {saveErrorMessage ?? "Save failed"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saveInProgress}
                        className="h-10 rounded-full px-6 text-[15px] font-medium border border-border bg-background hover:bg-muted/50 transition-all duration-200"
                        onClick={async () => {
                          const title = editedOutline.length > 0 ? editedOutline[0].heading : (keywords.length ? keywords.join(", ") : "Outline (in progress)");
                          await saveToHistory({
                            title,
                            metaDescription: "",
                            outline: editedOutline.map((s) => s.heading),
                            content: "",
                            focusKeyword: keywords[0]?.trim() || undefined,
                          });
                        }}
                      >
                        {saveInProgress ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                        Save
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditedOutline(
                            ((demoChunkOutputs.brief ?? chunkOutputs.brief)?.outline ?? []).map((s, i) => ({
                              ...s,
                              originalIndex: i,
                            }))
                          )
                        }
                        className="h-10 rounded-full px-6 text-[15px] font-medium bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-transparent hover:border-border/50 transition-all duration-200"
                      >
                        Reset to original
                      </button>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={editedOutline.length === 0}
                        className="h-12 rounded-full px-8 font-semibold text-[15px] bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        onClick={() => {
                          if (demoRunning && demoChunkOutputs.brief) {
                            setDemoStep("draft");
                            setDemoStartedAt(Date.now());
                            setDemoElapsedTick(0);
                            return;
                          }
                          if (!jobId) return;
                          const N = chunkOutputs.brief?.outline?.length ?? 0;
                          const existing = editedOutline.filter((e) => e.originalIndex >= 0);
                          const added = editedOutline.filter((e) => e.originalIndex < 0);
                          const removedSectionIndexes = Array.from({ length: N }, (_, i) => i).filter(
                            (i) => !existing.some((e) => e.originalIndex === i)
                          );
                          // Full order including added: use negative indices -1,-2,... for added so backend can merge and reorder
                          const reorderedSectionIndexes = editedOutline.map((e) =>
                            e.originalIndex >= 0 ? e.originalIndex : -1 - added.indexOf(e)
                          );
                          const sections: BriefOverridesForDraft["sections"] = new Array(N);
                          existing.forEach((e) => {
                            if (e.originalIndex >= 0 && e.originalIndex < N) {
                              sections[e.originalIndex] = {
                                heading: e.heading,
                                level: e.level,
                                targetWords: e.targetWords,
                                topics: e.topics,
                                geoNote: e.geoNote,
                              };
                            }
                          });
                          const addedSections: BriefOverridesForDraft["addedSections"] = added.length
                            ? added.map((e) => ({
                                heading: e.heading,
                                level: e.level,
                                targetWords: e.targetWords,
                                topics: e.topics,
                                geoNote: e.geoNote,
                              }))
                            : undefined;
                          startDraft(jobId, {
                            sections,
                            reorderedSectionIndexes,
                            removedSectionIndexes,
                            ...(addedSections?.length ? { addedSections } : {}),
                          });
                        }}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Generate Draft
                      </Button>
                    </div>
                  </footer>
                </div>
              </section>
            )}

            {/* Keywords, People also search for, Search intent, Word count — single flat section (hidden when reviewing or demo review) */}
            {showInputSections && (
            <section className="p-8 sm:p-10 space-y-10">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Keywords</h3>
                <p className="text-sm text-muted-foreground">Primary focus. First keyword is most important. Max 6.</p>
                <TagInput
                  tags={keywords}
                  onTagsChange={setKeywords}
                  placeholder="Add a keyword, press Enter"
                  maxTags={6}
                  disabled={generating || demoRunning}
                  className="min-h-11 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">People also search for</h3>
                <p className="text-sm text-muted-foreground">Related phrases for FAQs. Max 3.</p>
                <TagInput
                  tags={peopleAlsoSearchFor}
                  onTagsChange={setPeopleAlsoSearchFor}
                  placeholder="Add a phrase, press Enter"
                  maxTags={3}
                  disabled={generating || demoRunning}
                  className="min-h-11 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium text-foreground">Search intent</h3>
                <p className="text-sm text-muted-foreground">Select one or more to shape tone and structure.</p>
                <div className="flex flex-wrap gap-2">
                  {INTENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        intent.includes(opt.value)
                          ? "bg-orange-600 text-white dark:bg-orange-500"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${generating ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={intent.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) setIntent([...intent, opt.value]);
                          else setIntent(intent.filter((i) => i !== opt.value));
                        }}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

            </section>
            )}

            {/* Submit: Run demo, Generate. Sticky when refining demo so Refine dropdown stays visible. */}
            {showInputSections && (
            <section className={`flex flex-wrap items-center justify-between gap-6 border-t border-border/50 p-6 sm:p-8 ${hasDemoChunks ? "sticky bottom-0 z-10 bg-card" : ""}`}>
              {inStepMode && displayStep === 0 && (
                <div className="w-full mb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[13px] text-muted-foreground hover:text-foreground"
                    onClick={() => setStepView(1)}
                  >
                    Continue to Select competitors →
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={generating || demoRunning}
                  onClick={() => {
                    setStatus({ type: null, message: "" });
                    clearResult();
                    setSampleResult(null);
                    setSampleOutput(null);
                    setEditing(null);
                    setKeywords(SAMPLE_INPUT.keywords);
                    setPeopleAlsoSearchFor(SAMPLE_INPUT.peopleAlsoSearchFor);
                    setIntent(SAMPLE_INPUT.intent as IntentType[]);
                    setCompetitorUrls(SAMPLE_INPUT.competitorUrls);
                    setWordCountPreset((SAMPLE_INPUT.wordCountPreset as "auto" | "concise" | "standard" | "in_depth" | "custom") ?? "auto");
                    setWordCountCustom(SAMPLE_INPUT.wordCountCustom ?? "");
                    setDemoRunning(true);
                    setDemoStep("research");
                    setDemoChunkOutputs({ research: null, researchSerp: null, brief: null });
                    setDemoProgress(0);
                    setDemoStartedAt(Date.now());
                    setDemoElapsedTick(0);
                    setStepView(null);
                  }}
                  className="h-12 shrink-0 rounded-full border-2 border-border px-8 text-base font-medium text-foreground shadow-sm hover:bg-muted/60 hover:text-foreground"
                >
                  {demoRunning ? "Running demo…" : "Run demo (25s)"}
                </Button>
                <span className="text-sm text-muted-foreground">Refine:</span>
                <select
                  value={jumpToStage}
                  onChange={(e) => {
                    const v = e.target.value as "" | "select" | "outline" | "result";
                    if (v) {
                      jumpDemoTo(v);
                      setJumpToStage("");
                    }
                  }}
                  disabled={generating || demoRunning}
                  className="h-10 min-w-[160px] cursor-pointer rounded-lg border border-border bg-background px-4 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Jump to stage"
                >
                  <option value="">Jump to stage…</option>
                  <option value="select">Select competitors</option>
                  <option value="outline">Outline</option>
                  <option value="result">Result</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={generating || demoRunning || keywords.length === 0}
                className="h-12 shrink-0 rounded-full bg-orange-600 px-8 text-base font-medium text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/25 dark:bg-orange-500 dark:shadow-orange-400/20 dark:hover:bg-orange-600 disabled:shadow-none"
              >
                {(generating || demoRunning) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate post
                  </>
                )}
              </Button>
            </section>
            )}
          </div>
        </form>
      ) : editing ? (
        <div className="space-y-6">
          {sampleResult != null && !currentHistoryId && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-5 py-4 dark:border-orange-900/50 dark:bg-orange-950/30">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Demo
              </span>
              <p className="text-sm text-orange-900/90 dark:text-orange-100/90">
                This is sample output. Use <strong>Generate post</strong> with your keywords to create real content. Try the outline editor with Target total, Redistribute, and Revise Brief for word count control.
              </p>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-stretch">
            {/* Left: outline column. Right: content column. Both columns match height; content box ends where outline ends. */}
            <aside className="order-1 flex min-w-0 flex-col gap-4 lg:order-none">
              {/* SEO Audit — Google Search Central + Rank Math compliance */}
              {editing && seoAudit && (
                <div className="flex h-[440px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Google &amp; Rank Math Audit</h3>
                      <a
                        href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title="Google Search Central — Helpful Content"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
                      <span className="text-[11px] text-muted-foreground">
                        {seoAudit.summary.pass} pass · {seoAudit.summary.warn} warn · {seoAudit.summary.fail} fail
                      </span>
                      {seoAudit.publishable && !eeatHasCriticalIssues ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Publishable
                        </span>
                      ) : seoAudit.publishable && eeatHasCriticalIssues ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          E-E-A-T review needed
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          Below {MIN_PUBLISH_SCORE}% — fix before publishing
                        </span>
                      )}
                    </div>
                    <div className="flex rounded-lg bg-muted/60 p-0.5">
                      {(["all", "correct", "issues"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setAuditListFilter(f)}
                          className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            auditListFilter === f
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f === "all" ? "All" : f === "correct" ? "Correct" : "Issues"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(() => {
                      const SEO_CATEGORY_ORDER = ["google", "rankmath", "editorial", "other"] as const;
                      const SEO_CATEGORY_LABELS: Record<string, string> = {
                        google: "Google",
                        rankmath: "Rank Math",
                        editorial: "Writing Quality",
                        other: "Others",
                      };
                      const getCategory = (item: AuditItem): string =>
                        item.source === "google" || item.source === "rankmath" || item.source === "editorial"
                          ? item.source
                          : "other";
                      const filtered = [...seoAudit.items].filter((item) => {
                        if (auditListFilter === "correct") return item.severity === "pass";
                        if (auditListFilter === "issues") return item.severity === "warn" || item.severity === "fail";
                        return true;
                      });
                      const byCategory = new Map<string, AuditItem[]>();
                      for (const item of filtered) {
                        const cat = getCategory(item);
                        if (!byCategory.has(cat)) byCategory.set(cat, []);
                        byCategory.get(cat)!.push(item);
                      }
                      return (
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pr-5">
                          {SEO_CATEGORY_ORDER.filter((cat) => (byCategory.get(cat)?.length ?? 0) > 0).map((cat) => (
                            <div key={cat} className="space-y-1.5">
                              <p className="sticky top-0 z-20 -mt-px bg-card py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {SEO_CATEGORY_LABELS[cat]}
                              </p>
                              <ul className="space-y-3">
                                {byCategory.get(cat)!.map((item, idx) => {
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
                                  const isIssue = item.severity === "warn" || item.severity === "fail";
                                  const isAllView = auditListFilter === "all";
                                  const showCorrective = auditListFilter === "issues" && isIssue;
                                  const allViewIssueOnly = isAllView && isIssue;
                                  return (
                                    <li
                                      key={`${cat}-${item.id}-${idx}`}
                                      className={`flex gap-3 rounded-xl px-3 py-2.5 ${
                                        isIssue
                                          ? "bg-amber-50/60 dark:bg-amber-950/20"
                                          : "bg-muted/30 dark:bg-muted/20"
                                      }`}
                                    >
                                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground">{item.label}</p>
                                        {!allViewIssueOnly && (
                                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{item.message}</p>
                                        )}
                                        {showCorrective && (item.guideline || item.message) && (
                                          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                                            <span className="font-medium text-amber-900 dark:text-amber-100">What to correct: </span>
                                            {item.guideline ?? item.message}
                                          </p>
                                        )}
                                        {!showCorrective && !isAllView && item.guideline && (
                                          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{item.guideline}</p>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                </div>
              )}


              {/* Quality checks — fact verification + FAQ compliance */}
              {(pipelineResult?.faqEnforcement || pipelineResult?.factCheck) && (
                <div className="flex h-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-foreground">Content Integrity</h3>
                    <p className="text-[11px] text-muted-foreground">FAQ compliance and fact verification against source data.</p>
                    <div className="flex rounded-lg bg-muted/60 p-0.5">
                      {(["all", "correct", "issues"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setQualityListFilter(f)}
                          className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            qualityListFilter === f
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f === "all" ? "All" : f === "correct" ? "Correct" : "Issues"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pr-5">
                    {pipelineResult.faqEnforcement && (qualityListFilter === "all" ||
                      (qualityListFilter === "correct" && pipelineResult.faqEnforcement.passed) ||
                      (qualityListFilter === "issues" && !pipelineResult.faqEnforcement.passed)) && (
                      <div
                        className={`flex gap-3 rounded-xl px-3 py-2.5 ${
                          !pipelineResult.faqEnforcement.passed ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-muted/30 dark:bg-muted/20"
                        }`}
                      >
                        {pipelineResult.faqEnforcement.passed ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">FAQ character limit (300)</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {pipelineResult.faqEnforcement.passed ? "All answers within limit." : `${pipelineResult.faqEnforcement.violations.length} answer(s) truncated.`}
                          </p>
                          {qualityListFilter === "issues" && pipelineResult.faqEnforcement.violations.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground list-disc list-inside">
                              {pipelineResult.faqEnforcement.violations.map((v, i) => (
                                <li key={i}>{v.question?.slice(0, 50)}… ({v.charCount} chars)</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                    {pipelineResult.factCheck && (qualityListFilter === "all" ||
                      (qualityListFilter === "correct" && pipelineResult.factCheck.verified) ||
                      (qualityListFilter === "issues" && !pipelineResult.factCheck.verified)) && (
                      <div
                        className={`flex gap-3 rounded-xl px-3 py-2.5 ${
                          !pipelineResult.factCheck.verified ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-muted/30 dark:bg-muted/20"
                        }`}
                      >
                        {pipelineResult.factCheck.verified ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">Fact check vs sources</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {pipelineResult.factCheck.verified ? "Verified against sources." : `${pipelineResult.factCheck.hallucinations.length} potential hallucination(s).`}
                          </p>
                          {qualityListFilter === "issues" && pipelineResult.factCheck.hallucinations.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground list-disc list-inside">
                              {pipelineResult.factCheck.hallucinations.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          )}
                          {qualityListFilter === "issues" && (pipelineResult.factCheck.skippedRhetorical?.length ?? 0) > 0 && (
                            <p className="mt-1 text-[10px] text-muted-foreground">Skipped (rhetorical): {pipelineResult.factCheck.skippedRhetorical!.slice(0, 3).join(", ")}{pipelineResult.factCheck.skippedRhetorical!.length > 3 ? "…" : ""}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {pipelineResult.hallucinationFixes && pipelineResult.hallucinationFixes.length > 0 && (
                      <div className="flex gap-3 rounded-xl px-3 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/20">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">Auto-fixes applied</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {pipelineResult.hallucinationFixes.length} hallucination(s) were rewritten or replaced with verified facts.
                          </p>
                          <ul className="mt-1.5 space-y-1.5 text-[11px] text-muted-foreground">
                            {pipelineResult.hallucinationFixes.map((fix, i) => (
                              <li key={i} className="rounded-lg bg-background/60 p-2">
                                <span className="font-medium text-foreground">{fix.reason}</span>
                                {fix.replacedWithVerifiedFact && (
                                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">(used verified fact)</span>
                                )}
                                <p className="mt-0.5 line-clamp-2">“{fix.originalText}” → “{fix.replacement}”</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* E-E-A-T & Content Quality — Google quality rater guidelines */}
              {editing?.content && (
                <div
                  className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
                    eeatResult?.results || eeatError || eeatLoading ? "h-[440px]" : "h-[200px]"
                  }`}
                >
                  <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-foreground">E-E-A-T &amp; Content Quality</h3>
                    <p className="text-[11px] text-muted-foreground">Google quality rater signals: experience, expertise, readability, structure.</p>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 rounded-lg bg-muted/60 p-0.5">
                        {(["all", "correct", "issues"] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setEeatListFilter(f)}
                            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                              eeatListFilter === f
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {f === "all" ? "All" : f === "correct" ? "Correct" : "Issues"}
                          </button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={eeatLoading}
                        onClick={handleRunEeatAudit}
                        className="h-8 shrink-0 rounded-lg px-3 text-[11px] font-medium"
                      >
                        {eeatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Run audit"}
                      </Button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pr-5">
                    {eeatError && (
                      <div className="space-y-1">
                        <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:bg-red-950/50 dark:text-red-200">
                          {eeatError}
                        </p>
                        {eeatError.includes("not available") && (
                          <p className="text-[11px] text-muted-foreground">
                            See <code className="rounded bg-muted px-1">tools/content_audit/README.md</code> for setup.
                          </p>
                        )}
                      </div>
                    )}
                    {eeatResult?.results && (
                      <EeatResultsDisplay results={eeatResult.results} open={eeatListFilter === "issues"} filter={eeatListFilter} />
                    )}
                    {!eeatResult && !eeatError && !eeatLoading && (
                      <p className="text-[11px] text-muted-foreground">Click &quot;Run audit&quot; to analyze this article against Google quality rater guidelines.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Strategy (from brief) + Outline drift */}
              {(pipelineResult?.briefSummary || pipelineResult?.outlineDrift) && (
                <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => setStrategyOpen((o) => !o)}
                    className="flex items-center justify-between border-b border-border px-4 py-3 text-left hover:bg-muted/30"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Strategy & outline</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {pipelineResult.outlineDrift?.passed ? "Outline matches brief." : pipelineResult.outlineDrift?.missing?.length
                          ? `${pipelineResult.outlineDrift.missing.length} expected H2(s) missing.`
                          : "Differentiation and outline check."}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${strategyOpen ? "rotate-180" : ""}`} />
                  </button>
                  {strategyOpen && (
                    <div className="min-h-0 space-y-3 overflow-y-auto p-4 pr-5">
                      {pipelineResult.briefSummary && (
                        <>
                          {pipelineResult.briefSummary.similaritySummary && (
                            <div>
                              <p className="text-[11px] font-medium text-foreground">What top results cover</p>
                              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{pipelineResult.briefSummary.similaritySummary}</p>
                            </div>
                          )}
                          {(pipelineResult.briefSummary.extraValueThemes?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Extra value to include</p>
                              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-muted-foreground">
                                {pipelineResult.briefSummary.extraValueThemes!.map((t, i) => (
                                  <li key={i}>{t}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {pipelineResult.briefSummary.freshnessNote && (
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Freshness</p>
                              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{pipelineResult.briefSummary.freshnessNote}</p>
                            </div>
                          )}
                        </>
                      )}
                      {pipelineResult.outlineDrift && !pipelineResult.outlineDrift.passed && pipelineResult.outlineDrift.missing.length > 0 && (
                        <div className="rounded-lg bg-amber-50/60 px-3 py-2 dark:bg-amber-950/20">
                          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200">Outline drift (non-blocking)</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">Expected H2(s) not in draft: {pipelineResult.outlineDrift.missing.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Source URLs (pipeline v3) */}
              {pipelineResult?.sourceUrls && pipelineResult.sourceUrls.length > 0 && (
                <div className="flex h-[180px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-foreground">Sources used in this article</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">URLs referenced during research and fact-check.</p>
                  </div>
                  <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4 pr-5">
                    {pipelineResult.sourceUrls.slice(0, 20).map((url, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 truncate text-[11px] text-orange-600 underline decoration-orange-300 hover:decoration-orange-500 dark:text-orange-400 dark:decoration-orange-600 dark:hover:decoration-orange-400"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                    {pipelineResult.sourceUrls.length > 20 && (
                      <li className="py-1 text-[11px] text-muted-foreground">+{pipelineResult.sourceUrls.length - 20} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Schema markup preview (pipeline v3) */}
              {pipelineResult?.schemaMarkup && (
                <div className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Schema markup</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">JSON-LD for search results. Injected by CMS on publish.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSchemaOpen((o) => !o)}
                      className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted"
                    >
                      {schemaOpen ? "Hide" : "Show"} JSON
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                        <Check className="h-3.5 w-3.5" /> Article
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${pipelineResult.schemaMarkup.faq ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "bg-muted/70 text-muted-foreground"}`}>
                        {pipelineResult.schemaMarkup.faq ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        FAQ
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                        <Check className="h-3.5 w-3.5" /> Breadcrumb
                      </span>
                      {pipelineResult.schemaMarkup.faqSchemaNote && (
                        <span className="text-[10px] text-muted-foreground" title={pipelineResult.schemaMarkup.faqSchemaNote}>
                          (i)
                        </span>
                      )}
                    </div>
                    {schemaOpen && (
                      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                        <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-[10px] leading-relaxed text-foreground">
                          {JSON.stringify(
                            {
                              article: pipelineResult.schemaMarkup.article,
                              faq: pipelineResult.schemaMarkup.faq,
                              breadcrumb: pipelineResult.schemaMarkup.breadcrumb,
                              faqSchemaNote: pipelineResult.schemaMarkup.faqSchemaNote,
                            },
                            null,
                            2
                          )}
                        </pre>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8 gap-1.5 rounded-lg text-xs"
                          onClick={() => {
                            const sm = pipelineResult.schemaMarkup;
                            if (!sm) return;
                            const json = JSON.stringify(
                              {
                                "@context": "https://schema.org",
                                ...sm.article,
                                ...(sm.faq && { faqPage: sm.faq }),
                                ...(sm.breadcrumb && { breadcrumb: sm.breadcrumb }),
                              },
                              null,
                              2
                            );
                            navigator.clipboard.writeText(json).then(() => setStatus({ type: "success", message: "Schema copied" }));
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy schema
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="shrink-0 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                Images, image alts, and external/internal links are added in your CMS when you publish.
              </p>
            </aside>

            {/* Right: Content panel – absolute wrapper so row height = outline only; content box ends exactly where outline ends */}
            <div className="order-2 relative min-h-0 min-w-0 lg:order-none">
              <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* Meta – editable title, meta description, slug */}
              <div className="shrink-0 border-t border-border/60 px-4 pt-4 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Meta</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Edit and copy title, meta description, and URL slug.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={generateMetaLoading || !editing?.content}
                    onClick={handleGenerateMeta}
                    className="h-8 shrink-0 rounded-lg border-orange-300 bg-orange-50 px-3 text-[11px] font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/50"
                  >
                    {generateMetaLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Generate meta
                  </Button>
                </div>
                {metaOptions && metaOptions.length >= 2 ? (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {metaOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-2 rounded-xl border border-orange-200 px-3 py-2.5 dark:border-orange-800/50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">Option {idx + 1}</span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                opt.audit.publishable
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                                  : opt.audit.score >= 60
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                              }`}
                            >
                              {opt.audit.score}%
                            </span>
                          </div>
                          <p className="text-xs font-medium leading-tight line-clamp-1">{opt.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">{opt.metaDescription}</p>
                          <p className="text-[10px] font-mono text-muted-foreground/80 truncate">{opt.suggestedSlug}</p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUseMetaOption(opt)}
                            className="h-8 w-full rounded-lg bg-orange-600 px-2 text-xs hover:bg-orange-700"
                          >
                            Use this option
                          </Button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMetaOptions(null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                      {/* Title */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="edit-title" className="text-xs font-medium text-foreground">Title</label>
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                              editing.title.length > SEO.TITLE_MAX_CHARS
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                : "text-muted-foreground"
                            }`}
                          >
                            {editing.title.length}/{SEO.TITLE_MAX_CHARS}
                          </span>
                        </div>
                        <div className="relative">
                          <Input
                            id="edit-title"
                            value={editing.title}
                            onChange={(e) => setEditing((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                            className="h-10 rounded-xl border-border bg-muted/20 pr-10 text-sm focus:bg-background"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMetaField("title")}
                            className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg p-0 text-muted-foreground hover:text-foreground"
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

                      {/* URL slug – same row as Title on md */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="edit-slug" className="text-xs font-medium text-foreground">URL slug</label>
                          <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                            {(editing.suggestedSlug ?? "").length}/75
                          </span>
                        </div>
                        <div className="relative">
                          <Input
                            id="edit-slug"
                            value={editing.suggestedSlug ?? ""}
                            onChange={(e) => setEditing((prev) => (prev ? { ...prev, suggestedSlug: e.target.value } : null))}
                            className="h-10 rounded-xl border-border bg-muted/20 font-mono text-sm pr-10 focus:bg-background"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMetaField("slug")}
                            className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg p-0 text-muted-foreground hover:text-foreground"
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

                      {/* Meta description – full width */}
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="edit-meta" className="text-xs font-medium text-foreground">Meta description</label>
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                              editing.metaDescription.length > SEO.META_DESCRIPTION_MAX_CHARS
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                : "text-muted-foreground"
                            }`}
                          >
                            {editing.metaDescription.length}/{SEO.META_DESCRIPTION_MAX_CHARS}
                          </span>
                        </div>
                        <div className="relative">
                          <Textarea
                            id="edit-meta"
                            value={editing.metaDescription}
                            onChange={(e) => setEditing((prev) => (prev ? { ...prev, metaDescription: e.target.value } : null))}
                            rows={2}
                            className="min-h-[3.25rem] resize-y rounded-xl border-border bg-muted/20 pr-10 text-sm focus:bg-background"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMetaField("metaDescription")}
                            className="absolute right-2 top-2.5 h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground"
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
                    </div>
                </div>
                )}
              </div>

              {/* Content – tabs + preview/outline box */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border/60 px-4 py-4">
                  <div className="shrink-0 flex flex-col gap-3 pb-3">
                    <h3 className="text-sm font-semibold text-foreground">Content</h3>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex rounded-lg bg-muted/60 p-0.5" role="group" aria-label="View mode">
                        {[
                          { id: "preview" as const, label: "Preview", icon: Eye },
                          { id: "outline" as const, label: "Outline", icon: FileText },
                        ].map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setContentView(id)}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
                              contentView === id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (pipelineResult) {
                              setEditing(pipelineToGenerated(pipelineResult));
                            } else {
                              setEditing({ ...generated! });
                            }
                          }}
                          className="h-8 rounded-lg border-border bg-background px-3 text-[11px] font-medium"
                        >
                          Reset edits
                        </Button>
                        {jobId && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={generating || demoRunning}
                            onClick={() => startValidate(jobId)}
                            className="h-8 rounded-lg px-3 text-[11px] font-medium"
                          >
                            Re-run validation
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={handleCopyForWordPress}
                          className="h-8 rounded-lg bg-orange-600 px-3 text-[11px] font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          {copyFeedback ? "Copied!" : "Copy for WordPress"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[280px] flex-1 overflow-y-auto p-4">
                    {contentView === "preview" && (
                      <div className="rounded-xl border border-border bg-background">
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none px-5 py-4 text-foreground"
                          dangerouslySetInnerHTML={{ __html: editing.content || "<p>(No content)</p>" }}
                        />
                      </div>
                    )}
                    {contentView === "outline" && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground mb-3">Edit section headings as needed.</p>
                        {editing.outline.map((item, index) => (
                          <div key={index} className="flex gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm hover:border-border/80 transition-colors">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-xs font-bold tabular-nums text-orange-600 dark:text-orange-400">
                              {index + 1}
                            </span>
                            <Textarea
                              value={item}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditing((prev) => {
                                  if (!prev?.outline) return prev;
                                  const newOutline = [...prev.outline];
                                  newOutline[index] = value;
                                  return { ...prev, outline: newOutline };
                                });
                              }}
                              rows={2}
                              className="min-h-[2.25rem] flex-1 resize-y rounded-lg border-border bg-background text-sm leading-snug focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                        ))}
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
