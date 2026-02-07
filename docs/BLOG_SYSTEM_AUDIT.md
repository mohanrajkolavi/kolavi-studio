# Final Audit: Blog Generator, Humanize, Audit, Google Search Central, Rank Math

## 1. Component vs. Area (Coverage Matrix)

| Area | Blog Generator | Humanize Pass | Article Audit |
|------|----------------|---------------|---------------|
| **Google Search Central** | PRIORITY 1 in prompts: people-first, first-hand expertise, satisfy intent, natural language, title/meta, E-E-A-T, no keyword stuffing, min 300 words, headings H2–H6 | Preserves structure and facts only; does not re-teach Google rules | Level 1 & 2: author byline, author bio, title, meta description, thin content, AI phrases, keyword stuffing, heading structure, paragraph length (≤120w), slug |
| **Rank Math** | PRIORITY 2 in prompts: keyword in title (first 50%), meta (120–160 chars), slug, first 10%, subheadings, paragraphs ≤120w, word count 1500+/2500+, FAQ 3–5 Q&As | No Rank Math–specific logic; keeps content so audit still applies | Level 3: keyword in meta, first 10%, slug, subheadings, content length, title keyword position, number in title |
| **Human style / AI detection** | 10 patterns: sentence/paragraph mix, no stock AI phrases, conversational, imperfections, personality, real examples, natural flow, formatting variation, voice | Explicit: sentence-length chaos, paragraph variation, conversational, personality, 1–2 imperfections, replace stock phrases | AI_PHRASES list (fail/warn); same phrases generator is told to avoid |
| **Audit (75% + no L1 fail)** | Prompt says "Content must pass our SEO audit (75%+ score required to publish)" | N/A (audit runs on output after humanize) | Computes score, Level 1 fails; publishable = score ≥ 75 and level1Fails === 0 |

---

## 2. Google Search Central – By Component

| Check / Principle | Blog Generator | Humanize | Audit |
|-------------------|----------------|----------|--------|
| People-first ("Would you publish if Google didn't exist?") | Core principle in system + user prompt | Keeps meaning; doesn't re-evaluate | Not a direct check; thin content + quality checks support it |
| First-hand expertise, unique value | Explicit in system prompt; "specificity, original observations" | Preserves content | E-E-A-T implied via author byline/bio (L1) |
| Satisfy search intent, no padding | In user prompt; "comprehensive but natural" | No change to intent | Thin content (min words) L1 |
| Natural language, no keyword stuffing | BANNED phrases + "use keywords organically" | Replaces stock phrases only | L1: auditKeywordStuffing; L1: auditAiPhrases; L1/L2: auditAiTypography |
| Title: unique, clear, ~60 chars, keyword early | User prompt: "Max 60 chars, primary keyword at beginning" | Does not change title | L1: auditTitle (length, presence) |
| Meta: "pitch", compelling, ~160 chars | User prompt: "Max 160 chars, pitch" | N/A (meta not humanized) | L1: auditMetaDescription |
| E-E-A-T | "Write as if an expert authored it"; author byline in WordPress | N/A | L1: auditAuthorByline, auditAuthorBio |
| Headings: H2–H6, sequential, natural | "H2–H6 only, sequential hierarchy" | Keeps headings unchanged | L1: auditHeadingStructure |
| Paragraph length (readability) | "No paragraph >120 words" | Can shorten/lengthen sentences, not structure | L2: auditParagraphLength (≤120w) |
| Slug | "Lowercase, hyphens, primary keyword" | N/A | L2: auditSlug |

---

## 3. Rank Math – By Component

| Check | Blog Generator | Humanize | Audit |
|-------|----------------|----------|--------|
| Keyword in title (first 50%) | "Primary keyword in first 50% of title" | N/A | L3: auditRankMathTitleKeywordPosition |
| Number in title | "Include a number when natural" | N/A | L3: auditRankMathNumberInTitle |
| Keyword in meta (first 120–160 chars) | "Primary keyword in first 120–160 chars" | N/A | L3: auditRankMathMetaKeyword |
| Keyword in slug | "Primary keyword in slug" | N/A | L3: auditRankMathSlugKeyword |
| Keyword in first 10% of content | "First 10% or first 300 words" | Preserves structure; wording only | L3: auditRankMathFirst10Percent |
| Keyword in subheadings (H2/H3) | "Primary + secondary in H2/H3 naturally" | Keeps H2/H3 text | L3: auditRankMathSubheadingKeyword |
| Content length (1500+ / 2500+) | "2500+ = 100%; 1500+ pillar; don't pad" | No word-count targeting | L3: auditRankMathContentLength |
| FAQ (3–5 Q&As) | "FAQ 3–5 Q&As, People Also Search For" | Keeps FAQ section | Not a separate audit item (covered by structure) |

---

## 4. Human Style / AI Detection – By Component

| Element | Blog Generator | Humanize | Audit |
|---------|----------------|----------|--------|
| Sentence length mix (short/medium/long/fragments) | ~20% / ~40% / ~30% / ~10%; fragments and run-ons allowed | Same targets; "add a few fragments" | No direct check |
| Paragraph mix (1 / 2–4 / 5–7 / 8+ sentences) | ~15% / ~50% / ~25% / ~10% | "One-sentence and 5–7 sentence paragraphs" | No direct check |
| No stock AI phrases | Full BANNED list + human alternatives in system prompt | "Replace stock AI phrases with human alternatives" | L1: auditAiPhrases (AI_PHRASES list) |
| No AI typography (em-dash, curly quotes) | BANNED: straight " ' only. Target under 30% AI detection | "Replace em-dash, curly quotes with straight punctuation" | L1/L2: auditAiTypography |
| Conversational (questions, "And"/"But", asides) | Pattern 3 in system; HUMAN STYLE in user prompt | "Rhetorical questions, direct address, asides" | No direct check |
| Personality and opinion | Pattern 6; "Make claims, don't only hedge" | "Make claims; opinions or emphasis lines" | No direct check |
| Real examples (brands, numbers) | Pattern 7; "Ahrefs, SEMrush, $500–800" | Preserves content | No direct check |
| Natural flow / messiness | Pattern 8; "Don't make every transition smooth" | Not re-taught | No direct check |
| Formatting variation | Pattern 9; mix lists, bold some terms, "e.g." and "for example" | "Bold some terms, mix list styles" | No direct check |
| Small imperfections (1–2 per 1000w) | Pattern 4; missing comma, mixed "you'll"/"you will", capitalization | "1–2 tiny quirks per 1000 words" | No direct check |
| Voice consistency with slips | Pattern 10; "you" vs "we", one casual in formal | Not explicit | No direct check |

---

## 5. Audit-Only (Levels and Publishability)

| Item | Level | Source | Purpose |
|------|-------|--------|---------|
| Author byline | 1 | Google (E-E-A-T) | Publication blocker (pass when `authorHandledByCms: true`, e.g. WordPress adds author at publish) |
| Author bio URL | 1 | Google (E-E-A-T) | Publication blocker (pass when `authorHandledByCms: true`) |
| Title present & length | 1 | Google | Publication blocker |
| Meta description present & length | 1 | Google | Publication blocker |
| Thin content (min word count) | 1 | Google | Publication blocker |
| AI-sounding phrases | 1 | Google / Scaled content | Publication blocker (fail if >3) or warn |
| AI typography (em-dash, curly quotes) | 1 or 2 | AI detection (target under 30%) | Publication blocker (fail if ≥2) or warn |
| Keyword stuffing | 1 | Google (spam) | Publication blocker |
| Heading structure (H2–H6, hierarchy) | 1 | Google | Publication blocker |
| Paragraph length (≤120 words) | 2 | Google / Rank Math | Ranking killer |
| Slug format | 2 | Rank Math | Ranking killer |
| Keyword in meta | 3 | Rank Math | Competitive |
| Keyword in first 10% | 3 | Rank Math | Competitive |
| Keyword in slug | 3 | Rank Math | Competitive |
| Keyword in subheadings | 3 | Rank Math | Competitive |
| Content length (2500+ etc.) | 3 | Rank Math | Competitive |
| Title keyword position | 3 | Rank Math | Competitive |
| Number in title | 3 | Rank Math | Competitive |

**Publishable:** `score >= 75` (MIN_PUBLISH_SCORE) and `level1Fails === 0`.

---

## 5b. Weightage list (how the score is calculated)

**Formula:** `score = (pass / total) × 100`. Every check has **equal weight (1)**. Only **pass** counts toward the numerator; **warn** and **fail** do not. So each pass = +1 to the score, each warn/fail = 0.

**Publishability:** In addition to score ≥ 75, there must be **no Level 1 failures** (any L1 fail blocks publish even if score is high).

| # | Check (label) | Level | Pass → score | Warn / Fail → score |
|---|----------------|-------|--------------|----------------------|
| 1 | Author byline | 1 | +1 | 0 (warn or N/A when `authorHandledByCms`) |
| 2 | Author bio page | 1 | +1 | 0 (warn) |
| 3 | Title | 1 | — | 0 (fail if missing) |
| 4 | Title length | 1 or 2 | +1 (L2 pass) | 0 (L1 fail if >60 chars; L2 warn if long) |
| 5 | Title keyword | 2 | +1 | 0 (warn if no focus keyword) |
| 6 | Meta description | 1 | — | 0 (fail if missing/too long) |
| 7 | Meta description length | 2 | +1 | 0 (warn if long) |
| 8 | Content depth (thin content) | 1 | +1 | 0 (fail if <300 words) |
| 9 | AI-sounding language | 1 or 2 | +1 (L2) | 0 (L1 fail if >3 phrases; L2 warn) |
| 10 | AI typography (em-dash, curly quotes) | 1 or 2 | +1 (L2) | 0 (L1 fail if >=2; L2 warn) |
| 11 | Keyword stuffing / use | 1 or 2 | +1 (L2) | 0 (L1 fail stuffing; L2 warn repetition) |
| 12 | Headings | 1 | +1 | 0 (warn if missing) |
| 13 | Heading hierarchy | 2 | +1 | 0 (warn if skip levels) |
| 14 | H1 in body | 2 | +1 | 0 (warn if H1 in body) |
| 15 | Paragraph length | 2 | +1 | 0 (warn if any para >120 words) |
| 16 | URL slug length | 2 | +1 | 0 (warn if long) |
| 17 | Rank Math: Keyword in meta | 3 | +1 | 0 (warn) |
| 18 | Rank Math: First 10% | 3 | +1 | 0 (warn) |
| 19 | Rank Math: Slug keyword | 3 | +1 | 0 (warn) |
| 20 | Rank Math: Subheading keyword | 3 | +1 | 0 (warn) |
| 21 | Rank Math: Content length | 3 | +1 | 0 (warn only if 600-1499 words; 1500+ = pass) |
| 22 | Rank Math: Keyword position in title | 3 | +1 | 0 (warn) |
| 23 | Rank Math: Number in title | 3 | +1 | 0 (warn) |

**Example:** 19 pass, 4 warn, 0 fail → total 23 → score = round(19/23 × 100) = **83%**. If any of the 4 warn were Level 1 fail, publishable would be false.

---

## 6. File Reference

| Component | File |
|-----------|------|
| Blog generator | `src/lib/claude/client.ts` (SYSTEM_PROMPT, user prompt, `generateBlogPost`) |
| Humanize | `src/lib/claude/client.ts` (HUMANIZE_SYSTEM, `humanizeArticleContent`) |
| Article audit | `src/lib/seo/article-audit.ts` (`auditArticle`, AI_PHRASES, Level 1/2/3) |
| Generate API | `src/app/api/blog/generate/route.ts` (generate → humanize → return) |
| Dashboard | `src/app/dashboard/(main)/blog/page.tsx` (audit on `editing`, focusKeyword from first keyword) |
| Standalone audit script | `scripts/run-audit.mjs` (AI_PHRASES kept in sync with article-audit) |

---

## Flow essence: three pillars (Google, Rank Math, Human)

The flow is designed so every output embodies:

1. **Google Search Central** – People-first, E-E-A-T, natural language, satisfy intent, no keyword stuffing.
2. **Rank Math** – Keyword placement (title, meta, slug, first 10%, subheadings), readability (paragraphs ≤120w), structure (FAQ, length).
3. **Human style** – Conversational, varied sentences, no stock AI phrases, target under 30% AI detection.

- **Generator:** Produces one draft that already satisfies all three pillars (PRIORITY 1 Google, PRIORITY 2 Rank Math, HUMAN STYLE throughout).
- **Humanize:** Preserves Google and Rank Math essence (keywords, headings, structure, expert tone); strengthens human style (wording, rhythm, idioms, no stock phrases) only. Does not dilute SEO.

---

## Coordination (generator, humanize, audit)

- **Generate API:** Runs `generateBlogPost` then `humanizeArticleContent`; returns one result. Dashboard audits that result with `focusKeyword` from the first keyword.
- **Shared AI phrases:** The generator and humanize prompts use the same conceptual BANNED list as the audit's `AI_PHRASES`. When adding or removing a phrase, update: (1) generator system + user prompt in `src/lib/claude/client.ts`, (2) `AI_PHRASES` in `src/lib/seo/article-audit.ts`, (3) `AI_PHRASES` in `scripts/run-audit.mjs`.
- **Typography (strict for under 30% AI detection):** Em-dash, en-dash, curly quotes BANNED. Use straight " and ' only. Synced in auditAiTypography and generator/humanize prompts. No exceptions.
- **Detection alignment:** Generator and humanize prompts now include perplexity (unpredictable word choice), burstiness of perplexity (vary predictability), varied sentence openings, and humanize explicitly does more than paraphrase (restructure, idioms) to align with how GPTZero/ZeroGPT and similar detectors work.

---

*Generated as final audit of blog generator, humanize pass, article audit, Google Search Central, and Rank Math alignment.*
