import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSharedAnthropicClient } from "@/lib/anthropic/shared-client";

const RATE_LIMIT_WINDOW_SEC = 86400; // 24 hours
const RATE_LIMIT_MAX = 6;
const hasDb = !!process.env.DATABASE_URL;

function hashIp(ip: string): string {
  return createHash("sha256").update(`bio-gen-rl:${ip}`).digest("hex");
}

// In-memory rate limit fallback when DB is unavailable
const memoryRateLimit = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(ipHash: string): Promise<boolean> {
  if (hasDb) {
    try {
      const { sql } = await import("@/lib/db");
      const now = new Date();
      const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_SEC * 1000);
      const updated = await sql`
        INSERT INTO contact_rate_limit (ip_hash, request_count, reset_at)
        VALUES (${ipHash}, 1, ${resetAt})
        ON CONFLICT (ip_hash) DO UPDATE SET
          request_count = CASE
            WHEN contact_rate_limit.reset_at <= ${now} THEN 1
            ELSE contact_rate_limit.request_count + 1
          END,
          reset_at = CASE
            WHEN contact_rate_limit.reset_at <= ${now} THEN ${resetAt}
            ELSE contact_rate_limit.reset_at
          END
        RETURNING request_count
      `;
      const count = Number(updated[0]?.request_count);
      return Number.isFinite(count) && count >= 0 && count <= RATE_LIMIT_MAX;
    } catch {
      // Fall through to memory
    }
  }
  const now = Date.now();
  const entry = memoryRateLimit.get(ipHash);
  if (!entry || entry.resetAt <= now) {
    memoryRateLimit.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_SEC * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-vercel-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

/** Platform character limits. */
const PLATFORM_LIMITS: Record<string, number> = {
  linkedin_headline: 120,
  linkedin_about: 2000,
  twitter: 160,
  instagram: 150,
  tiktok: 80,
  facebook: 101,
  github: 160,
  professional: 500,
  email_signature: 200,
  threads: 150,
};

/** Platform-specific style hints  - compact, one per platform. */
const PLATFORM_STYLE: Record<string, string> = {
  linkedin_headline: "professional headline, no emojis, include specialty",
  linkedin_about: "professional 1st person, short paragraphs, end with CTA",
  twitter: "punchy 1st person, witty, no emojis unless casual tone",
  instagram: "1st person, 1-2 emojis, line breaks ok, end with CTA",
  tiktok: "ultra-casual 1st person, trendy, 1-2 emojis",
  facebook: "warm personal 1st person, simple",
  github: "technical 1st person, mention stack, no fluff",
  professional: "3rd person, credential-first, formal",
  email_signature: "3rd person, 1-2 lines only, title + value prop",
  threads: "conversational 1st person, like Instagram but chattier",
};

/** Static tips per platform  - saves output tokens. */
const PLATFORM_TIPS: Record<string, string> = {
  linkedin_headline: "Include your specialty and who you help  - recruiters scan headlines first.",
  linkedin_about: "Open with a hook, use short paragraphs, end with a CTA.",
  twitter: "Be punchy. Your bio is the first thing people see on your profile.",
  instagram: "Use line breaks and emojis strategically  - they increase profile visits.",
  tiktok: "Keep it ultra-short and trendy. Humor works well here.",
  facebook: "Keep it simple and personal  - Facebook skews toward real connections.",
  github: "Mention your tech stack and what you build. Link to your best repo.",
  professional: "Write in third person. Lead with credentials, end with what you offer.",
  email_signature: "Keep it to 2-3 lines max. Name, title, one link.",
  threads: "Mirror your Instagram voice but slightly more conversational.",
};

/** Sanitize user input  - trim, collapse whitespace, cap length. */
function sanitize(val: string | undefined, maxLen: number): string {
  if (!val) return "";
  return val.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

const TONE_LABELS: Record<string, string> = {
  "1": "formal",
  "2": "professional",
  "3": "balanced",
  "4": "casual",
  "5": "bold/witty",
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!ip) {
      return NextResponse.json({ error: "Unable to verify request origin" }, { status: 400 });
    }

    const allowed = await checkRateLimit(hashIp(ip));
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (6 generations per day). Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { tone, platforms, audience } = body;

    // Sanitize all text inputs with strict length caps
    const name = sanitize(body.name, 80);
    const role = sanitize(body.role, 150);
    const industry = sanitize(body.industry, 80);
    const achievements = sanitize(body.achievements, 300);
    const skills = sanitize(body.skills, 200);
    const personality = sanitize(body.personality, 200);

    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required." }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "Select at least one platform." }, { status: 400 });
    }

    const validPlatforms = platforms.filter((p: string) => p in PLATFORM_LIMITS);
    if (validPlatforms.length === 0) {
      return NextResponse.json({ error: "No valid platforms selected." }, { status: 400 });
    }

    const toneLabel = TONE_LABELS[String(tone)] ?? "balanced";
    const audienceLabel = typeof audience === "string" ? audience : "general";

    // Build compact platform spec with style hints
    // Format: "twitter(160,punchy 1st person)"  - gives Haiku everything in minimal tokens
    const platformSpec = validPlatforms
      .map((p: string) => `${p}(${PLATFORM_LIMITS[p]},${PLATFORM_STYLE[p]})`)
      .join("|");

    // Build user details  - only non-empty fields
    const detailParts = [name, role];
    if (industry) detailParts.push(`in ${industry}`);
    if (skills) detailParts.push(`Skills: ${skills}`);
    if (achievements) detailParts.push(`Did: ${achievements}`);
    if (personality) detailParts.push(`Also: ${personality}`);
    const details = detailParts.join(". ");

    // System prompt: ultra-compact for Haiku. Every word counts.
    const systemPrompt = `You write bios. Rules:
1. STRICT char limit per platform - count carefully, never exceed
2. No filler: never say "passionate about", "dedicated to", "leveraging", "driven"
3. Be specific to this person - use their actual achievements/skills
4. Match platform style in parentheses
5. Tone: ${toneLabel}. Audience: ${audienceLabel}
6. For each platform, write 3 distinct versions with different angles/hooks
7. NEVER use em dashes. Use hyphens (-) or periods instead
8. Output JSON only: {"bios":{"key":["v1","v2","v3"]}}`;

    const userPrompt = `${details}

Platforms: ${platformSpec}`;

    const client = getSharedAnthropicClient();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      temperature: 0.6,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: '{"bios":{' },
      ],
    }, {
      timeout: 25_000,
    });

    const block = message.content?.[0];
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 500 });
    }

    // Reconstruct JSON from prefill + response
    let parsed: { bios: Record<string, string | string[]> };
    const rawJson = '{"bios":{' + block.text.replace(/```\s*$/, "").trim();
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

    if (!parsed?.bios || typeof parsed.bios !== "object") {
      return NextResponse.json({ error: "Invalid AI response format. Please try again." }, { status: 500 });
    }

    /** Auto-trim a single bio if slightly over limit. */
    function trimBio(bio: string, limit: number): string {
      if (bio.length > limit && bio.length <= limit * 1.15) {
        const trimmed = bio.slice(0, limit);
        const lastPeriod = trimmed.lastIndexOf(".");
        const lastPipe = trimmed.lastIndexOf("|");
        const lastBreak = Math.max(lastPeriod, lastPipe);
        return lastBreak > limit * 0.6 ? trimmed.slice(0, lastBreak + 1) : trimmed;
      }
      return bio;
    }

    // Build result - server-side char count + static tips + trim if over limit
    const result: Record<string, { versions: { bio: string; charCount: number }[]; limit: number; tip: string }> = {};
    for (const platform of validPlatforms) {
      const raw = parsed.bios[platform];
      if (!raw) continue;

      const limit = PLATFORM_LIMITS[platform];
      // Handle both array (3 versions) and string (single fallback) responses
      const rawVersions = Array.isArray(raw) ? raw : [raw];
      const versions = rawVersions
        .filter((v): v is string => typeof v === "string" && v.length > 0)
        .map((bio) => {
          // Strip em dashes that may slip through from AI
          const cleaned = bio.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
          const trimmed = trimBio(cleaned, limit);
          return { bio: trimmed, charCount: trimmed.length };
        });

      if (versions.length === 0) continue;

      result[platform] = {
        versions,
        limit,
        tip: PLATFORM_TIPS[platform] ?? "",
      };
    }

    // Store lead if DB available (non-blocking, fire-and-forget)
    if (hasDb) {
      import("@/lib/db").then(({ sql }) =>
        sql`
          INSERT INTO leads (id, name, message, source, status, created_at)
          VALUES (
            gen_random_uuid(),
            ${name},
            ${`Bio: ${role} | ${validPlatforms.join(",")} | ${toneLabel}`},
            'bio_generator',
            'new',
            NOW()
          )
        `.catch(() => {})
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, bios: result });
  } catch (err) {
    console.error("[bio-generator] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
