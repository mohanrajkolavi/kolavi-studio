/**
 * ContentRegistry — Phase 4: Stat/Quote/Insight deduplication across sections.
 *
 * Problem: When writing section-by-section, each Claude call receives the FULL
 * arrays of facts, quotes, and insights. The LLM reuses the same stats and
 * quotes across multiple sections.
 *
 * Solution: After each section is written, detect which items were consumed,
 * then physically remove them from the arrays before the next section call.
 * The AI cannot repeat a quote if it is no longer in the context window.
 *
 * Pipeline position: Instantiated in the draft loop (chunks.ts / orchestrator.ts).
 * Called between section iterations to splice used items.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Fact {
  fact: string;
  source: string;
  date?: string;
}

export interface AlgorithmicInsight {
  type: "contrarian" | "correlation" | "myth_buster" | "practitioner_observation" | "framework_pillar";
  headline: string;
  explanation: string;
  supportingDataPoint?: string;
  whyCompetitorsMissedIt: string;
}

export interface UsageRecord {
  sectionIndex: number;
  sectionHeading: string;
  item: string;       // short description of what was matched
  matchType: "number" | "phrase" | "quote" | "insight";
  confidence: number; // 0-1
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract all numbers (integers, decimals, percentages, dollar amounts) from text. */
function extractNumbers(text: string): Set<string> {
  const nums = new Set<string>();
  // Match: $1.2B, 19%, 3.5x, 47, 1,200, etc.
  const matches = text.match(/\$?[\d,]+(?:\.\d+)?(?:\s*[%xX]|\s*(?:billion|million|trillion|percent))?/gi);
  if (matches) {
    for (const m of matches) {
      // Normalize: strip $ and commas, keep the core number + suffix
      const normalized = m.replace(/[$,]/g, "").trim().toLowerCase();
      if (normalized && normalized !== "0") nums.add(normalized);
    }
  }
  return nums;
}

/** Extract significant phrases (4+ words) from a quote for fuzzy matching. */
function extractPhrases(text: string, minWords: number = 4): string[] {
  // Clean HTML tags
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const words = clean.split(/\s+/);
  const phrases: string[] = [];

  // Sliding window: extract all 4-word, 5-word, 6-word sequences
  for (let len = minWords; len <= Math.min(minWords + 3, words.length); len++) {
    for (let i = 0; i <= words.length - len; i++) {
      phrases.push(words.slice(i, i + len).join(" "));
    }
  }
  return phrases;
}

/** Strip HTML tags and normalize whitespace for text matching. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// ContentRegistry
// ---------------------------------------------------------------------------

export class ContentRegistry {
  private usageLog: UsageRecord[] = [];

  /**
   * Analyze a section's output HTML and determine which facts, quotes,
   * and insights were consumed.
   *
   * Returns new arrays with consumed items removed (spliced).
   */
  markUsedAndFilter(
    sectionHtml: string,
    sectionIndex: number,
    sectionHeading: string,
    facts: Fact[],
    redditQuotes: string[],
    insights: AlgorithmicInsight[]
  ): {
    remainingFacts: Fact[];
    remainingQuotes: string[];
    remainingInsights: AlgorithmicInsight[];
    usedInThisSection: UsageRecord[];
  } {
    const sectionText = stripHtml(sectionHtml);
    const sectionNumbers = extractNumbers(sectionHtml);
    const used: UsageRecord[] = [];

    // --- 1. Match Facts by numbers ---
    const remainingFacts = facts.filter((f) => {
      const factNumbers = extractNumbers(f.fact);
      if (factNumbers.size === 0) return true; // keep non-numeric facts (qualitative)

      // Check if ANY of the fact's key numbers appear in the section output
      let matchCount = 0;
      for (const num of factNumbers) {
        if (sectionNumbers.has(num)) matchCount++;
        // Also check raw substring match for edge cases like "19%" appearing as-is
        if (sectionText.includes(num)) matchCount++;
      }

      const confidence = Math.min(matchCount / factNumbers.size, 1);
      if (confidence >= 0.5) {
        used.push({
          sectionIndex,
          sectionHeading,
          item: f.fact.slice(0, 80),
          matchType: "number",
          confidence,
        });
        return false; // remove from remaining
      }
      return true; // keep
    });

    // --- 2. Match Reddit Quotes by phrase overlap ---
    const remainingQuotes = redditQuotes.filter((q) => {
      const quotePhrases = extractPhrases(q, 4);
      if (quotePhrases.length === 0) return true;

      let matchedPhrases = 0;
      for (const phrase of quotePhrases) {
        if (sectionText.includes(phrase)) {
          matchedPhrases++;
          if (matchedPhrases >= 2) break; // 2+ phrase matches = confident
        }
      }

      // Even 1 4-word phrase match is significant for quotes
      if (matchedPhrases >= 1) {
        used.push({
          sectionIndex,
          sectionHeading,
          item: q.slice(0, 80),
          matchType: "quote",
          confidence: Math.min(matchedPhrases / 2, 1),
        });
        return false; // remove
      }
      return true; // keep
    });

    // --- 3. Match Insights by headline keywords ---
    const remainingInsights = insights.filter((ins) => {
      // Check if insight headline words appear in section
      const headlineWords = ins.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3); // skip short words

      if (headlineWords.length === 0) return true;

      let matched = 0;
      for (const w of headlineWords) {
        if (sectionText.includes(w)) matched++;
      }

      const confidence = matched / headlineWords.length;
      // Need at least 60% of headline words to match
      if (confidence >= 0.6) {
        used.push({
          sectionIndex,
          sectionHeading,
          item: `[${ins.type}] ${ins.headline.slice(0, 60)}`,
          matchType: "insight",
          confidence,
        });
        return false; // remove
      }
      return true; // keep
    });

    this.usageLog.push(...used);

    return { remainingFacts, remainingQuotes, remainingInsights, usedInThisSection: used };
  }

  /** Get the full usage log for debugging. */
  getUsageLog(): UsageRecord[] {
    return [...this.usageLog];
  }

  /** Summary string for logging. */
  getSummary(): string {
    const byType = { number: 0, phrase: 0, quote: 0, insight: 0 };
    for (const r of this.usageLog) byType[r.matchType]++;
    return `ContentRegistry: ${this.usageLog.length} items consumed (${byType.number} facts, ${byType.quote} quotes, ${byType.insight} insights)`;
  }
}

// ---------------------------------------------------------------------------
// Style Linter — Phase 5 lightweight checks
// ---------------------------------------------------------------------------

export interface StyleViolation {
  type: "definition_opening" | "robotic_transition" | "duplicate_stat";
  location: string;      // section heading or "intro"
  evidence: string;      // the offending text
  suggestion: string;    // what to do
}

/**
 * Lint the assembled HTML for common AI writing fingerprints.
 * Runs post-draft, before validation.
 */
export function lintDraft(html: string, primaryKeyword: string): StyleViolation[] {
  const violations: StyleViolation[] = [];
  const text = stripHtml(html);

  // --- 1. Definition Opening Detection ---
  // Catches: "Content marketing is the strategic creation and distribution..."
  // Also catches comma-splice variant: "Content marketing, [stat], is the strategic..."
  const defPatterns = [
    // Direct: "X is the [noun] of"
    new RegExp(
      `${escapeRegex(primaryKeyword)}[^.]{0,60}\\bis the\\b[^.]{0,30}\\b(?:process|practice|method|strategy|art|act|discipline|creation|approach|technique|science)\\b`,
      "i"
    ),
    // Comma-splice: "X, [anything], is the strategic..."
    new RegExp(
      `${escapeRegex(primaryKeyword)}\\s*,\\s*[^,]{5,80},\\s*is the\\b[^.]{0,60}\\b(?:creation|distribution|development|process|practice|method|strategy)\\b`,
      "i"
    ),
    // "X refers to" / "X can be defined as"
    new RegExp(
      `${escapeRegex(primaryKeyword)}[^.]{0,20}\\b(?:refers to|can be defined as|is defined as|encompasses)\\b`,
      "i"
    ),
  ];

  for (const pat of defPatterns) {
    const match = text.match(pat);
    if (match) {
      violations.push({
        type: "definition_opening",
        location: "intro",
        evidence: match[0].slice(0, 120),
        suggestion: "Replace dictionary definition with an opinionated claim + entity + specific data point.",
      });
      break; // one is enough
    }
  }

  // --- 2. Robotic Transition Detection ---
  // Catches: "...which is why the CRAFT Framework's X pillar..."
  //          "...which brings us to..."
  //          "...this is where... comes in"
  const roboticPatterns = [
    /which is (?:exactly )?why (?:the |our |this )/gi,
    /which brings us to/gi,
    /this is where .{3,40} comes? in/gi,
    /let'?s (?:now )?(?:explore|examine|look at|dive into|turn to)/gi,
    /(?:now|next),? let'?s/gi,
    /in the next section/gi,
    /as (?:we'll|we will) (?:see|explore|discuss) (?:in|below|next)/gi,
  ];

  for (const pat of roboticPatterns) {
    let match;
    while ((match = pat.exec(text)) !== null) {
      // Find surrounding context
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      violations.push({
        type: "robotic_transition",
        location: "body",
        evidence: text.slice(start, end),
        suggestion: "Remove the meta-narration. End the paragraph with a forward-looking claim or data point instead.",
      });
    }
  }

  // --- 3. Duplicate Stat Detection (post-assembly) ---
  // Extract all numbers with context and check for repeats
  const statContexts: Map<string, string[]> = new Map();
  const statPattern = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(%|percent|billion|million|x)\b/gi;
  let statMatch;
  while ((statMatch = statPattern.exec(text)) !== null) {
    const key = statMatch[1].replace(/,/g, "") + statMatch[2].toLowerCase().replace("percent", "%");
    const context = text.slice(Math.max(0, statMatch.index - 40), statMatch.index + statMatch[0].length + 40);
    if (!statContexts.has(key)) statContexts.set(key, []);
    statContexts.get(key)!.push(context);
  }

  for (const [stat, contexts] of statContexts) {
    if (contexts.length > 1) {
      violations.push({
        type: "duplicate_stat",
        location: "multiple sections",
        evidence: `"${stat}" appears ${contexts.length} times`,
        suggestion: `Use the stat once. In other sections, reference it obliquely: "the cost advantage mentioned earlier" or "that same efficiency gap."`,
      });
    }
  }

  return violations;
}

/** Escape string for use in RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Auto-fix definition openings in HTML.
 * Removes the first sentence of the article if it matches a definition pattern.
 */
export function fixDefinitionOpening(html: string, primaryKeyword: string): string {
  // Match the first <p> tag content
  const firstPMatch = html.match(/^(\s*<p[^>]*>)([\s\S]*?)(<\/p>)/i);
  if (!firstPMatch) return html;

  const pContent = firstPMatch[2];
  const kw = primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Check if first sentence is a definition
  const defPattern = new RegExp(
    `^\\s*(?:<[^>]+>)*\\s*${kw}[^.]*?\\bis the\\b[^.]*(?:process|practice|method|strategy|creation|distribution|development|approach|technique|discipline|art|act|science)[^.]*\\.\\s*`,
    "i"
  );

  const match = pContent.match(defPattern);
  if (match) {
    // Remove the definition sentence, keep the rest of the paragraph
    const cleaned = pContent.replace(defPattern, "").trim();
    if (cleaned.length > 20) {
      return html.replace(firstPMatch[0], `${firstPMatch[1]}${cleaned}${firstPMatch[3]}`);
    }
  }

  return html;
}
