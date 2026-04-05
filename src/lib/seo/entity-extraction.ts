/**
 * NLP Entity Extraction & Gap Detection (P7D)
 *
 * Extracts named entities (tools, brands, people, technologies, metrics)
 * from competitor articles and detects entity gaps in our content.
 *
 * Uses pattern-based extraction (no ML dependency) optimized for SEO content:
 * - Product/tool names (capitalized multi-word)
 * - Brand/company names
 * - Technology terms
 * - Metric/KPI references
 * - People names
 *
 * Entity saturation correlates with AI citation rates — AI engines build
 * entity graphs from proper nouns. Higher entity density = more citations.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType =
  | "tool"
  | "brand"
  | "person"
  | "technology"
  | "metric"
  | "organization"
  | "concept";

export type ExtractedEntity = {
  /** The entity name as it appears in text. */
  name: string;
  /** Normalized form (lowercase, deduplicated). */
  normalized: string;
  /** Entity type. */
  type: EntityType;
  /** How many competitor docs mention this entity. */
  docFrequency: number;
  /** Total mentions across all competitor docs. */
  totalMentions: number;
  /** Average mentions per doc that contains it. */
  avgMentions: number;
  /** Whether it appears in competitor headings. */
  inHeadings: boolean;
};

export type EntityGap = {
  /** The entity name. */
  entity: string;
  /** Entity type. */
  type: EntityType;
  /** How many competitors mention it. */
  competitorCount: number;
  /** Recommended mentions for our article. */
  recommendedMentions: number;
  /** Priority: "high" (all competitors use it), "medium" (most use it), "low". */
  priority: "high" | "medium" | "low";
};

export type EntityExtractionResult = {
  /** All entities found across competitors, ranked by importance. */
  entities: ExtractedEntity[];
  /** Entity gaps — entities our content should include. */
  gaps: EntityGap[];
  /** Entity coverage score for our content (0-100). */
  coverageScore?: number;
  /** Stats. */
  stats: {
    totalEntities: number;
    totalDocuments: number;
    entityTypes: Record<EntityType, number>;
  };
};

// ---------------------------------------------------------------------------
// Known entity databases (common SEO/tech tools, platforms, metrics)
// ---------------------------------------------------------------------------

const KNOWN_TOOLS = new Set([
  "google analytics", "google search console", "google ads", "google tag manager",
  "semrush", "ahrefs", "moz", "screaming frog", "surfer seo", "clearscope",
  "marketmuse", "frase", "jasper", "grammarly", "hemingway", "yoast",
  "rank math", "wordpress", "shopify", "hubspot", "mailchimp", "salesforce",
  "slack", "notion", "figma", "canva", "zapier", "trello", "asana", "jira",
  "github", "gitlab", "vercel", "netlify", "aws", "azure", "cloudflare",
  "datadog", "new relic", "sentry", "hotjar", "crazy egg", "optimizely",
  "google trends", "answer the public", "buzzsumo", "hunter.io",
  "chatgpt", "claude", "gemini", "perplexity", "midjourney", "dall-e",
  "react", "next.js", "vue", "angular", "svelte", "tailwind", "bootstrap",
  "node.js", "python", "typescript", "javascript", "redis", "postgresql",
  "mongodb", "elasticsearch", "docker", "kubernetes",
]);

const KNOWN_METRICS = new Set([
  "roi", "ctr", "cpc", "cpm", "roas", "ltv", "cac", "mrr", "arr",
  "bounce rate", "conversion rate", "click-through rate", "cost per click",
  "organic traffic", "domain authority", "page authority", "domain rating",
  "keyword difficulty", "search volume", "impressions", "page speed",
  "core web vitals", "largest contentful paint", "first input delay",
  "cumulative layout shift", "time to first byte", "page views",
  "session duration", "engagement rate", "open rate", "churn rate",
  "net promoter score", "customer satisfaction", "average order value",
]);

// ---------------------------------------------------------------------------
// Entity extraction patterns
// ---------------------------------------------------------------------------

/**
 * Extract entities from plain text using pattern matching.
 * Prioritizes proper nouns, known tools/metrics, and capitalized phrases.
 */
function extractEntitiesFromText(
  text: string,
  headingText: string,
): Map<string, { name: string; type: EntityType; count: number; inHeadings: boolean }> {
  const entities = new Map<string, { name: string; type: EntityType; count: number; inHeadings: boolean }>();

  const addEntity = (name: string, type: EntityType, inH: boolean) => {
    const normalized = name.toLowerCase().trim();
    if (normalized.length < 2) return;
    const existing = entities.get(normalized);
    if (existing) {
      existing.count++;
      if (inH) existing.inHeadings = true;
    } else {
      entities.set(normalized, { name: name.trim(), type, count: 1, inHeadings: inH });
    }
  };

  const lowerText = text.toLowerCase();
  const lowerHeadings = headingText.toLowerCase();

  // 1. Known tools
  for (const tool of KNOWN_TOOLS) {
    const regex = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      const inH = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lowerHeadings);
      const existing = entities.get(tool);
      if (existing) {
        existing.count += matches.length;
        if (inH) existing.inHeadings = true;
      } else {
        entities.set(tool, { name: matches[0], type: "tool", count: matches.length, inHeadings: inH });
      }
    }
  }

  // 2. Known metrics
  for (const metric of KNOWN_METRICS) {
    const regex = new RegExp(`\\b${metric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      const inH = new RegExp(`\\b${metric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lowerHeadings);
      entities.set(metric, { name: matches[0], type: "metric", count: matches.length, inHeadings: inH });
    }
  }

  // 3. Capitalized multi-word proper nouns (2-4 words, not at sentence start)
  // Match "Google Search Console", "Brian Dean", "HubSpot CRM", etc.
  const properNounRegex = /(?<=[.!?]\s+\w+\s+|,\s+|;\s+|\band\s+|\bor\s+|\blike\s+|\bsuch as\s+|\busing\s+|\bwith\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g;
  let m: RegExpExecArray | null;
  while ((m = properNounRegex.exec(text)) !== null) {
    const name = m[1];
    const normalized = name.toLowerCase();
    if (!entities.has(normalized) && !isCommonPhrase(normalized)) {
      addEntity(name, classifyProperNoun(name), lowerHeadings.includes(normalized));
    }
  }

  // 4. Technology/framework patterns (CamelCase, abbreviations)
  const techRegex = /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+|[A-Z]{2,6}(?:\.[a-z]+)?)\b/g;
  while ((m = techRegex.exec(text)) !== null) {
    const name = m[1];
    const normalized = name.toLowerCase();
    if (
      !entities.has(normalized) &&
      !COMMON_ABBREVIATIONS.has(normalized) &&
      name.length >= 3
    ) {
      addEntity(name, "technology", lowerHeadings.includes(normalized));
    }
  }

  // 5. Percentage/dollar patterns that reference specific metrics
  const metricPatternRegex = /(\d+(?:\.\d+)?%)\s+(increase|decrease|improvement|growth|decline|reduction|boost|drop|rise)\s+in\s+([a-z][a-z\s]{2,30})/gi;
  while ((m = metricPatternRegex.exec(text)) !== null) {
    const metricName = m[3].trim();
    if (!entities.has(metricName) && !STOP_WORDS_SET.has(metricName)) {
      addEntity(metricName, "metric", false);
    }
  }

  return entities;
}

const COMMON_ABBREVIATIONS = new Set([
  "html", "css", "http", "https", "api", "url", "urls", "seo", "ui", "ux",
  "cms", "cdn", "dns", "ssl", "tls", "ftp", "ssh", "sql", "json", "xml",
  "csv", "pdf", "jpg", "png", "svg", "gif", "mp4", "mp3",
]);

const STOP_WORDS_SET = new Set([
  "the", "and", "for", "that", "this", "with", "from", "your", "they",
  "their", "them", "you", "what", "which", "when", "where", "how",
]);

const COMMON_PHRASES_SET = new Set([
  "best practices", "case study", "case studies", "step by step",
  "real world", "long term", "short term", "high quality", "low cost",
  "key takeaways", "action items", "next steps",
]);

function isCommonPhrase(text: string): boolean {
  return COMMON_PHRASES_SET.has(text) || text.split(" ").length > 4;
}

function classifyProperNoun(name: string): EntityType {
  const lower = name.toLowerCase();
  if (KNOWN_TOOLS.has(lower)) return "tool";
  // Heuristic: single capitalized word after "by" or "from" likely a brand
  if (name.split(" ").length === 1) return "brand";
  // Two words where second is capitalized: likely a person
  const words = name.split(" ");
  if (words.length === 2 && /^[A-Z][a-z]+$/.test(words[0]) && /^[A-Z][a-z]+$/.test(words[1])) {
    return "person";
  }
  return "organization";
}

// ---------------------------------------------------------------------------
// Cross-document entity analysis
// ---------------------------------------------------------------------------

/**
 * Extract and analyze entities across multiple competitor documents.
 */
export function extractEntities(
  competitorTexts: { content: string; headings?: string[] }[],
): EntityExtractionResult {
  if (competitorTexts.length === 0) {
    return {
      entities: [],
      gaps: [],
      stats: { totalEntities: 0, totalDocuments: 0, entityTypes: {} as Record<EntityType, number> },
    };
  }

  const docCount = competitorTexts.length;

  // Per-document entity extraction
  const docEntities: Map<string, { name: string; type: EntityType; count: number; inHeadings: boolean }>[] = [];

  for (const doc of competitorTexts) {
    const plainText = doc.content
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ");
    const headingText = (doc.headings ?? []).join(" ");
    docEntities.push(extractEntitiesFromText(plainText, headingText));
  }

  // Aggregate across documents
  const aggregated = new Map<string, ExtractedEntity>();

  for (const docMap of docEntities) {
    for (const [normalized, { name, type, count, inHeadings }] of docMap) {
      const existing = aggregated.get(normalized);
      if (existing) {
        existing.docFrequency++;
        existing.totalMentions += count;
        if (inHeadings) existing.inHeadings = true;
      } else {
        aggregated.set(normalized, {
          name,
          normalized,
          type,
          docFrequency: 1,
          totalMentions: count,
          avgMentions: 0,
          inHeadings,
        });
      }
    }
  }

  // Compute averages and sort
  const entities: ExtractedEntity[] = [];
  const entityTypes: Record<string, number> = {};

  for (const entity of aggregated.values()) {
    entity.avgMentions = Math.round((entity.totalMentions / entity.docFrequency) * 10) / 10;
    entities.push(entity);
    entityTypes[entity.type] = (entityTypes[entity.type] ?? 0) + 1;
  }

  // Sort by doc frequency (most common across competitors first), then by total mentions
  entities.sort((a, b) => {
    if (b.docFrequency !== a.docFrequency) return b.docFrequency - a.docFrequency;
    return b.totalMentions - a.totalMentions;
  });

  return {
    entities,
    gaps: [], // Gaps computed separately when comparing against our content
    stats: {
      totalEntities: entities.length,
      totalDocuments: docCount,
      entityTypes: entityTypes as Record<EntityType, number>,
    },
  };
}

/**
 * Detect entity gaps — entities competitors use that our content is missing.
 */
export function detectEntityGaps(
  competitorEntities: ExtractedEntity[],
  ourContentHtml: string,
  docCount: number,
): EntityGap[] {
  const ourText = ourContentHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase();

  const gaps: EntityGap[] = [];

  for (const entity of competitorEntities) {
    // Check if our content mentions this entity
    const escaped = entity.normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    const found = regex.test(ourText);

    if (!found && entity.docFrequency >= 2) {
      const ratio = entity.docFrequency / docCount;
      let priority: EntityGap["priority"];
      if (ratio >= 0.75) priority = "high";
      else if (ratio >= 0.5) priority = "medium";
      else priority = "low";

      gaps.push({
        entity: entity.name,
        type: entity.type,
        competitorCount: entity.docFrequency,
        recommendedMentions: Math.max(1, Math.round(entity.avgMentions * 0.8)),
        priority,
      });
    }
  }

  // Sort by priority then competitor count
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  gaps.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.competitorCount - a.competitorCount;
  });

  return gaps;
}

/**
 * Score entity coverage of our content vs competitors.
 */
export function scoreEntityCoverage(
  competitorEntities: ExtractedEntity[],
  ourContentHtml: string,
  docCount: number,
): number {
  const ourText = ourContentHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase();

  // Only score entities that appear in 2+ competitor docs
  const significant = competitorEntities.filter((e) => e.docFrequency >= 2);
  if (significant.length === 0) return 100;

  let covered = 0;
  for (const entity of significant) {
    const escaped = entity.normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(ourText)) {
      covered++;
    }
  }

  return Math.round((covered / significant.length) * 100);
}
