# Output Quality Improvement Plan

A structured plan to improve blog content accuracy, consistency, and freshness—aligned with Google Search Central guidelines.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Temperature Settings](#phase-1-temperature-settings)
3. [Phase 2: Draft Process Fixes](#phase-2-draft-process-fixes)
4. [Phase 3: Brief Revise Mode](#phase-3-brief-revise-mode)
5. [Phase 4: Outline Editor UX](#phase-4-outline-editor-ux)
6. [Phase 5: Optional Optimizations](#phase-5-optional-optimizations)
7. [Implementation Order](#implementation-order)

---

## Overview

| Goal | Strategy |
|------|----------|
| **Accuracy** | Lower temperature on analytical steps; fix word count sync |
| **Consistency** | Low temp on extraction/brief; cache topic extraction on revise |
| **Freshness** | Gemini grounding (live search); Claude 0.5 for varied phrasing |

**Total effort:** ~4–6 hours across 5 phases.

---

## Phase 1: Temperature Settings

**Effort:** ~15 min  
**Impact:** High — improves consistency and accuracy across all runs

### Current vs Target

| Step | Provider | Function | File | Current | Target |
|------|----------|----------|------|---------|--------|
| Topic extraction | OpenAI | `extractTopicsAndStyle` | `openai/client.ts` | 0.3 | **0.1** |
| Research brief | OpenAI | `buildResearchBrief` | `openai/client.ts` | 0.3 | **0.1** |
| Title/meta (content) | OpenAI | `generateTitleMetaSlugFromContent` | `openai/client.ts` | 0.5 | **0.3** |
| Current data | Gemini | `fetchCurrentData` | `gemini/client.ts` | 0.3 | **0.1** |
| Topic extraction | Gemini | `extractTopicsAndStyle` | `gemini/client.ts` | 0.3 | **0.1** |
| Draft writing | Claude | `writeDraft` | `claude/client.ts` | 0.7 | **0.5** |
| Hallucination fix | Claude | `fixHallucinationsInContent` | `claude/client.ts` | 0.2 | **0.1** |
| Legacy full generate | Claude | (legacy) | `claude/client.ts` | 0.9 | **0.5** |

### Rationale

| Temp | Use case |
|------|----------|
| **0.1** | Analytical steps — extraction, brief, grounding, surgical edits. Max accuracy & consistency. |
| **0.3** | Meta generation — enough variety for compelling titles, more consistent than 0.5. |
| **0.5** | Creative writing — draft. Balance of accuracy, freshness, and varied phrasing. |

---

## Phase 2: Draft Process Fixes

**Effort:** ~30 min  
**Impact:** Medium — ensures Claude receives consistent word count signals

### 2.1 Fix `brief.wordCount.target` in `applyBriefOverrides`

**Problem:** When user edits section `targetWords` via briefOverrides, `brief.outline.estimatedWordCount` updates but `brief.wordCount.target` does not. Claude gets conflicting signals.

**File:** `src/lib/pipeline/chunks.ts`

**Change:** After merging sections and computing `estimatedWordCount`, sync `brief.wordCount.target`:

```ts
const newTarget = sections.reduce((sum, s) => sum + (s.targetWords || 150), 0);
return {
  ...brief,
  wordCount: { ...brief.wordCount, target: newTarget },
  outline: {
    sections,
    totalSections: sections.length,
    estimatedWordCount: newTarget,
  },
};
```

### 2.2 Strengthen Per-Section Word Count Guidance in Claude Prompt

**Problem:** Per-section `targetWords` are in the prompt but not explicitly framed as proportional guides.

**File:** `src/lib/claude/client.ts`

**Change 1:** After the outline block (around line 790), add:

```
Section word targets above are guidance; roughly proportion your content across sections accordingly.
```

**Change 2:** In the WORD COUNT section (around line 819), add:

```
Section word targets sum to approximately ${brief.outline.estimatedWordCount}. Article total must be ${brief.wordCount.target} words (±5%). Distribute content accordingly.
```

---

## Phase 3: Brief Revise Mode

**Effort:** ~1–2 hrs  
**Impact:** Medium — lets users adjust word count without re-fetching research

### 3.1 Goal

Re-run the brief with a new target word count using existing research. No Serper/Jina/Gemini re-fetch.

### 3.2 Brief API Changes

**File:** `src/app/api/blog/brief/route.ts`

**Request body (extended):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string | Yes | Job ID |
| `revise` | boolean | No | If `true`, run in revise mode |
| `wordCountTarget` | number | If revise | New target (500–6000) |

**Revise flow:** Load research → run topic extraction → `buildResearchBrief` with `wordCountOverride` → save to analysis → return new brief.

### 3.3 Chunk Layer

**File:** `src/lib/pipeline/chunks.ts`

**Change:** Extend `runBriefChunk` with optional `options?: { revise?: boolean; wordCountTarget?: number }`. When `revise === true`, use `wordCountTarget` as override; skip re-fetch of research.

---

## Phase 4: Outline Editor UX

**Effort:** ~1–2 hrs  
**Impact:** Medium — better control over word count and structure

### 4.1 Components

| Component | Description |
|-----------|-------------|
| **Target total input** | Editable field; default = sum of section `targetWords` |
| **Redistribute button** | Client-side: proportionally scale section `targetWords` to hit target total |
| **Revise Brief button** | POST to brief API with `revise: true`, `wordCountTarget`; refresh outline on success |

### 4.2 Files

- `src/app/dashboard/(main)/blog/page.tsx` — UI components
- `src/components/dashboard/BlogGenerationProvider.tsx` — `startReviseBrief` or extend `startBrief`

---

## Phase 5: Optional Optimizations

**Effort:** ~30–60 min each  
**Impact:** Low–medium

### 5.1 Topic Extraction Caching ✅ Implemented

When re-running brief (same research chunk), reuse cached topic extraction instead of re-running. Saves ~1 GPT call per revise.

**Implementation:** Added `topic_extraction` chunk kind. Cache keyed by hash of competitor URLs. When research is re-fetched (different URLs), hash changes and cache is bypassed.

### 5.2 Job Input Update on Target Change

When user sets new target total in outline editor, persist to `job.input.wordCountCustom` so future full re-runs use it.

**Requires:** `jobStore.updateJobInput(jobId, partialInput)`.

### 5.3 Brief Idempotency

If job already has completed `analysis` chunk and user runs brief without `revise`, optionally return cached brief (configurable via flag).

---

## Implementation Order

| Phase | Task | Effort | Dependencies |
|-------|------|--------|--------------|
| **1** | Temperature changes | 15 min | None |
| **2** | Draft fixes (applyBriefOverrides + Claude prompt) | 30 min | None |
| **3** | Brief revise mode (API + chunk) | 1–2 hrs | None |
| **4** | Outline editor UX | 1–2 hrs | Phase 3 |
| **5** | Optional: topic extraction caching | 30–60 min | Phase 3 |

**Recommended sequence:** 1 → 2 → 3 → 4. Phase 5 can be done anytime after Phase 3.

---

## Files Summary

| File | Changes |
|------|---------|
| `src/lib/openai/client.ts` | Temperatures: extract 0.1, brief 0.1, title/meta 0.3 |
| `src/lib/gemini/client.ts` | Temperatures: 0.1 for both calls |
| `src/lib/claude/client.ts` | Temperatures: draft 0.5, fix 0.1, legacy 0.5; per-section word guidance |
| `src/lib/pipeline/chunks.ts` | applyBriefOverrides wordCount sync; runBriefChunk revise option |
| `src/app/api/blog/brief/route.ts` | Parse `revise`, `wordCountTarget`; pass to runBriefChunk |
| `src/app/dashboard/(main)/blog/page.tsx` | Target total, Redistribute, Revise Brief UI |
| `src/components/dashboard/BlogGenerationProvider.tsx` | startReviseBrief or extend startBrief |

---

## Success Criteria

- [ ] Same competitors + same inputs → more consistent outline and word count
- [ ] Facts from Gemini more stable across runs
- [ ] Draft content hits section proportions better
- [ ] User can revise brief with new word count without re-fetching research
- [ ] Outline editor supports target total and redistribute

---

*Last updated: Feb 2025*
