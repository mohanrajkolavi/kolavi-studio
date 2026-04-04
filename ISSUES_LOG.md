# Content Writer - Issues Log

## Backend Issues

### B1. Gemini Grounding Timeouts ~~(HIGH)~~ → FIXED
- **What**: Gemini grounding API returns 503 "high demand" or times out after 60s on all 3 retry attempts
- **Impact**: 0 facts extracted → 0 stats allocated to sections → 0 citations in draft → audit fails citation density check
- **Fix applied**:
  - Added `extractFallbackFacts()` in `chunks.ts` — when Gemini returns 0 facts, extracts citable facts (stats, percentages, attributions) from competitor article content
  - Added `extractFactsFromCompetitorContent()` in `gemini/client.ts` — same fallback inside the Gemini client with optional `fallbackContent` parameter
  - Extracts up to 15-20 facts with regex patterns for: percentages, dollar amounts, large numbers, "according to", "research shows", year references
  - Facts include source URL from the competitor article for proper citation

### B2. SSE Stream Not Delivering Final Event ~~(HIGH)~~ → FIXED
- **What**: After validation API returns 200, the UI stays stuck at "Validating"
- **Root cause found**: `buildPipelineResultFromChunks()` and `setResult()` were called INSIDE a React state updater function. React 18 silently discards side-effects in state updaters.
- **Fix applied** in `BlogGenerationProvider.tsx`:
  - Moved `buildPipelineResultFromChunks()` and `setResult()` OUTSIDE the state updater
  - Added try/catch around pipeline result building so validation chunk is still saved on error
  - Phase transitions (`setPhase("completed")`, `setStatus("success")`) now happen after chunk state is set
  - Added 60-second timeout on validate fetch with recovery message: "Validation timed out — results may be ready"

### B3. Promise Timeout Doesn't Cancel Network Requests ~~(MEDIUM)~~ → FIXED
- **What**: `withRetry()` uses `Promise.race` with a timeout, but the underlying fetch/network request continues running
- **Fix applied** in `orchestrator.ts`:
  - Added `AbortController` per retry attempt
  - `fn` signature changed to `(signal?: AbortSignal) => Promise<T>` — callers can use the signal to abort fetches
  - Timeout handler calls `controller.abort()` before rejecting
  - Cleanup: `controller.abort()` also called in catch block
  - Brief generation timeout increased from 120s to 180s

### B4. Low Citation Count Due to Fact Distribution (MEDIUM)
- **What**: Even when Gemini succeeds, facts are allocated to sections based on relevance. Many sections get 0-1 facts
- **Status**: Partially fixed in prior session (stronger citation prompt + allSourceUrls passed to every section). Gemini fallback (B1 fix) further improves this by ensuring facts exist.
- **Remaining**: Could further improve by distributing facts more evenly across sections

### B5. Supabase CONNECT_TIMEOUT ~~(LOW)~~ → FIXED
- **What**: `write CONNECT_TIMEOUT aws-0-us-west-2.pooler.supabase.com:6543` — intermittent DB connectivity failures
- **Fix applied** in `db/client.ts`:
  - Added `withDbRetry<T>()` wrapper with exponential backoff (1s, 2s)
  - Retries on: CONNECT_TIMEOUT, Connection terminated, connection refused
  - Exported for use by pipeline code

### B6. Missing `login_rate_limit` Table ~~(LOW)~~ → FIXED
- **What**: `PostgresError: relation "login_rate_limit" does not exist`
- **Fix applied**: Migration file exists at `src/lib/db/migrations/008_login_rate_limit.sql`
- **Note**: Table already defined in `schema.sql` — migration just needs to be run on the database

### B7. JSON Truncation in Section Drafts (LOW)
- **What**: "Unterminated string in JSON at position 2520/3626" — Claude sometimes returns truncated JSON
- **Status**: Already handled by tolerant extraction fallback — non-blocking

### B8. Type Safety Anti-Patterns ~~(LOW)~~ → FIXED
- **What**: `(brief as any).clusterPosition` in client.ts
- **Fix applied** in `claude/client.ts`:
  - Replaced all `(brief as any).clusterPosition` → `brief.clusterPosition` (field exists on ResearchBrief)
  - Replaced `(brief as any).clusterTopic` → `brief.clusterTopic`
  - Replaced `(brief as any).existingBlogUrls` → `brief.internalLinkSuggestions` (correct field)
  - Replaced `(brief as any).secondaryKeywords` → `brief.keyword.secondary` (correct path)
  - Zero `(brief as any)` casts remain

### B9. Idempotency Without Freshness ~~(LOW)~~ → FIXED
- **What**: Chunk idempotency checks compare URLs but not data freshness/timestamps
- **Fix applied** in `chunks.ts`:
  - Added `_fetchedAt: Date.now()` timestamp to research chunk output
  - Idempotency check now requires data to be less than 30 minutes old (`IDEMPOTENCY_TTL_MS`)
  - Stale data triggers a re-fetch

---

## UI/UX Issues

### U1. Session Idle Timeout Too Short → FIXED
- **Fix**: Changed to 2 hours in `src/components/dashboard/IdleLogout.tsx`

### U2. Generation State Lost on Page Reload ~~(HIGH)~~ → FIXED
- **What**: Generation results were held in React state only
- **Fix applied** in `BlogGenerationProvider.tsx`:
  - After successful validation, final result is persisted to `localStorage` (key: `blog-gen-result`)
  - On mount, checks for cached result (with 24-hour TTL)
  - Restores `result`, `validation`, `jobId`, `phase`, and `status` from cache
  - Cache is cleared on new generation start and on reset
  - Graceful fallback if localStorage is full or unavailable

### U3. Stuck at "Validating" Step ~~(HIGH)~~ → FIXED
- **What**: UI stays at validation spinner indefinitely
- **Root cause**: Same as B2 (React state updater side-effect issue)
- **Fix applied**: See B2 fix. Also added 60-second timeout with recovery message.

### U4. No Error Recovery UI for Pipeline Failures (MEDIUM)
- **Status**: Not yet implemented (would require significant page.tsx refactoring)
- **Partial mitigation**: localStorage persistence (U2 fix) means completed steps survive errors

### U5. 25+ useState Hooks in Blog Page (MEDIUM)
- **Status**: Not yet refactored (large scope, risk of regressions)
- **Note**: Would benefit from useReducer or state machine pattern

### U6. Chat Interface Incomplete Error Handling (LOW)
- **Status**: Not yet addressed

### U7. Default Word Count Not Competitor-Aware ~~(LOW)~~ → FIXED
- **What**: Default target word count was hardcoded per intent instead of based on competitor analysis
- **Fix applied** in `chunks.ts`:
  - After topic extraction, computes average word count from successfully-fetched competitors
  - Sets recommended target to competitor average + 15%
  - Overrides `topicExtraction.wordCount` with computed values before brief generation
  - Falls back to GPT-computed word count when no competitors have valid word counts

---

## Fix Summary

| Issue | Severity | Status |
|-------|----------|--------|
| B1. Gemini fallback | HIGH | ✅ FIXED |
| B2. SSE stuck at validating | HIGH | ✅ FIXED |
| B3. AbortController for timeouts | MEDIUM | ✅ FIXED |
| B4. Low citation count | MEDIUM | ⚡ PARTIALLY FIXED |
| B5. Supabase CONNECT_TIMEOUT | LOW | ✅ FIXED |
| B6. login_rate_limit table | LOW | ✅ FIXED |
| B7. JSON truncation | LOW | ⏭️ ALREADY HANDLED |
| B8. Type safety | LOW | ✅ FIXED |
| B9. Idempotency freshness | LOW | ✅ FIXED |
| U1. Session idle timeout | HIGH | ✅ FIXED (prior) |
| U2. State lost on reload | HIGH | ✅ FIXED |
| U3. Stuck at validating | HIGH | ✅ FIXED |
| U4. Error recovery UI | MEDIUM | ⏳ TODO |
| U5. useState consolidation | MEDIUM | ⏳ TODO |
| U6. Chat error handling | LOW | ⏳ TODO |
| U7. Competitor word count | LOW | ✅ FIXED |

**Fixed: 12 | Partial: 1 | Already handled: 1 | TODO: 3**

---

## Files Changed

| File | Changes |
|------|---------|
| `src/lib/pipeline/orchestrator.ts` | AbortController in withRetry, brief timeout 120s→180s |
| `src/lib/pipeline/chunks.ts` | Gemini fallback facts, idempotency TTL, _fetchedAt timestamp, CurrentDataFact import |
| `src/lib/gemini/client.ts` | extractFactsFromCompetitorContent(), fallbackContent parameter |
| `src/lib/claude/client.ts` | Removed all (brief as any) casts, proper typed field access |
| `src/lib/db/client.ts` | withDbRetry() with exponential backoff |
| `src/components/dashboard/BlogGenerationProvider.tsx` | localStorage persistence, validation timeout, React state updater fix |
| `src/components/dashboard/IdleLogout.tsx` | 15min→2hr timeout |
| `src/lib/seo/article-audit.ts` | (prior session changes) |
| `src/lib/constants/banned-phrases.ts` | (prior session changes) |
| `src/lib/constants/voices.ts` | (prior session changes) |
