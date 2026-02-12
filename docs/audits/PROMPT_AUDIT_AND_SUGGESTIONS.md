# Prompt Audit & Suggestions — Gemini, OpenAI, Claude

Quick take: **Your prompts are already strong** (Google Search Central, E-E-A-T, Rank Math, zero-hallucination, typography). Below are targeted improvements to make them more consistent, robust, and aligned with your pipeline.

**Status:** The suggestions below have been **implemented** across all three providers (Claude, OpenAI, Gemini) so that one model’s mistake doesn’t break the entire process.

---

## 1. Claude (main writer) — `src/lib/claude/client.ts`

### Strengths
- **SYSTEM_PROMPT**: Clear Google Search Central + E-E-A-T + practitioner voice; typography rules (no em-dash, straight quotes); banned phrases injected; Rank Math baked in.
- **writeDraft user prompt**: Brief-only input, mandatory outline, **ZERO HALLUCINATION** rule with mechanical check and examples; natural attribution; strict word count; 2 title/meta variants.
- **HALLUCINATION_FIX_SYSTEM**: Focused edit-only instructions; preserves HTML.

### Suggestions

| Area | Suggestion |
|------|------------|
| **Output length** | `max_tokens: 20000` can still truncate long articles. Consider 32k or adding to the user prompt: *"If you approach the response limit, prioritize completing the final H2 and FAQ; you may shorten middle sections."* |
| **Title variants** | You ask for "one sentiment word and one power word" in the system prompt but don’t repeat it in the user JSON spec. Add to the user prompt under OUTPUT: *"Each title must include one sentiment word (e.g. proven, essential) and one power word (e.g. guide, discover)."* |
| **FAQ uniqueness** | You already say FAQ answers must add something not in the body. Strengthen once in the user prompt: *"Each FAQ answer must include at least one of: a so-what, a comparison, a forward look, a caveat, or a concrete next step — not a condensed repeat of the body."* |
| **Lists vs tables** | You say "no HTML table tags" in several places; consider one explicit line in SYSTEM_PROMPT: *"Never output `<table>`. Use `<ul>` or `<ol>` for any tabular or list-style content."* |

---

## 2. OpenAI (extraction + brief) — `src/lib/openai/client.ts`

### Strengths
- **extractTopicsAndStyle**: EXTRACT-only framing; clear A–E sections; exact JSON schema; AI-likelihood check; word count note.
- **buildResearchBrief**: Very detailed — outline rules, best-version fields (similaritySummary, extraValueThemes, freshnessNote), content mix (lists, no tables), H3 requirement, GEO/SEO, post-generation validation (Rank Math, typography, fact-check, E-E-A-T).

### Suggestions

| Area | Suggestion |
|------|------------|
| **Word count note (extraction)** | You already say "STRICT — the target word count MUST be met (within ±5%)". Add to the wordCount object instruction: *"In the note field, include the exact sentence: 'STRICT — the target MUST be met within ±5%. Do not pad; do not fall short.'"* so it reliably flows into the brief. |
| **Brief → writer handoff** | In buildResearchBrief system prompt, add one line so the brief is writer-ready: *"Every outline section must have enough topics and targetWords that the writer can hit the total word count without padding."* |
| **extraValueThemes format** | Specify length: *"extraValueThemes: 3–6 short strings, each 5–12 words, actionable (e.g. 'Include 2025 pricing benchmarks' not 'Be fresh')."* |
| **Redundancy** | Some GEO/SEO rules are repeated in buildResearchBrief and again in Claude’s prompt. Fine for emphasis; if you ever shorten, keep the strictest version in one place (e.g. Claude) and reference it in the brief. |

---

## 3. Gemini — `src/lib/gemini/client.ts`

### Strengths
- **fetchCurrentData**: Short, clear ask (stats, recent developments, market data); JSON format; "do NOT invent data"; Google Search grounding + URL validation.
- **extractTopicsAndStyle**: Same A–E structure as OpenAI; prompt-first then articles to avoid "lost in the middle".

### Suggestions

| Area | Suggestion |
|------|------------|
| **fetchCurrentData** | Make the no-invention rule explicit: add *"If you cannot find a current statistic for a topic, omit it or say 'No current data found' in the fact text. Do not use numbers from training data."* |
| **fetchCurrentData JSON** | Ask for a fallback when empty: *"If no facts are found, return: {\"facts\": [], \"recentDevelopments\": [], \"lastUpdated\": \"No recent data found\"}."* so downstream code and the writer brief don’t assume missing keys. |
| **extractTopicsAndStyle (Gemini)** | Align with OpenAI’s word count instruction: add to section E) WORD COUNT: *"Note must state: STRICT — the target word count MUST be met within ±5%. Do not pad; do not fall short."* so both paths produce the same strictness. |
| **Schema consistency** | Gemini’s extractTopicsAndStyle JSON example is slightly looser than OpenAI’s. If you use both (e.g. A/B or fallback), add the same 6-key structure and "No markdown fences" line as in OpenAI so parsing is identical. |

---

## 4. Cross-cutting

| Topic | Suggestion |
|-------|------------|
| **Banned phrases** | You already use `getBannedPhrasesForPrompt()` in Claude. Consider adding 2–3 of the same high-impact phrases (e.g. "delve", "leverage", "comprehensive") to the OpenAI buildResearchBrief under "TYPOGRAPHY" or "WRITING QUALITY" so the brief nudges the writer away from them. |
| **Primary keyword in H2** | Rank Math expects keyword in at least one subheading. Claude’s user prompt says "Keyword in first 100 words and in at least one H2/H3". Add: *"Prefer the primary keyword or a close variant in at least one H2 (e.g. 'Best [Primary Keyword] Tools')."* so it’s explicit. |
| **Temperature** | Claude writeDraft 0.7, OpenAI 0.3, Gemini 0.3. Writer at 0.7 is reasonable for variety; if drafts are too loose, try 0.5–0.6. Extraction/brief at 0.3 is good for consistency. |
| **Structured output** | OpenAI uses `response_format: { type: "json_object" }`; Claude and Gemini rely on instructions. For Claude, you already have strong "Return only valid JSON" and repair logic. Optional: add a single line before the JSON block in the user prompt: *"Output only the JSON object below, no text before or after."* to reduce preamble. |

---

## 5. Summary table

| Provider | Role | Prompt quality | Top 2 changes |
|----------|------|----------------|---------------|
| **Claude** | Draft + hallucination fix | Strong | 1) Explicit "no `<table>`" in system; 2) Truncation hint or higher max_tokens for long articles. |
| **OpenAI** | Extract + Brief | Strong | 1) extraValueThemes format (5–12 words, actionable); 2) Brief line that outline must support hitting word count. |
| **Gemini** | Current data + Extract | Good | 1) Word count STRICT note in extraction (match OpenAI); 2) fetchCurrentData: explicit "omit or say no data" + empty JSON shape. |

Overall: prompts are in good shape. The suggestions above are incremental — they improve consistency across Gemini/OpenAI and make Claude’s constraints (no tables, title power words, FAQ uniqueness) even clearer without changing your architecture.
