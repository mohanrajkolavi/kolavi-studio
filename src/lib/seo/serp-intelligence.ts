/**
 * SERP Intelligence Module (P6)
 *
 * Provides 3Cs SERP analysis (Content type, Content format, Content angle),
 * information gain scoring, and competitive gap detection.
 *
 * Analyzes top-ranking competitor articles to determine:
 * 1. What content TYPE ranks (listicle, how-to, guide, comparison, review)
 * 2. What content FORMAT dominates (long-form, step-by-step, data-heavy, opinion)
 * 3. What content ANGLE works (beginner, advanced, budget, enterprise, 2024, etc.)
 * 4. Information gain opportunities — what competitors collectively miss
 *
 * Used in brief generation to guide content strategy.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentType =
  | "how-to"
  | "listicle"
  | "guide"
  | "comparison"
  | "review"
  | "case-study"
  | "opinion"
  | "news"
  | "tool-page"
  | "resource";

export type ContentFormat =
  | "long-form"
  | "step-by-step"
  | "data-heavy"
  | "narrative"
  | "visual-heavy"
  | "qa-format"
  | "mixed";

export type ContentAngle =
  | "beginner"
  | "advanced"
  | "budget"
  | "enterprise"
  | "current-year"
  | "contrarian"
  | "case-study-driven"
  | "data-driven"
  | "practitioner"
  | "neutral";

export type CompetitorSerpProfile = {
  url: string;
  title: string;
  position: number;
  contentType: ContentType;
  contentFormat: ContentFormat;
  contentAngle: ContentAngle;
  wordCount: number;
  h2Count: number;
  listCount: number;
  hasFaq: boolean;
  hasTableOfContents: boolean;
  citationCount: number;
  /** Unique topics/subtopics covered by this competitor. */
  topicsCovered: string[];
  /** Estimated information gain score 0-100 (higher = more unique value). */
  informationGainScore: number;
};

export type SerpPattern = {
  /** Dominant content type in SERP. */
  dominantType: ContentType;
  /** Confidence (what % of results match). */
  typeConfidence: number;
  /** Dominant content format. */
  dominantFormat: ContentFormat;
  /** Format confidence. */
  formatConfidence: number;
  /** Most common content angle. */
  dominantAngle: ContentAngle;
  /** Angle confidence. */
  angleConfidence: number;
};

export type InformationGainOpportunity = {
  /** Topic or subtopic that's underserved. */
  topic: string;
  /** How many competitors cover it (0 = nobody, 1 = only one, etc.). */
  competitorCoverage: number;
  /** Why this represents information gain. */
  reason: string;
  /** Priority: high (0 competitors), medium (1 competitor), low (2+ but shallow). */
  priority: "high" | "medium" | "low";
};

export type SerpIntelligenceResult = {
  /** Per-competitor analysis. */
  competitors: CompetitorSerpProfile[];
  /** Dominant SERP patterns. */
  patterns: SerpPattern;
  /** Content strategy recommendation. */
  recommendation: {
    /** Recommended content type (match or differentiate). */
    contentType: ContentType;
    /** Recommended format. */
    contentFormat: ContentFormat;
    /** Recommended angle. */
    contentAngle: ContentAngle;
    /** Target word count (competitor average + 10-15%). */
    targetWordCount: number;
    /** Strategy explanation. */
    rationale: string;
  };
  /** Information gain opportunities. */
  informationGainOpportunities: InformationGainOpportunity[];
  /** Featured snippet strategy. */
  featuredSnippetStrategy: {
    /** Whether SERP has a featured snippet. */
    hasFeaturedSnippet: boolean;
    /** Type of snippet to target. */
    targetType: "definition" | "list" | "table" | "step" | "none";
    /** Specific guidance. */
    guidance: string;
  };
  /** Overall SERP difficulty assessment. */
  difficulty: "easy" | "medium" | "hard" | "very-hard";
  difficultyReason: string;
};

// ---------------------------------------------------------------------------
// Content type detection
// ---------------------------------------------------------------------------

function detectContentType(title: string, content: string, headings: string[]): ContentType {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  const headingText = headings.join(" ").toLowerCase();

  // How-to: "how to", step-by-step numbered instructions
  if (
    lowerTitle.includes("how to") ||
    lowerTitle.includes("step-by-step") ||
    /step\s+\d+/i.test(headingText)
  ) {
    return "how-to";
  }

  // Listicle: "X best", "top X", numbered heading patterns
  if (
    /^\d+\s+(?:best|top|ways|tips|tools|strategies|examples|reasons)/i.test(lowerTitle) ||
    /^(?:best|top)\s+\d+/i.test(lowerTitle)
  ) {
    return "listicle";
  }

  // Comparison: "vs", "comparison", "versus", "compared"
  if (
    /\bvs\.?\b|\bversus\b|\bcompar/i.test(lowerTitle) ||
    /\bvs\.?\b|\balternatives?\b/i.test(headingText)
  ) {
    return "comparison";
  }

  // Review: "review", "honest", "is X worth"
  if (/\breview\b|\bhonest\b|\bis\s+\w+\s+worth\b/i.test(lowerTitle)) {
    return "review";
  }

  // Case study
  if (/\bcase\s+stud/i.test(lowerTitle) || /\bcase\s+stud/i.test(headingText)) {
    return "case-study";
  }

  // Guide: "guide", "complete", "ultimate", "definitive"
  if (/\bguide\b|\bcomplete\b|\bultimate\b|\bdefinitive\b/i.test(lowerTitle)) {
    return "guide";
  }

  // News/updates
  if (/\b20\d{2}\b.*\bupdate\b|\bnews\b|\bannounce/i.test(lowerTitle)) {
    return "news";
  }

  // Default based on content signals
  const listItems = (content.match(/<li/gi) ?? []).length;
  const wordCount = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  if (listItems > 10 && listItems > headings.length * 2) return "listicle";
  if (wordCount > 3000) return "guide";
  return "guide";
}

// ---------------------------------------------------------------------------
// Content format detection
// ---------------------------------------------------------------------------

function detectContentFormat(content: string, headings: string[], wordCount: number): ContentFormat {
  const listItems = (content.match(/<li/gi) ?? []).length;
  const paragraphs = (content.match(/<p/gi) ?? []).length;
  const stepPattern = headings.filter((h) => /step\s+\d+|^\d+\./i.test(h)).length;
  const dataPatterns = (content.match(/\d+(?:\.\d+)?%|\$\d|(?:increased|decreased|grew|dropped)\s+by/gi) ?? []).length;
  const imgCount = (content.match(/<img/gi) ?? []).length;

  if (stepPattern >= 3) return "step-by-step";
  if (dataPatterns > wordCount / 200) return "data-heavy";
  if (imgCount > headings.length) return "visual-heavy";
  if (listItems > paragraphs * 0.8) return "qa-format";
  if (wordCount > 2500 && paragraphs > 15) return "long-form";
  if (paragraphs > 8 && listItems < 5) return "narrative";
  return "mixed";
}

// ---------------------------------------------------------------------------
// Content angle detection
// ---------------------------------------------------------------------------

function detectContentAngle(title: string, content: string): ContentAngle {
  const lower = (title + " " + content.slice(0, 2000)).toLowerCase();

  if (/\b20\d{2}\b/.test(title)) return "current-year";
  if (/\bbeginner|getting started|introduction to|basics of|101\b/i.test(lower)) return "beginner";
  if (/\badvanced|expert|pro tips|in-depth|deep dive\b/i.test(lower)) return "advanced";
  if (/\bbudget|cheap|affordable|free|low.cost\b/i.test(lower)) return "budget";
  if (/\benterprise|scaling|large.scale|fortune 500\b/i.test(lower)) return "enterprise";
  if (/\bcontrary|myth|wrong|actually|misconception\b/i.test(lower)) return "contrarian";
  if (/\bcase study|results|we tested|experiment\b/i.test(lower)) return "case-study-driven";
  if (/\bdata|research|study found|survey|statistics\b/i.test(lower)) return "data-driven";
  if (/\bfrom experience|in practice|real.world|hands.on\b/i.test(lower)) return "practitioner";
  return "neutral";
}

// ---------------------------------------------------------------------------
// Information gain scoring
// ---------------------------------------------------------------------------

function extractTopicsFromContent(content: string, headings: string[]): string[] {
  const topics = new Set<string>();

  // Add heading-derived topics
  for (const h of headings) {
    const cleaned = h.replace(/^\d+[\.\)]\s*/, "").replace(/^(?:how to|why|what is|when to)\s+/i, "").trim();
    if (cleaned.length > 3) topics.add(cleaned.toLowerCase());
  }

  // Extract key noun phrases from first sentence of each section
  const sections = content.split(/<h[23][^>]*>/i);
  for (const section of sections) {
    const firstP = section.match(/<p[^>]*>(.*?)<\/p>/i);
    if (firstP) {
      const text = firstP[1].replace(/<[^>]+>/g, "").trim();
      // Extract 2-4 word noun phrases
      const phrases = text.match(/\b[A-Z][a-z]+(?:\s+[a-z]+){1,3}/g);
      if (phrases) {
        for (const p of phrases.slice(0, 3)) {
          topics.add(p.toLowerCase());
        }
      }
    }
  }

  return [...topics];
}

function scoreInformationGain(
  competitorTopics: string[][],
  targetTopics: string[],
): number {
  if (competitorTopics.length === 0) return 100;

  const allCompetitorTopics = new Set(competitorTopics.flat());
  let uniqueTopics = 0;

  for (const topic of targetTopics) {
    const isUnique = ![...allCompetitorTopics].some(
      (ct) => ct.includes(topic) || topic.includes(ct)
    );
    if (isUnique) uniqueTopics++;
  }

  return targetTopics.length > 0
    ? Math.round((uniqueTopics / targetTopics.length) * 100)
    : 0;
}

// ---------------------------------------------------------------------------
// Difficulty assessment
// ---------------------------------------------------------------------------

function assessDifficulty(
  competitors: CompetitorSerpProfile[],
): { difficulty: SerpIntelligenceResult["difficulty"]; reason: string } {
  if (competitors.length === 0) return { difficulty: "easy", reason: "No competing content found" };

  const avgWordCount = competitors.reduce((s, c) => s + c.wordCount, 0) / competitors.length;
  const avgCitations = competitors.reduce((s, c) => s + c.citationCount, 0) / competitors.length;
  const avgH2 = competitors.reduce((s, c) => s + c.h2Count, 0) / competitors.length;
  const hasFaqCount = competitors.filter((c) => c.hasFaq).length;

  let difficultyScore = 0;
  const reasons: string[] = [];

  if (avgWordCount > 3000) { difficultyScore += 2; reasons.push(`avg ${Math.round(avgWordCount)} words`); }
  else if (avgWordCount > 2000) { difficultyScore += 1; }

  if (avgCitations > 10) { difficultyScore += 2; reasons.push(`avg ${Math.round(avgCitations)} citations`); }
  else if (avgCitations > 5) { difficultyScore += 1; }

  if (avgH2 > 8) { difficultyScore += 1; reasons.push(`avg ${Math.round(avgH2)} sections`); }
  if (hasFaqCount >= competitors.length * 0.5) { difficultyScore += 1; reasons.push("most have FAQ"); }

  if (difficultyScore >= 5) return { difficulty: "very-hard", reason: `High competition: ${reasons.join(", ")}` };
  if (difficultyScore >= 3) return { difficulty: "hard", reason: `Strong competition: ${reasons.join(", ")}` };
  if (difficultyScore >= 2) return { difficulty: "medium", reason: `Moderate competition: ${reasons.join(", ")}` };
  return { difficulty: "easy", reason: "Low competition in content quality" };
}

// ---------------------------------------------------------------------------
// Pattern detection (mode finding)
// ---------------------------------------------------------------------------

function findDominant<T extends string>(values: T[]): { value: T; confidence: number } {
  if (values.length === 0) return { value: "guide" as T, confidence: 0 };

  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  let maxCount = 0;
  let dominant: T = values[0];
  for (const [v, c] of counts) {
    if (c > maxCount) { maxCount = c; dominant = v; }
  }

  return { value: dominant, confidence: Math.round((maxCount / values.length) * 100) };
}

// ---------------------------------------------------------------------------
// Featured snippet strategy
// ---------------------------------------------------------------------------

function determineFeaturedSnippetStrategy(
  competitors: CompetitorSerpProfile[],
  serpFeatures?: { hasFeaturedSnippet?: boolean },
): SerpIntelligenceResult["featuredSnippetStrategy"] {
  const hasFeaturedSnippet = serpFeatures?.hasFeaturedSnippet ?? false;
  const dominantType = findDominant(competitors.map((c) => c.contentType)).value;

  if (dominantType === "how-to") {
    return {
      hasFeaturedSnippet,
      targetType: "step",
      guidance: "Include numbered steps with concise descriptions. First step should appear in the first 300 words. Use 'Step 1:', 'Step 2:' format in H3s.",
    };
  }

  if (dominantType === "listicle") {
    return {
      hasFeaturedSnippet,
      targetType: "list",
      guidance: "Structure key items as a bulleted or numbered list with 5-8 items. Include the list early in the article (first 500 words).",
    };
  }

  if (dominantType === "comparison") {
    return {
      hasFeaturedSnippet,
      targetType: "table",
      guidance: "Include a comparison summary as a structured bulleted list (tables banned in our system). Lead with the key differentiator in the first paragraph.",
    };
  }

  return {
    hasFeaturedSnippet,
    targetType: "definition",
    guidance: "Include a 40-60 word definition paragraph in the introduction that directly answers the search query. This is the #1 featured snippet format.",
  };
}

// ---------------------------------------------------------------------------
// Information gain opportunities
// ---------------------------------------------------------------------------

function findInformationGainOpportunities(
  competitorProfiles: CompetitorSerpProfile[],
): InformationGainOpportunity[] {
  if (competitorProfiles.length === 0) return [];

  // Collect all topics across all competitors
  const topicCoverage = new Map<string, number>();
  for (const comp of competitorProfiles) {
    for (const topic of comp.topicsCovered) {
      topicCoverage.set(topic, (topicCoverage.get(topic) ?? 0) + 1);
    }
  }

  const opportunities: InformationGainOpportunity[] = [];
  const totalCompetitors = competitorProfiles.length;

  // Find topics covered by few competitors
  for (const [topic, count] of topicCoverage) {
    if (count <= 1) {
      opportunities.push({
        topic,
        competitorCoverage: count,
        reason: count === 0
          ? "No competitor covers this topic — high information gain"
          : "Only 1 competitor covers this — opportunity for differentiation",
        priority: count === 0 ? "high" : "medium",
      });
    }
  }

  // Also identify common topics that ALL competitors cover but shallowly
  // (high coverage count means we MUST cover them, but they're not gaps)

  opportunities.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return opportunities.slice(0, 15);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export type SerpIntelligenceInput = {
  /** Competitor articles with content. */
  competitors: {
    url: string;
    title: string;
    content: string;
    wordCount: number;
    position?: number;
  }[];
  /** SERP features detected. */
  serpFeatures?: {
    hasFeaturedSnippet?: boolean;
    hasKnowledgeGraph?: boolean;
    hasAnswerBox?: boolean;
  };
  /** Target word count for our article. */
  targetWordCount?: number;
};

/**
 * Analyze SERP composition using the 3Cs framework:
 * Content Type, Content Format, Content Angle.
 * Returns strategic recommendations and information gain opportunities.
 */
export function analyzeSerpIntelligence(input: SerpIntelligenceInput): SerpIntelligenceResult {
  const { competitors, serpFeatures, targetWordCount } = input;

  if (competitors.length === 0) {
    return {
      competitors: [],
      patterns: {
        dominantType: "guide",
        typeConfidence: 0,
        dominantFormat: "long-form",
        formatConfidence: 0,
        dominantAngle: "neutral",
        angleConfidence: 0,
      },
      recommendation: {
        contentType: "guide",
        contentFormat: "long-form",
        contentAngle: "practitioner",
        targetWordCount: targetWordCount ?? 2500,
        rationale: "No competitor data available — defaulting to comprehensive guide with practitioner angle",
      },
      informationGainOpportunities: [],
      featuredSnippetStrategy: {
        hasFeaturedSnippet: false,
        targetType: "definition",
        guidance: "Include a 40-60 word definition in the introduction.",
      },
      difficulty: "easy",
      difficultyReason: "No competing content analyzed",
    };
  }

  // Analyze each competitor
  const profiles: CompetitorSerpProfile[] = competitors.map((comp, idx) => {
    const headings = extractHeadings(comp.content);
    const topics = extractTopicsFromContent(comp.content, headings);
    const contentType = detectContentType(comp.title, comp.content, headings);
    const contentFormat = detectContentFormat(comp.content, headings, comp.wordCount);
    const contentAngle = detectContentAngle(comp.title, comp.content);

    const listCount = (comp.content.match(/<(?:ul|ol)[^>]*>/gi) ?? []).length;
    const citationCount = (comp.content.match(/<sup/gi) ?? []).length;
    const hasFaq = /<h[23][^>]*>[^<]*(?:faq|frequently asked|common questions)/i.test(comp.content);
    const hasTableOfContents = /table of contents|in this article/i.test(comp.content);

    return {
      url: comp.url,
      title: comp.title,
      position: comp.position ?? idx + 1,
      contentType,
      contentFormat,
      contentAngle,
      wordCount: comp.wordCount,
      h2Count: headings.filter((h) => h.startsWith("h2:")).length || headings.length,
      listCount,
      hasFaq,
      hasTableOfContents,
      citationCount,
      topicsCovered: topics,
      informationGainScore: 0, // Computed below
    };
  });

  // Compute information gain scores
  for (let i = 0; i < profiles.length; i++) {
    const otherTopics = profiles
      .filter((_, j) => j !== i)
      .map((p) => p.topicsCovered);
    profiles[i].informationGainScore = scoreInformationGain(
      otherTopics,
      profiles[i].topicsCovered,
    );
  }

  // Find patterns
  const typeResult = findDominant(profiles.map((p) => p.contentType));
  const formatResult = findDominant(profiles.map((p) => p.contentFormat));
  const angleResult = findDominant(profiles.map((p) => p.contentAngle));

  const patterns: SerpPattern = {
    dominantType: typeResult.value,
    typeConfidence: typeResult.confidence,
    dominantFormat: formatResult.value,
    formatConfidence: formatResult.confidence,
    dominantAngle: angleResult.value,
    angleConfidence: angleResult.confidence,
  };

  // Generate recommendation
  const avgWordCount = profiles.reduce((s, p) => s + p.wordCount, 0) / profiles.length;
  const recommendedWordCount = targetWordCount ?? Math.round(avgWordCount * 1.15);

  // Choose differentiation angle if SERP is homogeneous
  let recAngle = patterns.dominantAngle;
  if (patterns.angleConfidence > 75 && recAngle !== "practitioner") {
    recAngle = "practitioner"; // Differentiate with practitioner expertise
  }

  const recommendation = {
    contentType: patterns.dominantType,
    contentFormat: patterns.dominantFormat,
    contentAngle: recAngle,
    targetWordCount: recommendedWordCount,
    rationale: buildRationale(patterns, profiles, recAngle),
  };

  // Information gain opportunities
  const infoGainOpps = findInformationGainOpportunities(profiles);

  // Featured snippet strategy
  const featuredSnippetStrategy = determineFeaturedSnippetStrategy(profiles, serpFeatures);

  // Difficulty
  const { difficulty, reason: difficultyReason } = assessDifficulty(profiles);

  return {
    competitors: profiles,
    patterns,
    recommendation,
    informationGainOpportunities: infoGainOpps,
    featuredSnippetStrategy,
    difficulty,
    difficultyReason,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const re = /<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    headings.push(text);
  }
  return headings;
}

function buildRationale(
  patterns: SerpPattern,
  profiles: CompetitorSerpProfile[],
  chosenAngle: ContentAngle,
): string {
  const parts: string[] = [];

  if (patterns.typeConfidence > 60) {
    parts.push(`SERP dominated by ${patterns.dominantType} content (${patterns.typeConfidence}% of results) — match this format.`);
  } else {
    parts.push(`Mixed content types in SERP — ${patterns.dominantType} is most common but not dominant.`);
  }

  if (patterns.formatConfidence > 60) {
    parts.push(`${patterns.dominantFormat} is the winning format.`);
  }

  if (chosenAngle !== patterns.dominantAngle) {
    parts.push(`Differentiating with ${chosenAngle} angle (competitors mostly use ${patterns.dominantAngle}).`);
  }

  const avgWC = Math.round(profiles.reduce((s, p) => s + p.wordCount, 0) / profiles.length);
  parts.push(`Competitor average: ${avgWC} words.`);

  return parts.join(" ");
}
