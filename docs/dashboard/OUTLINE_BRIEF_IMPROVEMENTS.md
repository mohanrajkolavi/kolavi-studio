# Outline / Brief / Draft — Backend, Logic & System Improvements

Suggestions to harden the outline step, brief API, and draft flow (aligned with research-summary backend improvements).

---

## Implemented

### 1. **applyBriefOverrides reorder bug (fixed)**
- **Issue:** `reorderedSectionIndexes` are **original** section indices (0..N-1). After filtering by `removedSectionIndexes`, the `sections` array length shrinks and array indices no longer match original indices, so `sections[i]` was wrong.
- **Fix:** Before filtering, build `mergedByOriginalIndex: Map<number, OutlineSection>`. Apply remove to get `sections`. For reorder, use `reorderedSectionIndexes.filter(not removed).map(i => mergedByOriginalIndex.get(i))` so order and identity use original indices.

### 2. **Empty outline after overrides (fixed)**
- **Issue:** If user removes all sections or overrides yield zero sections, `writeDraft(brief)` could run with an empty outline.
- **Fix:** In `runDraftChunk`, after `applyBriefOverrides`, throw if `brief.outline.sections.length === 0` before calling Claude.

---

## Recommended (not yet implemented)

### Brief API (`src/app/api/blog/brief/route.ts`)
| Item | Suggestion |
|------|------------|
| Status code | Return **404** for "Job not found" (currently 400) to align with research fetch and draft. |
| Error handling | In `catch`, call `jobStore.setChunkFailed(jobId, "analysis", message)` before sending error event, so job state stays consistent if something throws after `runBriefChunk` starts. |
| Logging | Add structured logs (e.g. `logBriefApi`) for start, complete, and error (jobId, duration, error message). |

### runBriefChunk (`src/lib/pipeline/chunks.ts`)
| Item | Suggestion |
|------|------------|
| Input validation | Validate `job.input` with `PipelineInputSchema` (like research fetch) and require non-empty `primaryKeyword`; throw early on invalid input. |
| Empty outline from GPT | If `brief.outline.sections.length === 0` after `buildResearchBrief`, throw with a clear message instead of saving. |
| Logging | Structured logs for start, topic-extraction, gpt-brief, and error. |

### Draft API (`src/app/api/blog/draft/route.ts`)
| Item | Suggestion |
|------|------------|
| Status code | Return **404** for "Job not found" (currently 400). |
| Error handling | In `catch`, call `jobStore.setChunkFailed(jobId, "draft", message)` before sending error event. |
| briefOverrides | Optional: validate with a Zod schema (`BriefOverridesSchema`) to reject malformed payloads (e.g. invalid `level`, negative `targetWords`). |
| Logging | Structured logs for start, complete, and error. |

### runDraftChunk
| Item | Suggestion |
|------|------------|
| Chunk failure | On throw, ensure `setChunkFailed(jobId, "draft", message)` is called (either here or in API catch). Currently only the API logs; chunk state may not be updated. |
| Logging | Structured logs for start, claude-draft, and error. |

### Optional
- **Brief idempotency:** If job already has a completed `analysis` chunk, optionally return it without re-running (or make it configurable via a query/body flag).
- **Outline validation in UI:** Disable "Generate Draft" when `editedOutline.length === 0` to avoid sending empty overrides.

---

## Summary

- **Done:** Reorder logic in `applyBriefOverrides` and empty-outline guard in `runDraftChunk`.
- **Next:** Align brief/draft APIs with research (404, setChunkFailed on error, structured logging), add input/override validation, and optional brief idempotency.
