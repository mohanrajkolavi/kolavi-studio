import { NextRequest, NextResponse } from "next/server";
import { getSharedAnthropicClient } from "@/lib/anthropic/shared-client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logging/error";

const RATE_LIMIT_WINDOW_SEC = 86400; // 24 hours
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_BUCKET = "slogan-generator";
const hasDb = !!process.env.DATABASE_URL;

type Mode = "slogan" | "tagline" | "motto" | "catchphrase";

const MODE_CONFIG: Record<Mode, {
  noun: string;
  pluralNoun: string;
  wordTarget: string;
  minWords: number;
  maxWords: number;
  styleGuide: string;
  examples: string;
  goal: string;
}> = {
  slogan: {
    noun: "slogan",
    pluralNoun: "slogans",
    wordTarget: "3 to 8 words",
    minWords: 3,
    maxWords: 8,
    styleGuide: "an advertising phrase that sells a product or campaign, benefit-driven, rhythmic, easy to recall",
    examples:
      "Nike: Just Do It | Apple: Think Different | McDonald's: I'm Lovin' It | M&Ms: Melts in Your Mouth, Not in Your Hands | FedEx: When It Absolutely, Positively Has to Be There Overnight | De Beers: A Diamond Is Forever",
    goal: "make the reader feel the benefit in under 2 seconds and want to act",
  },
  tagline: {
    noun: "tagline",
    pluralNoun: "taglines",
    wordTarget: "2 to 7 words",
    minWords: 2,
    maxWords: 7,
    styleGuide: "a persistent brand identifier capturing essence and promise, not tied to a single campaign",
    examples:
      "Apple: Think Different | L'Oreal: Because You're Worth It | BMW: The Ultimate Driving Machine | Adidas: Impossible Is Nothing | Disneyland: The Happiest Place on Earth | Airbnb: Belong Anywhere",
    goal: "capture the brand's permanent identity and promise in a phrase the company will use for 10+ years",
  },
  motto: {
    noun: "motto",
    pluralNoun: "mottos",
    wordTarget: "3 to 7 words",
    minWords: 3,
    maxWords: 7,
    styleGuide: "a guiding principle for a person, family, team, or organization, formal and timeless",
    examples:
      "US Marines: Semper Fidelis (Always Faithful) | Horace: Carpe Diem | Sao Paulo: Non Ducor, Duco (I Am Not Led, I Lead) | US: E Pluribus Unum | British Royals: Dieu Et Mon Droit | Kansas: Ad Astra Per Aspera (To the Stars Through Difficulty)",
    goal: "express a belief or value worth living by for a lifetime or generation",
  },
  catchphrase: {
    noun: "catchphrase",
    pluralNoun: "catchphrases",
    wordTarget: "2 to 6 words",
    minWords: 2,
    maxWords: 6,
    styleGuide: "a memorable line tied to a character, personality, or brand voice, playful or iconic",
    examples:
      "Terminator: I'll Be Back | Big Bang Theory: Bazinga | Anchorman: Stay Classy, San Diego | Star Trek: Live Long and Prosper | Porky Pig: That's All, Folks | Arnold (Diff'rent Strokes): What You Talkin' Bout, Willis",
    goal: "create a personality-driven line the audience will quote out loud",
  },
};

const AUDIENCE_PROFILES: Record<string, string> = {
  "small-business-owners":
    "scrappy founders and SMB owners who value time, ROI, and plain talk. Use concrete nouns, action verbs, and avoid corporate jargon.",
  "enterprise-buyers":
    "C-suite and procurement at large companies who value credibility, risk reduction, and scale. Formal vocabulary, trust words, outcome framing.",
  "young-consumers-18-30":
    "Gen Z and millennials who value authenticity, humor, irony, and individuality. Short, energetic, contraction-heavy, culturally aware. Avoid anything that sounds like a parent wrote it.",
  families:
    "parents and household decision-makers who value warmth, safety, togetherness, and value. Concrete, heartfelt, no edgy humor.",
  "creative-professionals":
    "designers, writers, directors, agency creatives who value craft, wit, surprise, and restraint. Unexpected word pairings, subtle metaphor, never obvious.",
  "loyal-customers":
    "existing customers being reminded why they chose you. Lean into identity and belonging, not discovery.",
  "new-customers":
    "first-time buyers weighing you against alternatives. Lead with the single sharpest benefit or differentiator.",
  investors:
    "VCs, analysts, and board members. Outcome-driven, credibility-focused, ambition signaling.",
  employees:
    "internal team members. Identity and purpose framing: we are _, we do _, we stand for _.",
  "personal-life": "an individual writing a personal life motto. First-person or imperative voice, private and true.",
  family: "a family writing a household motto. Plural (we, our, us), warm, intergenerational.",
  "sports-team": "a team writing a rallying cry. Short, physical, imperative verbs, shout-worthy.",
  "school-or-club": "students or a club writing a group motto. Aspirational, collegial, inclusive.",
  business: "a company writing its guiding principle. Values-first, not benefit-first.",
  funny: "a comedy-leaning character or creator. Absurd, ironic, unexpected. Humor must land, not try-hard.",
  epic: "a dramatic or heroic character. Grand, cinematic, imperative. Trailer-voice energy.",
  "laid-back": "a relaxed, cool, understated personality. Low-key phrasing, confident, never shouty.",
  dramatic: "a theatrical personality. Emotional weight, declarative, pause-worthy.",
  wholesome: "a warm, family-friendly creator. Sincere, kind, zero cynicism.",
};

type LengthPreset = "auto" | "short" | "medium" | "long" | "custom";

const LENGTH_PRESETS: Record<Exclude<LengthPreset, "custom" | "auto">, { min: number; max: number; label: string }> = {
  short: { min: 2, max: 4, label: "2 to 4 words (ultra punchy, billboard-ready)" },
  medium: { min: 4, max: 6, label: "4 to 6 words (balanced, most common length)" },
  long: { min: 6, max: 10, label: "6 to 10 words (descriptive, story-style)" },
};

const CUSTOM_WORDS_MIN = 2;
const CUSTOM_WORDS_MAX = 12;

const INDUSTRY_RHYTHM: Record<string, string> = {
  technology: "short and sharp. Active verbs. Avoid buzzwords (synergy, leverage, solutions).",
  "saas & cloud": "outcome-focused and fast. Specific user actions or time savings.",
  "ai & machine learning": "capability framing, restraint on hype. Avoid the word 'unleash'.",
  cybersecurity: "protective and decisive. Concrete threats and defenses, not abstractions.",
  "finance & banking": "trust, stability, and clarity. Concrete money outcomes, not vague prosperity.",
  insurance: "reassurance and specificity. Skip 'peace of mind' cliche.",
  healthcare: "care, trust, and competence. Concrete patient benefit, never salesy.",
  "pharmaceuticals & biotech": "clinical precision and human hope in balance.",
  education: "growth, possibility, and practical outcomes. Verbs of transformation.",
  "retail & e-commerce": "desire and immediacy. Sensory and specific.",
  "food & beverage": "sensory language. Taste, texture, smell, moment. Never abstract.",
  "hospitality & tourism": "experience framing. Evocative place and feeling.",
  travel: "wanderlust and arrival. Concrete places beat generic adventure.",
  automotive: "power, craft, and freedom. Physical verbs.",
  "sports & fitness": "command and energy. Imperative voice, body-physical verbs.",
  "fashion & apparel": "identity and confidence. Sharp, restrained, never cluttered.",
  "beauty & cosmetics": "confidence and sensory payoff. Avoid 'glow up' cliches.",
  gaming: "energy and in-game vocabulary. Playful, competitive, quotable.",
  "media & entertainment": "voice and distinctiveness. Match the format's energy.",
  "real estate": "home, belonging, and place. Concrete neighborhoods beat abstract dreams.",
  legal: "clarity and competence. No Latin unless earned.",
  consulting: "outcome and expertise. Avoid 'thought leadership' language.",
  "marketing & advertising": "self-aware craft. Never use marketing cliches to describe marketing.",
  nonprofit: "mission and impact. Concrete change beats vague good.",
  "home & garden": "comfort and craft. Tangible rooms and materials.",
  "pet care": "affection and specific animal joy.",
  design: "taste and restraint. Fewer words, sharper choices.",
};

function sanitize(val: string | undefined, maxLen: number): string {
  if (!val) return "";
  return val.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

const TONE_LABELS: Record<string, string> = {
  "1": "serious and formal",
  "2": "professional and confident",
  "3": "balanced and friendly",
  "4": "playful and energetic",
  "5": "bold and witty",
};

const STYLE_HINTS: Record<string, string> = {
  punchy: "short and impactful",
  rhyming: "include rhyme",
  alliterative: "use alliteration (repeating initial sounds)",
  metaphoric: "use a metaphor or vivid image",
  emotional: "evoke emotion",
  benefit: "lead with a clear customer benefit",
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!ip) {
      return NextResponse.json({ error: "Unable to verify request origin" }, { status: 400 });
    }

    const { allowed } = await checkRateLimit(RATE_LIMIT_BUCKET, ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (8 generations per day). Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const modeRaw = typeof body.mode === "string" ? body.mode : "slogan";
    const mode: Mode = (["slogan", "tagline", "motto", "catchphrase"].includes(modeRaw) ? modeRaw : "slogan") as Mode;

    const brandName = sanitize(body.brandName, 100);
    const description = sanitize(body.description, 400);
    const industry = sanitize(body.industry, 100);
    const audience = sanitize(body.audience, 100);
    const styles: string[] = Array.isArray(body.styles)
      ? (body.styles as unknown[])
          .filter((s: unknown): s is string => typeof s === "string" && s in STYLE_HINTS)
          .slice(0, 4)
      : [];

    const lengthRaw = typeof body.length === "string" ? body.length : "auto";
    const length: LengthPreset = (["auto", "short", "medium", "long", "custom"].includes(lengthRaw) ? lengthRaw : "auto") as LengthPreset;
    const customWordsRaw = Number(body.customWords);
    const customWords = Number.isFinite(customWordsRaw)
      ? Math.min(CUSTOM_WORDS_MAX, Math.max(CUSTOM_WORDS_MIN, Math.round(customWordsRaw)))
      : null;

    if (!brandName) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const toneLabel = TONE_LABELS[String(body.tone)] ?? "balanced and friendly";
    const cfgBase = MODE_CONFIG[mode];

    let lengthOverride: { min: number; max: number; label: string } | null = null;
    if (length === "custom" && customWords !== null) {
      lengthOverride = {
        min: customWords,
        max: customWords,
        label: `exactly ${customWords} ${customWords === 1 ? "word" : "words"} per ${cfgBase.noun}`,
      };
    } else if (length !== "auto" && length !== "custom") {
      lengthOverride = LENGTH_PRESETS[length];
    }

    const cfg = lengthOverride
      ? {
          ...cfgBase,
          minWords: lengthOverride.min,
          maxWords: lengthOverride.max,
          wordTarget: lengthOverride.label,
        }
      : cfgBase;
    const styleInstruction = styles.length
      ? `The user explicitly requested these techniques: ${styles.map((s) => STYLE_HINTS[s]).join("; ")}. Favor these across your 8 variants but still vary the angle of attack.`
      : "The user did not pick a specific style. Cover a spread of styles across the 8 variants (at least 5 of the 8 styles from the tag list below should appear).";

    const audienceProfile = audience && AUDIENCE_PROFILES[audience]
      ? AUDIENCE_PROFILES[audience]
      : audience
        ? `a ${audience.replace(/[-_]/g, " ")} audience`
        : "a general audience";

    const industryRhythm = industry && INDUSTRY_RHYTHM[industry.toLowerCase()]
      ? INDUSTRY_RHYTHM[industry.toLowerCase()]
      : industry
        ? `match the vocabulary, rhythm, and reference points of the ${industry} industry`
        : "no specific industry guidance";

    const detailParts: string[] = [`Brand/Name: ${brandName}`];
    if (industry) detailParts.push(`Industry: ${industry}`);
    if (description) detailParts.push(`Positioning / what they do: ${description}`);
    detailParts.push(`Audience: ${audienceProfile}`);
    detailParts.push(`Industry rhythm: ${industryRhythm}`);
    detailParts.push(`Tone: ${toneLabel}`);
    detailParts.push(`Length target: ${cfg.wordTarget} per ${cfg.noun}`);
    const details = detailParts.join("\n");

    const systemPrompt = `You are a senior copywriter who has shipped award-winning ${cfg.pluralNoun} for brands that became household names. You do NOT write generic AI slop. Every line you write could appear on a billboard, a jersey, or a pitch deck without embarrassment.

Your job: write 8 ${cfg.pluralNoun} for the brief below. A ${cfg.noun} is ${cfg.styleGuide}. The goal of a great ${cfg.noun} is to ${cfg.goal}.

World-class examples to study (mimic the STRUCTURE and RHYTHM, never copy the words):
${cfg.examples}

HOW TO THINK (do this silently, then write):
1. Read the brief. Identify the single sharpest differentiator - the one thing this brand has that competitors do not. If the user gave a description, pull a concrete noun or verb from it.
2. Identify the emotional hook - what the audience feels when they imagine using this brand.
3. Write 8 ${cfg.pluralNoun} that each attack from a DIFFERENT angle. Do not write 8 variations of the same idea. Use this angle spread:
   - #1 benefit-led (clearest customer benefit)
   - #2 emotional (how it feels)
   - #3 metaphoric (a vivid image or comparison)
   - #4 punchy (shortest possible, 2-4 words)
   - #5 alliterative or rhyming (sound device)
   - #6 contrast or twist (unexpected angle)
   - #7 aspirational or identity ("people who choose this are _")
   - #8 witty or playful (earns a half-smile)

HARD RULES:
- Exact length: ${cfg.minWords} to ${cfg.maxWords} words per ${cfg.noun}. Count words. Do not go over or under.
- Tone calibration: ${toneLabel}. Do not drift.
- Audience calibration: write for ${audienceProfile}
- Industry calibration: ${industryRhythm}
- Style instructions: ${styleInstruction}
- Specificity mandate: at least 5 of the 8 ${cfg.pluralNoun} must reference something concrete from the brief (a product detail, an industry term, a location, a specific benefit). Zero generic output.
- Diversity mandate: each ${cfg.noun} must be structurally different from the other 7. No "X your Y" templates reused. No repeated opening words across variants.
- BANNED WORDS (AI tells, remove on sight): unlock, unleash, elevate, transform, revolutionize, reimagine, empower, journey, experience (as a noun), discover, embrace, seamless, cutting-edge, next-level, game-changer, synergy, leverage (as a verb), world-class, best-in-class, premium quality, leading provider, state-of-the-art, innovative solutions.
- BANNED CLICHES: "the best", "one stop shop", "your partner in X", "where X meets Y", "quality you can trust", "peace of mind".
- NEVER use em dashes (U+2014) or en dashes (U+2013). Use hyphens, commas, or periods only.
- Write concrete nouns over abstract nouns. "Roasted beans" beats "quality". "7-minute delivery" beats "fast service".
- Read every ${cfg.noun} out loud in your head. If it stumbles, rewrite it.

STYLE TAGS (pick exactly one per variant, matching the angle): punchy, rhyming, alliterative, metaphoric, emotional, witty, aspirational, benefit.

OUTPUT FORMAT - JSON only, no prose before or after:
{"versions":[{"text":"<the ${cfg.noun}>","style":"<one tag>"},...8 total...],"tip":"<one sentence, specific to THIS brand, telling the user what to watch for when choosing their favorite>"}`;

    const userPrompt = `BRIEF
${details}

Write 8 ${cfg.pluralNoun} for this brand right now. Follow the HOW TO THINK process, obey every HARD RULE, and spread the 8 across the 8 angles. Output JSON only.`;

    const client = getSharedAnthropicClient();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      temperature: 0.9,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: '{"versions":[' },
      ],
    }, {
      timeout: 30_000,
    });

    const block = message.content?.[0];
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 500 });
    }

    type RawVersion = { text?: unknown; style?: unknown };
    let parsed: { versions: RawVersion[]; tip?: string };
    const rawJson = '{"versions":[' + block.text.replace(/```\s*$/, "").trim();
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
      }
    }

    if (!parsed?.versions || !Array.isArray(parsed.versions)) {
      return NextResponse.json({ error: "Invalid AI response format. Please try again." }, { status: 500 });
    }

    const VALID_STYLES = new Set([
      "punchy", "rhyming", "alliterative", "metaphoric",
      "emotional", "witty", "aspirational", "benefit",
    ]);

    const WC_TOLERANCE = 1;
    const minWords = Math.max(1, cfg.minWords - WC_TOLERANCE);
    const maxWords = cfg.maxWords + WC_TOLERANCE;

    const seen = new Set<string>();
    const versions = parsed.versions
      .map((v): { text: string; wordCount: number; style: string } | null => {
        const text = typeof v?.text === "string"
          ? v.text.replace(/\s*\u2014\s*/g, " - ").replace(/\s*\u2013\s*/g, " - ").replace(/["“”]/g, "").trim()
          : "";
        if (!text || text.length > 160) return null;
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        if (wordCount < minWords || wordCount > maxWords) return null;
        const key = text.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);
        const rawStyle = typeof v?.style === "string" ? v.style.toLowerCase().trim() : "";
        const style = VALID_STYLES.has(rawStyle) ? rawStyle : "punchy";
        return { text, wordCount, style };
      })
      .filter((v): v is { text: string; wordCount: number; style: string } => v !== null)
      .slice(0, 10);

    if (versions.length === 0) {
      return NextResponse.json({ error: "AI did not return any valid results. Please try again." }, { status: 500 });
    }

    const tip = typeof parsed.tip === "string" && parsed.tip.length > 0 && parsed.tip.length < 400
      ? parsed.tip.replace(/\s*\u2014\s*/g, " - ").replace(/\s*\u2013\s*/g, " - ")
      : `Pick the ${cfg.noun} that feels the most specific to your brand, not just the catchiest.`;

    if (hasDb) {
      import("@/lib/db").then(({ sql }) =>
        sql`
          INSERT INTO leads (id, name, message, source, status, created_at)
          VALUES (
            gen_random_uuid(),
            ${brandName},
            ${`${mode}: ${industry || "n/a"} | ${toneLabel}`},
            ${`${mode}_generator`},
            'new',
            NOW()
          )
        `.catch(() => {})
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      slogans: {
        mode,
        versions,
        tip,
      },
    });
  } catch (err) {
    logError("slogan-generator", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
