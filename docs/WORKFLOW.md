# Blog Generation Pipeline — Workflow & Error Handling

Consolidated reference for the Content Writer pipeline: steps, providers, data flow, and error behavior.

---

## Overview

Two execution modes:

1. **Auto mode** — Single `/api/blog/generate` call; runs all steps end-to-end.
2. **Step mode** — Chunked flow via `/api/blog/research`, `/api/blog/brief`, `/api/blog/draft`, `/api/blog/validate`; user can edit outline between brief and draft.

---

## Auto Mode (Monolithic)

| Step | Name | Provider | What it does |
|------|------|----------|--------------|
| **1a** | Serper | Serper | Search for primary keyword; top SERP results (3 by default). |
| **1b** | Jina | Jina | Fetch article content for competitor URLs. |
| **1c** | Gemini grounding | Gemini | Fetch current data (facts, dates, sources). |
| **2** | Topic extraction | OpenAI (GPT-4.1) | Analyze competitors: topics, editorial style, gaps, word count. |
| **2b** | URL validation | TypeScript | Check that source URLs are reachable. |
| **3** | Research brief | OpenAI (GPT-4.1) | Build `ResearchBrief` (outline, SEO rules, editorial style, gaps). No title/meta/slug. |
| **4** | Draft | Claude | Write article from brief; returns content, categories, tags. Title/meta/slug are placeholders. |
| **4b** | Meta from draft | User + optional | User clicks "Generate meta" in result UI; POST `/api/blog/meta` generates title, meta, slug from draft content. |
| **5** | FAQ enforcement | TypeScript | Enforce FAQ answer length (max 300 chars). |
| **6** | Audit + schema | TypeScript | SEO audit + schema markup. |
| **7** | Fact check | TypeScript | Compare facts against sources. |
| **7b** | Hallucination fix (optional) | Claude | Auto-fix hallucinations when `autoFixHallucinations` enabled. |

---

## Step Mode (Chunked)

| Phase | API | Provider | What it does |
|-------|-----|----------|--------------|
| **1** | POST `/research` | Serper | Return SERP (top 10) for competitor selection. |
| **2** | POST `/research/fetch` | Jina + Gemini | Fetch articles for selected URLs; fetch current data. |
| **3** | POST `/brief` | OpenAI | Topic extraction → research brief. |
| **4** | POST `/draft` | Claude | `writeDraft` (content only; placeholder title/meta/slug). User generates meta via "Generate meta" button → POST `/api/blog/meta`. |
| **5** | POST `/validate` | TypeScript | FAQ enforcement, audit, schema, fact check. |

---

## Input Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `primaryKeyword` | string | required | Target keyword. |
| `secondaryKeywords` | string[] | — | Additional keywords. |
| `peopleAlsoSearchFor` | string[] | — | Related phrases. |
| `intent` | `SearchIntent \| SearchIntent[]` | `"informational"` | Search intent. |
| `wordCountPreset` | string | `"auto"` | `auto` \| `concise` \| `standard` \| `in_depth` \| `custom`. |
| `wordCountCustom` | number | — | Used when `wordCountPreset === "custom"` (500–6000). |
| `autoFixHallucinations` | boolean | `true` | When true, use Claude to fix fact-check hallucinations. |

---

## Error Handling & Retries

### Retry behavior

All LLM and external API calls use `withRetry` with configurable timeouts and retry conditions:

| Config | Timeout | Max retries | Retries on |
|--------|---------|-------------|------------|
| `RETRY_FAST` | 10s | 1 | timeout, server_error |
| `RETRY_STANDARD` | 30s | 2 | timeout, rate_limit, server_error |
| `RETRY_STANDARD_FAST` | 40s | 2 | timeout, rate_limit, server_error |
| `RETRY_CLAUDE_DRAFT` | 180s | 1 | timeout, rate_limit |

- **timeout** — Call exceeds allocated time.
- **rate_limit** — HTTP 429; delay is doubled before retry.
- **server_error** — HTTP 5xx.

### Partial failures (graceful degradation)

| Step | On failure | Pipeline behavior |
|------|------------|-------------------|
| **Jina** | No articles fetched | Pipeline fails (no competitor content). |
| **Gemini grounding** | No current data | Continues with empty `currentData`; fact-check and attribution rely on provided data. |
| **Topic extraction** | Fails | Pipeline fails (no brief input). |
| **Brief** | Fails | Pipeline fails. |
| **Claude draft** | Fails | Pipeline fails. |
| **FAQ enforcement** | — | TypeScript; no external calls. |
| **Audit + schema** | — | TypeScript; no external calls. |
| **Fact check** | — | TypeScript; hallucinations are non-blocking (warning only). |
| **Hallucination fix** | Fails | Original content kept; no failure. |

### Source URL validation

- Facts from Gemini may reference URLs that are later inaccessible.
- `validateSourceUrls` runs in parallel with topic extraction.
- Inaccessible URLs are filtered from `currentData.facts`; `sourceUrlValidation` tracks accessible vs total.
- Pipeline proceeds; fact-check and attribution use only the remaining accessible sources.

---

## Data Flow

```
Serper → URLs
Jina → CompetitorArticle[]
Gemini → CurrentData (facts, recentDevelopments, lastUpdated)

CompetitorArticle[] + CurrentData → OpenAI (extractTopicsAndStyle) → TopicExtractionResult
TopicExtractionResult + CurrentData + Input → OpenAI (buildResearchBrief) → ResearchBrief
ResearchBrief + placeholder meta → Claude (writeDraft) → { content, suggestedCategories, suggestedTags }

[User clicks "Generate meta"] → POST /api/blog/meta (content, keyword, intent) → OpenAI (generateTitleMetaSlugFromContent) → { title, metaDescription, suggestedSlug }

content → FAQ enforcement → finalContent
finalContent + title + meta + slug → auditArticle, generateSchemaMarkup
finalContent + CurrentData → verifyFactsAgainstSource
[Optional] hallucinations → Claude (fixHallucinationsInContent)
```

---

## Key Files

- `src/lib/pipeline/orchestrator.ts` — Auto mode pipeline.
- `src/lib/pipeline/chunks.ts` — Step mode chunk runners (research, brief, draft, validate).
- `src/lib/openai/client.ts` — `buildResearchBrief`, `generateTitleMetaSlugFromContent`.
- `src/lib/claude/client.ts` — `writeDraft`, `fixHallucinationsInContent`.
- `src/lib/seo/article-audit.ts` — Audit, schema, FAQ enforcement, fact check.
