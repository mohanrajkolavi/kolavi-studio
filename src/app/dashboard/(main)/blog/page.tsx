"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/dashboard/TagInput";
import { useBlogGeneration } from "@/components/dashboard/BlogGenerationProvider";
import { Loader2, Sparkles, ArrowLeft, X, Copy, FileText, Eye, Check, CheckCircle2, AlertTriangle, XCircle, ExternalLink, ChevronDown } from "lucide-react";
import { SEO } from "@/lib/constants";
import { auditArticle, MIN_PUBLISH_SCORE } from "@/lib/seo/article-audit";
import type { AuditItem } from "@/lib/seo/article-audit";
import type { GeneratedContent, GenerationInput, PipelineResult } from "@/lib/blog/generation-types";
import { pipelineToGenerated } from "@/lib/blog/generation-types";

/** Result state shape (matches BlogGenerationProvider). */
type ResultState = {
  pipelineResult: PipelineResult | null;
  fallbackGenerated: GeneratedContent | null;
  selectedTitleIndex: number;
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
 * Sample data for the Blog Maker output UI. Use "View sample output" to load this
 * (and SAMPLE_PIPELINE_RESULT) so you can edit the UI or fix issues without running
 * real generation — avoids wasting API tokens.
 * Pairs with sample keywords (e.g. "medical spa SEO").
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

/** Full pipeline sample for UI work without tokens: 4 titles/meta (source-based), audit, schema, quality checks. */
const SAMPLE_PIPELINE_RESULT: PipelineResult = {
  article: {
    content: SAMPLE_OUTPUT.content,
    outline: SAMPLE_OUTPUT.outline,
    suggestedSlug: SAMPLE_OUTPUT.suggestedSlug ?? "seo-tips-medical-spas-2026",
    suggestedCategories: SAMPLE_OUTPUT.suggestedCategories ?? [],
    suggestedTags: SAMPLE_OUTPUT.suggestedTags ?? [],
  },
  titleMetaVariants: [
    {
      approach: "Google Search Central — Accurate, descriptive title; meta as snippet; clean URL",
      title: "Medical Spa SEO: A Guide to Search Best Practices (2026)",
      metaDescription:
        "How to create helpful, reliable content for medical spas that meets Google's guidelines. Covers titles, snippets, and user intent.",
    },
    {
      approach: "Rank Math — Focus keyword in title; 50–60 char title; 120–160 char meta; keyword in slug",
      title: "Medical Spa SEO Tips 2026: 7 Ways to Rank Higher",
      metaDescription:
        "Medical spa SEO guide: keyword research, local SEO, on-page optimization, and technical tips to rank and get more clients in 2026.",
    },
    {
      approach: "Ahrefs — CTR-focused title; benefit-led meta; short, readable slug",
      title: "7 Medical Spa SEO Tips That Actually Get You Clients",
      metaDescription:
        "Stop guessing. Use these 7 SEO tactics to get more bookings—Google Business Profile, content, and technical fixes that move the needle.",
    },
    {
      approach: "Semrush / Backlinko — Power words, number, specificity; CTA in meta; keyword-rich slug",
      title: "7 Proven Medical Spa SEO Tips to Dominate Local Search in 2026",
      metaDescription:
        "Discover the exact SEO strategies top medical spas use. Step-by-step: GBP, keywords, content, and technical SEO. Start ranking today.",
    },
  ],
  selectedTitleMeta: null,
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
      { id: "rm-content-length", severity: "pass", label: "Rank Math: Content length", message: "1847 words. 2500+ = Rank Math 100%. Google: quality over quantity—no need to pad.", level: 3, source: "rankmath" },
      { id: "rm-title-position", severity: "pass", label: "Rank Math: Keyword position in title", message: "Primary keyword in first 50% of title.", level: 3, source: "rankmath" },
      { id: "rm-number-in-title", severity: "pass", label: "Rank Math: Number in title", message: "Title contains a number.", level: 3, source: "rankmath" },
    ],
  },
  schemaMarkup: {
    article: { "@context": "https://schema.org", "@type": "Article", headline: SAMPLE_OUTPUT.title },
    faq: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] },
    breadcrumb: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [] },
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
};

const SAMPLE_INPUT: GenerationInput = {
  keywords: ["medical spa SEO", "aesthetic practice marketing"],
  peopleAlsoSearchFor: ["how long for SEO results", "medical spa blog"],
  intent: ["informational"],
  competitorUrls: [],
};

const SAMPLE_RESULT: ResultState = {
  pipelineResult: SAMPLE_PIPELINE_RESULT,
  fallbackGenerated: null,
  selectedTitleIndex: 0,
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
    startGeneration,
    clearResult,
    clearError,
    setSelectedTitleIndex,
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

  const result = contextResult ?? sampleResult;
  const generated = contextGenerated ?? sampleOutput;
  const pipelineResult = result?.pipelineResult ?? null;
  const selectedTitleIndex = result?.selectedTitleIndex ?? 0;
  const generationInput = result?.input ?? {
    keywords: [],
    peopleAlsoSearchFor: [],
    intent: [],
    competitorUrls: [],
    wordCountPreset: "auto",
  };
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

  useEffect(() => {
    if (generated) setEditing({ ...generated });
  }, [generated]);

  // Reset auto-save flag when starting new generation
  useEffect(() => {
    if (generating) {
      autoSavedRef.current = null;
    }
  }, [generating]);

  // Auto-save to history when generation completes
  useEffect(() => {
    if (!generated || !result || generating) return;
    // Skip sample output
    if (generated.title === SAMPLE_OUTPUT.title) return;
    // Skip if already saved (check by title + content hash to avoid duplicates)
    const contentHash = `${generated.title}-${generated.content.slice(0, 100)}`;
    if (autoSavedRef.current === contentHash) return;
    
    // Get primary keyword
    const currentKw = keywords[0]?.trim();
    const genKw = generationInput.keywords[0]?.trim();
    const focusKeyword = (currentKw && currentKw.length > 0) ? currentKw : (genKw && genKw.length > 0 ? genKw : undefined);
    
    // Get generation time
    const generationTimeMs = pipelineResult?.generationTimeMs;
    
    // Save to history
    fetch("/api/blog/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: generated.title,
        metaDescription: generated.metaDescription,
        outline: generated.outline,
        content: generated.content,
        suggestedSlug: generated.suggestedSlug,
        suggestedCategories: generated.suggestedCategories,
        suggestedTags: generated.suggestedTags,
        focusKeyword,
        ...(typeof generationTimeMs === "number" && { generationTimeMs }),
      }),
      credentials: "include",
    })
      .then(() => {
        // Mark as saved
        autoSavedRef.current = contentHash;
      })
      .catch((err) => {
        console.error("Failed to auto-save to history:", err);
        // Don't mark as saved on error so we can retry
      });
  }, [generated, result, keywords, generationInput.keywords, pipelineResult?.generationTimeMs]);

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
        // Set keywords state so primary keyword is available when saving
        if (data.focus_keyword) {
          setKeywords([data.focus_keyword]);
        }
        setSampleResult({
          pipelineResult: null,
          fallbackGenerated: historyContent,
          selectedTitleIndex: 0,
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

  // Clear E-E-A-T result when user changes title variant so they can re-run with new title
  const prevTitleIndexRef = useRef(selectedTitleIndex);
  useEffect(() => {
    if (prevTitleIndexRef.current !== selectedTitleIndex && pipelineResult) {
      setEeatResult(null);
      lastEeatInputRef.current = null;
      prevTitleIndexRef.current = selectedTitleIndex;
    } else {
      prevTitleIndexRef.current = selectedTitleIndex;
    }
  }, [selectedTitleIndex, pipelineResult]);

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

  return (
    <div className="space-y-12">
      {/* Header – Apple/Google style: generous space, refined typography */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Content Writer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Search Central + Rank Math optimized content. Enter a keyword to generate.
          </p>
        </div>
        {generated ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const current = editing;
              clearResult();
              setSampleOutput(null);
              setSampleResult(null);
              setEditing(null);
              if (current && current.title !== SAMPLE_OUTPUT.title) {
                // Primary keyword is always the first keyword entered by the user
                // Use current keywords state if available and non-empty, otherwise fall back to generation input
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
        ) : null}
      </header>

      {(status.type || generationError) && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-4 rounded-2xl px-5 py-4 text-sm ${
            status.type === "success"
              ? "bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-red-50/90 text-red-800 dark:bg-red-950/50 dark:text-red-200"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p>{status.message || generationError}</p>
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
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          {generating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-background/95 animate-in fade-in duration-200 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <div className="w-full max-w-sm space-y-3 px-6">
                <p className="text-center text-sm font-medium text-foreground">
                  {generationProgress?.message || "Starting pipeline..."}
                </p>
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress?.progress ?? 2}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {generationProgress
                      ? `${Math.round((generationProgress.elapsedMs || 0) / 1000)}s elapsed`
                      : "Initializing..."}
                  </span>
                  <span>{generationProgress?.progress ?? 0}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-0">
            {/* Keywords, People also search for, Search intent, Word count — single flat section, no nested boxes */}
            <section className="p-8 sm:p-10 space-y-10">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Keywords</h3>
                <p className="text-sm text-muted-foreground">Primary focus. First keyword is most important. Max 6.</p>
                <TagInput
                  tags={keywords}
                  onTagsChange={setKeywords}
                  placeholder="Add a keyword, press Enter"
                  maxTags={6}
                  disabled={generating}
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
                  disabled={generating}
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

              <div className="space-y-3 border-t border-border/50 pt-8">
                <h3 className="text-sm font-medium text-foreground">Word count</h3>
                <p className="text-sm text-muted-foreground">Guideline only — value and answering the query over length. Aim to provide more value than competitors.</p>
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { value: "auto", label: "Auto", sub: "From competitors" },
                      { value: "concise", label: "Concise", sub: "≈1k–1.5k" },
                      { value: "standard", label: "Standard", sub: "≈1.5k–2.5k" },
                      { value: "in_depth", label: "In-depth", sub: "≈2.5k–4k" },
                      { value: "custom", label: "Custom", sub: "" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        wordCountPreset === opt.value
                          ? "bg-orange-600 text-white dark:bg-orange-500"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${generating ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="wordCountPreset"
                        value={opt.value}
                        checked={wordCountPreset === opt.value}
                        onChange={() => setWordCountPreset(opt.value)}
                        disabled={generating}
                        className="sr-only"
                      />
                      <span>{opt.label}</span>
                      {opt.sub && <span className="opacity-90 text-xs">({opt.sub})</span>}
                    </label>
                  ))}
                  {wordCountPreset === "custom" && (
                    <>
                      <Input
                        type="number"
                        min={500}
                        max={6000}
                        placeholder="e.g. 2000"
                        value={wordCountCustom === "" ? "" : wordCountCustom}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWordCountCustom(v === "" ? "" : Math.min(6000, Math.max(500, Number(v) || 500)));
                        }}
                        disabled={generating}
                        className="h-10 w-28 rounded-xl border border-border bg-background text-sm"
                      />
                      <span className="text-sm text-muted-foreground">words</span>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Submit: View sample output (same size as Generate post) opposite Generate post */}
            <section className="flex flex-wrap items-center justify-between gap-6 border-t border-border/50 p-8 sm:p-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearResult();
                  setKeywords(SAMPLE_INPUT.keywords);
                  setPeopleAlsoSearchFor(SAMPLE_INPUT.peopleAlsoSearchFor);
                  setIntent(SAMPLE_INPUT.intent as IntentType[]);
                  setSampleResult(SAMPLE_RESULT);
                  const initial = pipelineToGenerated(SAMPLE_PIPELINE_RESULT, 0);
                  setSampleOutput(initial);
                  setEditing({ ...initial });
                  setContentView("preview");
                }}
                className="h-12 shrink-0 rounded-full border-2 border-border px-8 text-base font-medium text-foreground shadow-sm hover:bg-muted/60 hover:text-foreground"
              >
                View sample output
              </Button>
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
                            See <code className="rounded bg-muted px-1">content_audit/README.md</code> for setup.
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
              {/* Choose title & meta – compact list with accent selection */}
              {pipelineResult && pipelineResult.titleMetaVariants.length > 1 && (
                <div className="shrink-0 px-4 pt-4">
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                      <h3 className="text-sm font-semibold text-foreground">Choose title & meta</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Select one of {pipelineResult.titleMetaVariants.length} options (2×2 grid) for your article title and meta description.
                      </p>
                    </div>
                    <div className="px-4 pb-4">
                      <ul className="grid grid-cols-2 gap-3" role="listbox" aria-label="Title and meta options (2×2 grid)">
                        {pipelineResult.titleMetaVariants.map((v, i) => {
                          const source = v.approach.includes(" — ") ? v.approach.split(" — ")[0] : v.approach;
                          const guideline = v.approach.includes(" — ") ? v.approach.slice(source.length + 3) : undefined;
                          const isSelected = selectedTitleIndex === i;
                          return (
                            <li key={i}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  if (sampleResult) {
                                    setSampleResult((prev) => (prev ? { ...prev, selectedTitleIndex: i } : null));
                                  } else {
                                    setSelectedTitleIndex(i);
                                  }
                                  const content = pipelineToGenerated(pipelineResult, i);
                                  setEditing((prev) => (prev ? { ...prev, title: content.title, metaDescription: content.metaDescription } : null));
                                }}
                                className={`w-full rounded-xl border-2 text-left transition-all duration-200 ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-50/80 shadow-sm dark:border-orange-400 dark:bg-orange-950/40"
                                    : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30 dark:bg-muted/10 dark:hover:bg-muted/20"
                                }`}
                              >
                                <div className="relative p-3.5">
                                  {isSelected && (
                                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white dark:bg-orange-400" aria-hidden>
                                      <Check className="h-3 w-3" />
                                    </span>
                                  )}
                                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                                    {source}
                                  </p>
                                  <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground pr-7" title={v.title}>
                                    {v.title}
                                  </p>
                                  {guideline && (
                                    <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground" title={guideline}>
                                      {guideline}
                                    </p>
                                  )}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta – editable title, meta description, slug in a single card */}
              <div className="shrink-0 px-4 py-4">
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="px-4 pt-4 pb-2">
                    <h3 className="text-sm font-semibold text-foreground">Meta</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Edit and copy title, meta description, and URL slug.</p>
                  </div>
                  <div className="p-4 space-y-4">
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
                            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
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
                            onChange={(e) => setEditing({ ...editing, suggestedSlug: e.target.value })}
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
                            onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
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
                </div>
              </div>

              {/* Content – card with tabs + preview/outline box */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="shrink-0 flex flex-col gap-3 border-b border-border px-4 py-3">
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (pipelineResult) {
                              setEditing(pipelineToGenerated(pipelineResult, selectedTitleIndex));
                            } else {
                              setEditing({ ...generated! });
                            }
                          }}
                          className="h-8 rounded-lg border-border bg-background px-3 text-[11px] font-medium"
                        >
                          Reset edits
                        </Button>
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
                      <div className="space-y-3">
                        <p className="text-[11px] text-muted-foreground">Section headings; edit as needed.</p>
                        {editing.outline.map((item, index) => (
                          <div key={index} className="flex gap-3 rounded-xl border border-border bg-muted/10 p-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-xs font-semibold tabular-nums text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
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
                              className="min-h-[2.25rem] flex-1 resize-y rounded-lg border-border bg-background text-sm leading-snug"
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
        </div>
      ) : null}
    </div>
  );
}
