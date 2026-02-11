# Content Writer — End-to-End Process (0 to Infinite)

This document describes **every step** of the content writer pipeline after the recent changes: **strict word count**, **no HTML tables** (lists only), and **Rank Math 2500 content-length check removed**.

---

## Summary of Recent Changes

| Area | Before | After |
|------|--------|--------|
| **Word count** | Guideline; "value over length" | **STRICT:** target must be met within ±5%. User selection is an **order**. |
| **Content mix** | 65% prose, 20% lists, 10–15% tables; summary could be HTML table | **No tables.** ~75% prose, ~25% lists. Summary and comparisons use **bulleted/numbered lists (ul/ol) only**. Frontend does not format tables. |
| **Audit** | Rank Math "Content length" (2500+ = 100%) in audit; excluded from score | **Removed.** No content-length audit item. Word count enforced only in writer/brief. |
| **Constants** | `CONTENT_MIN_WORDS_PILLAR: 2500`, `CONTENT_MIN_WORDS_GENERAL: 1500` | **Removed** from `SEO` in `src/lib/constants.ts`. |

---

## Previous vs Current Flow — Comparison

| Aspect | Previous flow | Current flow | Which is better? |
|--------|----------------|--------------|------------------|
| **Word count** | Guideline; “value over length”; writer could undershoot or overshoot. | **STRICT ±5%**; user’s choice is an **order** the writer must meet. | **Current** — Predictable length, clear expectations, no guesswork. |
| **Content mix** | 65% prose, 20% lists, 10–15% tables; summary/comparisons could be HTML `<table>`. | ~75% prose, ~25% lists; **no tables**; summary/comparisons are **lists only** (ul/ol). | **Current** — Matches frontend (tables weren’t styled); simpler, consistent output. |
| **Audit: content length** | Rank Math “Content length” (2500+ = 100%, 1500+ = warn); informational only, excluded from score. | **Removed.** No content-length audit item. | **Current** — One source of truth (brief + writer); no conflicting “2500 for 100%” message. |
| **SEO constants** | `CONTENT_MIN_WORDS_PILLAR: 2500`, `CONTENT_MIN_WORDS_GENERAL: 1500` in code. | Removed; no fixed pillar/general minimums. | **Current** — Word count comes from user/brief only; no hidden 2500 target. |
| **Flexibility for “quality over length”** | Writer could prioritize depth over hitting a number. | Writer must hit target ±5%; less freedom to cut or pad. | **Previous** — Better if you prefer “as long as it needs to be.” |
| **Editorial freedom** | Tables allowed for comparisons/summaries. | Only lists; some comparison layouts less compact. | **Previous** — Only if your frontend actually renders tables well. |
| **Predictability** | Article length could vary a lot for same preset. | Length tightly aligned to preset/custom (order). | **Current** — Better for planning, templates, and client expectations. |
| **Frontend compatibility** | Tables in HTML could render poorly or unstyled. | Lists only; works everywhere. | **Current** — Avoids broken or ugly table display. |

**Summary:** The **current flow is better** for this stack: strict word count as an order, no tables (frontend doesn’t format them), and no Rank Math 2500 in the audit. Use the **previous** flow only if you reintroduce table styling and want “value over length” with a soft target.

---

## Full comparison: every step and phase (previous vs current)

Step-by-step and phase-by-phase: what changed, what stayed the same, and impact on **content quality**, **consistency**, and **other** (UX, frontend, audit, ops).

| Step / phase | Previous | Current | Content quality | Consistency / other |
|--------------|----------|--------|-----------------|----------------------|
| **Phase 0 — User input** | Same fields (keyword, intent, word count preset/custom). | Same. | Same. | Same. Word count is now clearly an **order** in current (mental model). |
| **Phase 1 — API route** | Same parsing, PipelineInput, SSE. | Same. | Same. | Same. |
| **Phase 2 — Orchestrator** | wordCountOverride note: "Guideline only. Value over length." | wordCountOverride note: **"STRICT: target must be met within ±5%."** | **Current:** Brief gets strict target; writer follows it; more predictable depth. | **Current:** One clear rule (strict) vs soft guideline. |
| **Step 1a — Serper** | Same: top 5 article URLs, filter non-article. | Same. | Same. | Same. |
| **Step 1b — Jina** | Same: fetch content, 8k cap, word count. | Same. | Same. | Same. |
| **Step 1c — Gemini** | Same: current data, grounding, URL validation. | Same. | Same. | Same. |
| **Step 2 — Topic extraction** | contentMix: prose/lists/tables; word count note: "guideline only; prioritize value over length." | contentMix: **prose/lists only (no tables)**; word count note: **"STRICT ±5%."** Example: prose 75, lists 25. | **Current:** Extraction steers writer toward lists-only and strict length; no mixed signals. | **Current:** Extraction aligns with brief/draft (no tables, strict). |
| **Step 3 — Brief** | SUMMARY: tables allowed (Analysis = table, Comparison = side-by-side table). INLINE: "list or small comparison table." TARGET: 65/20/10–15 tables; "plus at least one table." default contentMix: 65/20/15. wordCount: "guideline only." | SUMMARY: **lists only** (bullets, two lists for comparison). INLINE: **bulleted or numbered list only.** TARGET: **~75% prose, ~25% lists; no tables.** default contentMix: 75/25, tables 0. wordCount: **"STRICT — target MUST be met ±5%."** normalizeContentMix() → tables→0. | **Current:** Brief enforces lists-only and strict length; writer has one clear content shape. **Previous:** Tables could look bad on frontend. | **Current:** No tables to break; word count is an order. |
| **Step 4 — Draft** | Style: "70% prose, 20% lists, 10% tables." Content mix could include tables. "Value over length; do not pad." WORD COUNT: "Target: N. Minimum 300. Value over length." Do NOT include: no table mention. | Style: **"~75% prose, ~25% lists. Do not use HTML table tags."** Content mix prose/lists only. **"Word count is STRICT: within ±5%. Add or trim as needed."** WORD COUNT: **"STRICT. Target N. MUST be within ±5%."** Do NOT include: **"or HTML table tags (frontend does not format tables)."** | **Current:** Output always lists-only; length in range. **Previous:** Tables in HTML could hurt perceived quality if unstyled. | **Current:** Predictable structure and length; no table-related bugs. |
| **Step 5 — FAQ enforcement** | Same: truncate answers to 300 chars. | Same. | Same. | Same. |
| **Outline drift** | Same: compare brief H2s vs draft outline. | Same. | Same. | Same. |
| **Step 6 — SEO audit** | L1/L2/L3 checks **+** Rank Math "Content length" (2500+ pass, 1500+ warn); item excluded from score. | L1/L2/L3 checks **only**; **no** Rank Math content-length item. | **Same** (that item was informational only). | **Current:** No "2500 for 100%" message; word count = brief/writer only. |
| **Step 7 — Fact check** | Same: numbers vs currentData, rhetorical skip, attribution. | Same. | Same. | Same. |
| **Result assembly** | Same: article, audit, schema, faqEnforcement, factCheck, etc. | Same. | Same. | Same. |
| **Client / SSE** | Same: progress, result, error. | Same. | Same. | Same. |
| **Humanize (optional)** | Preserve: "Summary tables, comparison tables." No explicit "no tables." | Preserve: **"Summary and comparison content (as lists, not tables)."** | **Current:** Humanize won't reintroduce tables; keeps lists-only. | **Current:** Aligns with pipeline (lists only). |

**Content quality summary**

| Dimension | Previous | Current | Better in |
|-----------|----------|--------|-----------|
| **Length vs target** | Variable; "value over length" could mean under/over. | Tight ±5%; user's order is enforced. | **Current** (predictability). |
| **Structure (tables vs lists)** | Tables allowed; risk of unstyled/broken tables on frontend. | Lists only; renders consistently. | **Current** (reliability). |
| **Depth vs padding** | Writer could add fluff to hit 2500 or cut for "value." | Writer must hit target; less arbitrary padding/cutting. | **Current** (clear rule). |
| **Single source of truth** | Audit showed "2500+ = 100%" while brief said "guideline." | No content-length audit; brief + writer own word count. | **Current** (no conflict). |

**When previous might be preferred**

- You **re-enable table styling** on the frontend and want comparison/summary tables again.
- You explicitly want **"quality over length"** and are okay with variable word count for the same preset.
- You want the audit to **show** a "content length" line (e.g. 2500+ for 100%) for editorial awareness only (still not scored).

---

## Phase 0: User Input (Dashboard)

**Location:** Blog Maker UI (e.g. `src/app/dashboard/(main)/blog/page.tsx`).

**User provides:**

- **Keywords:** Comma-separated. First = primary keyword (required); next 1–5 = secondary.
- **People also search for:** Optional; up to 5 phrases.
- **Intent:** One or more of `informational`, `navigational`, `commercial`, `transactional`. Default: `informational`.
- **Word count:**
  - **Preset:** `auto` (use competitor-derived target) | `concise` (1250) | `standard` (2000) | `in_depth` (3200) | `custom`.
  - **Custom:** Only when preset = `custom`; value must be 500–6000. This is the **strict target** (order).
- **Competitor URLs:** Optional. If empty, pipeline finds URLs via search.

**Action:** User clicks Generate → `startGeneration(input)` in `BlogGenerationProvider` → `fetch("/api/blog/generate", { method: "POST", body: JSON.stringify({ keywords, peopleAlsoSearchFor, intent, wordCountPreset, wordCountCustom, ... }) })` with abort `signal`.

---

## Phase 1: API Route & Pipeline Input

**Location:** `src/app/api/blog/generate/route.ts`.

1. **Auth:** `isAuthenticated(request)`; else 401.
2. **Parse body:** `request.json()`.
3. **Primary keyword:** From `keywords` (split comma, trim). First token required; else 400.
4. **Secondary:** Next 1–5 tokens.
5. **PASF:** From `peopleAlsoSearchFor` (array or string split by `,`, `;`, `\n`); max 5.
6. **Intent:** Normalized to allowed set; default `["informational"]`.
7. **Word count:** Preset validated; if `custom`, `wordCountCustom` must be number in [500, 6000].
8. **Build `PipelineInput`:** `primaryKeyword`, `secondaryKeywords`, `peopleAlsoSearchFor`, `intent`, `wordCountPreset`, `wordCountCustom` (when applicable).
9. **Response:** Stream (SSE). In the stream:
   - `onProgress` → send `event: progress`, `data: <PipelineProgressEvent>`.
   - `runPipeline(pipelineInput, onProgress, PIPELINE_BUDGET_MS)` (e.g. 295s).
   - Success → `sendEvent("result", result)`.
   - Error → `sendEvent("error", { error })`.
   - Then close stream.
10. **Headers:** `text/event-stream`, no-cache, keep-alive.

---

## Phase 2: Orchestrator & Time Budget

**Location:** `src/lib/pipeline/orchestrator.ts` → `runPipeline(input, onProgress, budgetMs)`.

- **TimeBudget:** Caps step timeouts so total stays under budget (minus margin).
- **Retries:** Steps run via `withRetry(fn, config, stepName)`.
- **Progress:** `emit(step, status, message, progress)` → 0–100.
- **Primary keyword:** Must be set; else throw before any step.

---

## Step 1a: Serper (Competitor URL Search)

**Progress:** 0 → 5.

1. Emit: `("serper", "started", ...)`.
2. **Call:** `searchCompetitorUrls(primaryKeyword)` (`src/lib/serper/client.ts`).
3. **Serper:** POST to Serper API with `q`, `num: 10`. Filter: exclude non-article domains (Reddit, Quora, YouTube, etc.), file URLs, category/tag paths; require article-like path. Return first **5** URLs as `SerpResult[]`.
4. `urls = serpResults.map(s => s.url).slice(0, 5)`.
5. Emit: `("serper", "completed", "Found N competitor URLs", 5)`.

---

## Step 1b: Jina (Fetch Competitor Content)

**Progress:** 5 → 15 (parallel with 1c).

1. Emit: `("jina", "started", ...)`.
2. **Call:** `fetchCompetitorContent(urls)` (`src/lib/jina/reader.ts`).
3. **Jina:** For each URL (up to 5), GET `https://r.jina.ai/{url}`, Accept markdown, 15s timeout; 2s delay between requests. Per response: trim, truncate to 8k chars; title from first `# ` line or slug; word count. Map to `CompetitorArticle[]` (`url`, `title`, `content`, `wordCount`, `fetchSuccess`).
4. Emit: `("jina", "completed"|"failed", "N articles fetched", 15)`.

---

## Step 1c: Gemini (Current Data / Grounding)

**Progress:** 5 → 15 (parallel with 1b).

1. Emit: `("gemini-grounding", "started", ...)`.
2. **Call:** `fetchCurrentData(primaryKeyword, secondaryKeywords)` (`src/lib/gemini/client.ts`).
3. **Gemini:** Prompt for current facts, recent developments, lastUpdated. JSON: `facts[]` (fact, source URL, date), `recentDevelopments[]`, `lastUpdated`. Config: temperature 0.3, `googleSearch` tool. Model: `gemini-2.5-flash`. Parse, validate with `CurrentDataSchema`. Check grounding; validate source URLs (HEAD); filter facts to accessible URLs. Return `CurrentData` with `groundingVerified`, `sourceUrlValidation`.
4. Orchestrator merges validation into `currentData` (filter facts to accessible).
5. Emit: `("gemini-grounding", "completed"|"failed", "N current data facts", 15)`.

---

## Step 2: Topic Extraction (OpenAI)

**Progress:** 20 → 30.

1. Emit: `("topic-extraction", "started", ...)`.
2. **Input:** `competitors` only (no currentData).
3. **Call:** `extractTopicsAndStyle(competitors)` (`src/lib/openai/client.ts`).
4. **OpenAI:** Payload = competitor articles (URL, title, word count, content slice 12k). System prompt: EXTRACT only (no outline). **A)** Topics (10–20 semantic, importance, coverageCount, keyTerms, exampleContent, recommendedDepth), gaps. **B)** Per-competitor H2/H3 headings. **C)** Editorial style: sentence/paragraph length and distribution, tone, readingLevel, **contentMix (prose/lists % only — no tables)**, dataDensity, introStyle, ctaStyle. **D)** Competitor strengths/weaknesses, AI likelihood. **E)** Word count: competitorAverage, recommended, **note = STRICT ±5%**. Example JSON: `contentMix: { prose: 75, lists: 25 }` (no tables). Model: `gpt-4.1`, JSON mode. Parse; unwrap/normalize keys; `TopicExtractionResultSchema.safeParse`.
5. **Output:** `TopicExtractionResult`: topics, competitorHeadings, gaps, competitorStrengths, editorialStyle, wordCount.
6. Emit: `("topic-extraction", "completed"|"failed", "N topics, M gaps", 30)`.

---

## Step 3: Strategic Brief (OpenAI)

**Progress:** 30 → 40.

1. **Word count override (orchestrator):**
   - No preset or `auto` → no override (use extraction wordCount).
   - `custom` → `{ target: round(wordCountCustom), note: "STRICT: target must be met within ±5%." }` (500–6000).
   - `concise`|`standard`|`in_depth` → target 1250|2000|3200, same **STRICT** note.
2. Emit: `("gpt-brief", "started", ...)`.
3. **Call:** `buildResearchBrief(topicExtraction, currentData, input, wordCountOverride)` (`src/lib/openai/client.ts`).
4. **Brief builder:**
   - **Content mix (no tables):** "Do NOT use HTML table tags — the frontend does not format tables. Use only lists (ul/ol)." **SUMMARY ELEMENT:** By type: Analysis = key takeaways or pros/cons as bullets; Comparison = two bullet lists or side-by-side bullets; How-to = numbered steps; Listicle = ranked list; Review = pros/cons as bullets; Informational = 5–7 takeaways. "Must render as actual HTML lists (ul/ol only)." **INLINE LISTS:** Each H2 >200 words must have bullet or numbered list (no "or small comparison table"). **TARGET MIX:** ~75% prose, ~25% lists; min 3–4 lists; "No tables — use lists only."
   - **Outline:** From competitor headings + gaps; order by intent; each section: heading, level (h2|h3), reason, topics, targetWords, geoNote; H3 when 3+ sub-points.
   - **wordCount:** From extraction or **wordCountOverride**; brief says "STRICT — the target MUST be met within ±5%. The writer will be held to this."
   - Payload trimmed (topics 14, headings 5×10, facts 10, developments 5). Retry if schema fails or best-version fields missing.
   - **normalizeContentMix:** If extraction returns contentMix with tables, redistribute to prose+lists only; `tables: 0`.
5. **Output:** Full `ResearchBrief` (keyword, outline.sections[], currentData, gaps, editorialStyle, geoRequirements, seoRequirements, **wordCount** (target + STRICT note), similaritySummary, extraValueThemes, freshnessNote).
6. Emit: `("gpt-brief", "completed", "Brief: N sections, ...", 40)`.

---

## Step 4: Draft (Claude)

**Progress:** 40 → 75.

1. Emit: `("claude-draft", "started", ...)`.
2. **Call:** `writeDraft(brief)` (`src/lib/claude/client.ts`).
3. **Draft:**
   - **Do NOT include:** "HTML table tags (frontend does not format tables — use bulleted or numbered lists instead)".
   - **Outline block:** Each section: heading (h2|h3), targetWords, topics, geoNote.
   - **Style block:** Fallback: "~75% prose, ~25% lists. Do not use HTML table tags." Else: contentMix **prose/lists only**, "Do not use table tags — use lists (ul/ol) only."
   - **Word count:** "## WORD COUNT (STRICT). Target: N words. Note. Minimum 300 words. The article MUST be within ±5% of the target word count. Meet the target — add or trim content as needed."
   - **Output:** JSON with titleMetaVariants (4), outline[], content (HTML), suggestedSlug, suggestedCategories, suggestedTags. Content = paragraphs + headings + **lists only (ul/ol)**.
   - Stream Claude; parse/repair JSON; validate with `ClaudeDraftOutputSchema`; normalize slug (75 chars).
4. **Output:** titleMetaVariants, outline, content, suggestedSlug, suggestedCategories, suggestedTags.
5. Emit: `("claude-draft", "completed", "Draft: N words, M title variants", 75)`.

---

## Step 5: FAQ Enforcement (TypeScript)

**Progress:** 82 → 92.

1. Emit: `("faq-enforcement", "started", ...)`.
2. **Input:** `finalContent = draft.content`.
3. **Call:** `enforceFaqCharacterLimit(finalContent, 300)` (`src/lib/seo/article-audit.ts`).
4. **Logic:** Find FAQ H2; extract H3 questions and following `<p>` answers; for each answer >300 chars, truncate (sentences then last space before 299); replace in HTML.
5. **Output:** `{ passed, violations, fixedHtml }`. Orchestrator sets `finalContent = fixedHtml` when not passed.
6. Emit: `("faq-enforcement", "completed", ...)`.

---

## Outline Drift (Non-blocking)

- **Expected H2s:** From brief outline sections with `level === "h2"`.
- **Actual H2s:** From `draft.outline` (string array).
- **Result:** `outlineDrift: { passed, expected, actual, missing, extra }`. Used for UI only.

---

## Step 6: SEO Audit & Schema

**Progress:** 92 → 96.

1. Emit: `("audit", "started", ...)`.
2. **Input:** First title/meta, `finalContent`, slug, focusKeyword, extraValueThemes.
3. **Call:** `auditArticle(...)` (`src/lib/seo/article-audit.ts`).
4. **Checks (no Rank Math content-length):**
   - **L1:** Title (present, length), meta (present, length), content thinness (<300 words), keyword stuffing, heading structure (H2–H6, no H1 in body).
   - **L2:** Paragraph length (≤120 words), slug length, AI typography (em-dash, en-dash, curly quotes), AI phrases (banned list).
   - **L3:** Rank Math meta keyword, first 10%, slug keyword, subheading keyword, title keyword position, number in title; extra-value coverage if themes provided.
   - **Removed:** ~~Rank Math content length (2500+)~~ — not in audit.
5. **Score:** Scoreable = all except editorial (except ai-typography). `score = round(pass/total*100)`. `publishable = score >= 75 && level1Fails === 0`.
6. **Schema:** `generateSchemaMarkup(...)` when title/meta/slug/keyword present.
7. Emit: `("audit", "completed", "Audit score: N%", 96)`.

---

## Step 7: Fact Check (TypeScript)

**Progress:** 96 → 98.

1. Emit: `("fact-check", "started", ...)`.
2. **Call:** `verifyFactsAgainstSource(finalContent, currentData, primaryKeyword)`.
3. **Logic:** Build ref numbers and source aliases from currentData. Scan article for stat-like numbers and attribution phrases; skip rhetorical/derived; flag hallucinations and fabricated sources. Non-blocking.
4. Emit: `("fact-check", "completed", ...)`.

---

## Result Assembly & Stream

- **Brief summary:** From similaritySummary, extraValueThemes, freshnessNote.
- **Return:** article (content, outline, suggestedSlug, suggestedCategories, suggestedTags), titleMetaVariants, selectedTitleMeta: null, sourceUrls, auditResult, schemaMarkup, faqEnforcement, factCheck, publishTracking, generationTimeMs, briefSummary, outlineDrift.
- Emit: `("done", "completed", ...)`.
- API sends SSE `event: result`, `data: <result>`, then closes stream. **No humanize in pipeline.**

---

## Client: SSE Handling

**Location:** `BlogGenerationProvider` → `processSSEStream`.

- Read stream; split by `\n\n`; parse `event:` and `data:`.
- **progress:** Update step, status, message, progress %, elapsedMs.
- **result:** Parse JSON; set result (pipelineResult or fallbackGenerated), progress 100, status success.
- **error:** Throw → catch sets error and status error.

---

## Optional: Humanize

- **When:** User chooses "Re-run humanize" on current HTML (from pipeline or after edit).
- **Request:** POST `/api/blog/humanize` with `{ content }`. Auth required.
- **API:** `humanizeArticleContent(content)` (Claude), 90s timeout; return `{ content }`.
- **Humanize prompt:** Preserve structure, stats, headings, FAQ; vary sentence length/openings; remove stock phrases and bad typography; **summary/comparison as lists, not tables**; word count within ±5% of original.
- **After:** User can re-run audit on new HTML. Pipeline is not re-run.

---

## End-to-End Flow (Single Run)

```
0. User: keyword, intent, word count (order), etc. → Generate.
1. POST /api/blog/generate → PipelineInput → runPipeline(295s).
2. Serper → 5 competitor URLs.
3. Jina → 5 competitor articles (markdown, 8k cap).
4. Gemini (+ URL validation) → CurrentData.
5. OpenAI extractTopicsAndStyle → topics, headings, gaps, style, wordCount (STRICT note); contentMix prose/lists only.
6. OpenAI buildResearchBrief → outline (H2/H3, targetWords), no tables, wordCount STRICT (override if user preset/custom).
7. Claude writeDraft → HTML (lists only), title/meta variants, outline, slug; word count STRICT ±5%.
8. enforceFaqCharacterLimit → FAQ ≤300 chars.
9. auditArticle → items, score, publishable, schema (no Rank Math content-length).
10. verifyFactsAgainstSource → hallucinations (non-blocking).
11. Assemble result → SSE "result".
12. Client → result state → UI.
13. (Optional) Humanize → POST /api/blog/humanize → re-audit.
```

All steps are bounded (timeouts, retries, list sizes). Word count is a **strict order**; content uses **lists only, no tables**; audit has **no 2500-word content-length check**.
