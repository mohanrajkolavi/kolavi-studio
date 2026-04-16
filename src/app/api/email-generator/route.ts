import { NextRequest, NextResponse } from "next/server";
import { getSharedAnthropicClient } from "@/lib/anthropic/shared-client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logging/error";

const RATE_LIMIT_WINDOW_SEC = 86400; // 24 hours
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_BUCKET = "email-generator";
const hasDb = !!process.env.DATABASE_URL;

const CHAR_LIMITS = {
  subject: 60,
  preview: 90,
  body: 2000,
  ctaText: 40,
  signature: 280,
} as const;

export type EmailType =
  | "cold-outreach"
  | "sales-pitch"
  | "follow-up"
  | "networking"
  | "introduction"
  | "reply"
  | "thank-you"
  | "apology"
  | "meeting-request"
  | "feedback-request"
  | "application"
  | "cancellation"
  | "newsletter"
  | "welcome"
  | "break-up"
  | "subject-line"
  | "signature";

type Length = "short" | "medium" | "long";

const LENGTH_PRESETS: Record<Length, { min: number; max: number; label: string }> = {
  short: { min: 50, max: 100, label: "50 to 100 words (tight, high-signal)" },
  medium: { min: 100, max: 200, label: "100 to 200 words (most common business email length)" },
  long: { min: 200, max: 300, label: "200 to 300 words (detailed, multi-point)" },
};

const TONE_LABELS: Record<string, string> = {
  "1": "formal and respectful",
  "2": "professional and clear",
  "3": "balanced and friendly",
  "4": "warm and conversational",
  "5": "persuasive and bold",
};

type TypeConfig = {
  noun: string;
  goal: string;
  structure: string;
  subjectGuide: string;
  examples: string;
  returnsSubject: boolean;
  returnsBody: boolean;
  isSignature: boolean;
  isSubjectOnly: boolean;
};

const TYPE_CONFIG: Record<EmailType, TypeConfig> = {
  "cold-outreach": {
    noun: "cold outreach email",
    goal: "open a conversation with a stranger by giving them one concrete reason to reply within the first 2 seconds of scanning",
    structure:
      "1 opener showing you did homework on them -> 1 line on the pain or opportunity -> 1 line on why you specifically can help -> one soft CTA (short call, resource, yes/no question)",
    subjectGuide:
      "under 7 words, specific to them or their company, avoid filler like 'quick question', 'checking in', 'touching base', or 'hello'",
    examples:
      "Subject patterns: '[Company] + [specific metric]' | 'Role-to-role intro: [outcome]' | a direct question under 6 words",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "sales-pitch": {
    noun: "sales pitch email",
    goal: "convert interest into a concrete next step by pairing a clear benefit with one unmistakable CTA",
    structure:
      "1-line hook tied to their known need -> 2-line value proposition with a concrete outcome or number -> optional 1-line social proof -> single CTA",
    subjectGuide:
      "lead with outcome or specific number where possible, avoid superlatives like 'best' or 'game-changer'",
    examples:
      "Subject patterns: '[Benefit] for [Role]' | '[Metric] in [timeframe]' | 'Case study: how [company] did [result]'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "follow-up": {
    noun: "follow-up email",
    goal: "re-open a stalled thread without guilt-tripping or sounding desperate, while giving a fresh reason to respond",
    structure:
      "1-line anchor referencing prior exchange or meeting -> 1 line adding new value (resource, update, idea) -> clear single question or CTA that is easy to say yes or no to",
    subjectGuide:
      "can reference the original subject as 'Re: ...' or pose a short new question. Never 'just following up' or 'bumping this'",
    examples:
      "Subject patterns: 'Re: [original thread]' | 'Quick thought on [topic]' | '[Specific question]?'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  networking: {
    noun: "networking email",
    goal: "build a genuine professional relationship by being specific about why this person and what a helpful connection looks like",
    structure:
      "1 line naming how you found them or what you admire (specific) -> 1 line on who you are and what you care about -> 1 line on the low-stakes ask (15-minute call, advice, intro)",
    subjectGuide:
      "personal, specific, curious. Avoid 'can I pick your brain?'",
    examples:
      "Subject patterns: 'Loved your [specific thing]' | '[Mutual connection] suggested I reach out' | 'Quick question about [their expertise]'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  introduction: {
    noun: "introduction email",
    goal: "clearly introduce yourself (or two parties to each other) with context, credibility, and a concrete next step",
    structure:
      "1-line context (who referred you or what occasioned the intro) -> 1-2 lines on who you are / both parties are -> one clear next step",
    subjectGuide:
      "use 'Intro:' or 'Introducing [name] + [name]' patterns for clarity",
    examples:
      "Subject patterns: 'Intro: [name] <> [name]' | 'Introducing [name] from [company]' | 'Intro via [mutual connection]'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  reply: {
    noun: "email reply",
    goal: "answer the recipient's message clearly and move the conversation forward in the fewest words needed",
    structure:
      "direct acknowledgement of their message -> direct answer to their question or request -> next action if relevant",
    subjectGuide:
      "keep the original subject with 'Re:' prefix unless the thread has shifted topic",
    examples:
      "Subject patterns: 'Re: [their subject]' | the existing thread subject unchanged",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "thank-you": {
    noun: "thank-you email",
    goal: "express genuine, specific gratitude that reinforces the relationship without sounding generic or performative",
    structure:
      "1-line specific thanks naming what they did -> 1-2 lines on why it mattered to you -> optional light next step (no heavy ask)",
    subjectGuide:
      "direct and warm. Avoid generic 'Thanks!'",
    examples:
      "Subject patterns: 'Thank you for [specific thing]' | 'Grateful for today' | 'That made a real difference'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  apology: {
    noun: "apology email",
    goal: "own a mistake with accountability, empathy, and a concrete plan to make it right - without making excuses",
    structure:
      "1-line direct apology naming what happened -> 1 line showing you understand the impact -> concrete fix or next step -> no 'but' or excuses",
    subjectGuide:
      "direct and sincere. Often just 'Apology' or the specific issue named",
    examples:
      "Subject patterns: 'Apology for [specific issue]' | 'Owning my mistake' | 'About yesterday'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "meeting-request": {
    noun: "meeting request email",
    goal: "make it maximally easy for the recipient to say yes to a specific meeting with minimum back-and-forth",
    structure:
      "1 line purpose of meeting -> proposed format (video call, in person, 15/30 min) -> 2-3 concrete time options -> easy reply CTA",
    subjectGuide:
      "specific and action-framed. Often includes duration or topic",
    examples:
      "Subject patterns: '15-min call on [topic]?' | 'Quick sync about [project]' | 'Meeting request: [topic]'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "feedback-request": {
    noun: "feedback request email",
    goal: "request honest feedback by making it specific, low-effort, and clear how the response will be used",
    structure:
      "1-line context (what you are asking about) -> 1-2 specific questions (not 'any thoughts?') -> estimated time to reply -> appreciation",
    subjectGuide:
      "make it sound low-effort. Estimate time if possible",
    examples:
      "Subject patterns: '2-minute feedback on [thing]?' | 'Your take on [specific thing]' | 'Quick review request'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  application: {
    noun: "job application email",
    goal: "position yourself as the clear fit for a role by pairing specific credibility with genuine interest in this company",
    structure:
      "1-line naming the role and why you are the fit -> 2-3 lines of relevant credibility tied to their needs -> clear interest in next step (interview, short call)",
    subjectGuide:
      "include the role name and your name or the referral source",
    examples:
      "Subject patterns: 'Application: [Role]' | '[Role] - [Your Name] via [referral]' | '[Role] candidate with [specific strength]'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  cancellation: {
    noun: "cancellation or decline email",
    goal: "decline or cancel politely and clearly, without overexplaining or leaving the other person unsure about the answer",
    structure:
      "1-line direct statement of the decision -> short reason (honest but brief) -> warm close and door open if appropriate",
    subjectGuide:
      "direct and topic-specific. Avoid vague 'update'",
    examples:
      "Subject patterns: 'Cancelling [thing]' | 'Not the right fit' | 'Update on [specific thing]'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  newsletter: {
    noun: "newsletter or announcement email",
    goal: "deliver news or content to a subscribed audience with scannable structure and a clear reader takeaway",
    structure:
      "compelling hook tied to reader benefit -> 2-3 scannable sections (use short paragraphs) -> single featured CTA",
    subjectGuide:
      "reader-benefit first, concrete numbers or curiosity gaps welcome",
    examples:
      "Subject patterns: '[Benefit] in under [time]' | 'What we learned from [thing]' | '3 things we shipped this month'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  welcome: {
    noun: "welcome email",
    goal: "make a new subscriber, customer, or team member feel like they belong and show them the single best next step",
    structure:
      "warm personal welcome naming them or the product -> one-sentence reminder of the value they will get -> single best next step -> friendly close",
    subjectGuide:
      "make the sender feel human, not robotic",
    examples:
      "Subject patterns: 'Welcome to [product]' | 'Glad you are here, [name]' | 'Your first [thing] starts now'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "break-up": {
    noun: "break-up or last-chance re-engagement email",
    goal: "recover a dormant lead or quietly close the thread with dignity by offering a clear yes-or-no moment",
    structure:
      "1-line acknowledging the silence without guilt -> single sentence recalling the original value -> one binary CTA (yes keep talking / close the file)",
    subjectGuide:
      "respectful and clear. Often a short question",
    examples:
      "Subject patterns: 'Should I close your file?' | 'One last note' | 'Still interested?'",
    returnsSubject: true,
    returnsBody: true,
    isSignature: false,
    isSubjectOnly: false,
  },
  "subject-line": {
    noun: "email subject line",
    goal: "make the recipient open the email within 0.5 seconds of scanning their inbox",
    structure:
      "subject line under 60 characters that either teases value, creates curiosity, poses a specific question, names a number, personalizes, or conveys timely relevance",
    subjectGuide:
      "under 60 chars (mobile preview cap), ideally 41-50 chars for highest open rate. Match preview text so they reinforce each other.",
    examples:
      "Patterns: 'Quick question about [thing]' | '[Name], [specific benefit]' | '3 reasons [outcome]' | 'The [number]-minute [topic] fix'",
    returnsSubject: true,
    returnsBody: false,
    isSignature: false,
    isSubjectOnly: true,
  },
  signature: {
    noun: "email signature block",
    goal: "give the recipient your identity, credibility, and a contact path in the fewest visually clean lines",
    structure:
      "line 1: name and title | line 2: company (optional) | line 3: single contact channel (phone or site) | optional P.S. or tagline for marketing style",
    subjectGuide: "not applicable",
    examples:
      "Minimal: just name + role + one URL. Full: name + role + company + phone + site. Marketing: above plus one-line P.S. with CTA",
    returnsSubject: false,
    returnsBody: true,
    isSignature: true,
    isSubjectOnly: false,
  },
};

const BLOCKED_PATTERNS: RegExp[] = [
  /wire\s+transfer/i,
  /reset\s+(your\s+)?password/i,
  /verify\s+(your\s+)?(bank|account|credit\s+card|ssn|social\s+security)/i,
  /urgent(ly)?\s+(send|transfer|pay|wire)/i,
  /\birs\b.*(refund|audit|owe|owed)/i,
  /bitcoin\s+(payment|ransom|wallet)/i,
  /\bgift\s+card(s)?\b.*(urgent|asap|immediately|now)/i,
  /click\s+here\s+to\s+(verify|confirm|validate)/i,
  /(impersonat|pretend(ing)?|masquerad)/i,
];

function sanitize(val: string | undefined, maxLen: number): string {
  if (!val) return "";
  return val.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

function scrubDashes(s: string): string {
  return s
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function scrubBody(s: string): string {
  // For multi-line body content, preserve newlines but scrub dashes/quotes
  return s
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\r\n/g, "\n")
    .trim();
}

const VALID_STYLES_EMAIL = new Set([
  "direct",
  "warm",
  "curious",
  "confident",
  "playful",
  "formal",
]);
const VALID_STYLES_SUBJECT = new Set([
  "curiosity",
  "benefit",
  "urgency",
  "personal",
  "question",
  "numeric",
]);
const VALID_STYLES_SIGNATURE = new Set(["minimal", "full", "marketing"]);

type RawEmail = {
  subject?: unknown;
  preview?: unknown;
  body?: unknown;
  ctaText?: unknown;
  signature?: unknown;
  style?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!ip) {
      return NextResponse.json({ error: "Unable to verify request origin" }, { status: 400 });
    }

    const { allowed } = await checkRateLimit(
      RATE_LIMIT_BUCKET,
      ip,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SEC
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (8 generations per day). Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const typeRaw = typeof body.type === "string" ? body.type : "cold-outreach";
    const type: EmailType = (Object.prototype.hasOwnProperty.call(TYPE_CONFIG, typeRaw)
      ? typeRaw
      : "cold-outreach") as EmailType;

    const senderName = sanitize(body.senderName, 80);
    const senderRole = sanitize(body.senderRole, 120);
    const recipientName = sanitize(body.recipientName, 80);
    const recipientRole = sanitize(body.recipientRole, 120);
    const context = sanitize(body.context, 500);
    const keyPoints = sanitize(body.keyPoints, 400);
    const ctaGoal = sanitize(body.ctaGoal, 120);
    const includeSignature = body.includeSignature === true;

    const cfg = TYPE_CONFIG[type];

    if (!senderName) {
      return NextResponse.json({ error: "Your name is required." }, { status: 400 });
    }
    if (!cfg.isSignature && !context) {
      return NextResponse.json(
        { error: "Please describe what the email is about." },
        { status: 400 }
      );
    }

    // Phishing / impersonation guardrail
    const combined = `${context} ${keyPoints} ${ctaGoal}`;
    if (BLOCKED_PATTERNS.some((re) => re.test(combined))) {
      return NextResponse.json(
        {
          error:
            "This tool cannot generate messages that request credentials, wire transfers, or impersonate authorities. Please rephrase your request.",
        },
        { status: 400 }
      );
    }

    const lengthRaw = typeof body.length === "string" ? body.length : "medium";
    const length: Length = (["short", "medium", "long"].includes(lengthRaw)
      ? lengthRaw
      : "medium") as Length;
    const preset = LENGTH_PRESETS[length];
    const toneLabel = TONE_LABELS[String(body.tone)] ?? "balanced and friendly";

    // Build user-facing recipient description
    const recipientDescription = recipientName || recipientRole
      ? `${recipientName ? recipientName : "the recipient"}${recipientRole ? `, ${recipientRole}` : ""}`
      : "a professional reader who may not know the sender personally";

    // How many variants to request based on mode
    const variantCount = cfg.isSubjectOnly ? 5 : 3;

    // Detail block
    const detailParts: string[] = [
      `Sender: ${senderName}${senderRole ? ` (${senderRole})` : ""}`,
    ];
    if (recipientName || recipientRole) {
      detailParts.push(`Recipient: ${recipientDescription}`);
    }
    if (context) detailParts.push(`Purpose / context: ${context}`);
    if (keyPoints) detailParts.push(`Must-include points: ${keyPoints}`);
    if (ctaGoal && !cfg.isSignature && !cfg.isSubjectOnly) {
      detailParts.push(`Desired recipient action (CTA): ${ctaGoal}`);
    }
    detailParts.push(`Tone: ${toneLabel}`);
    if (!cfg.isSignature && !cfg.isSubjectOnly) {
      detailParts.push(`Body length target: ${preset.label}`);
      detailParts.push(`Include signature block: ${includeSignature ? "yes" : "no"}`);
    }
    const details = detailParts.join("\n");

    // Style instructions differ by mode
    let styleInstruction = "";
    let outputShape = "";
    if (cfg.isSubjectOnly) {
      styleInstruction = `Produce ${variantCount} subject lines, each attacking a distinct angle. Style tags must come from this set: curiosity, benefit, urgency, personal, question, numeric. Use at least 4 different tags across the 5 variants.`;
      outputShape = `{"emails":[{"subject":"<= 60 chars","preview":"<= 90 chars","style":"curiosity|benefit|urgency|personal|question|numeric"},${"..."}${variantCount} total],"tip":"<one sentence>"}`;
    } else if (cfg.isSignature) {
      styleInstruction = `Produce ${variantCount} signature blocks, one of each style: minimal (2 lines), full (4 lines), marketing (3-4 lines plus a short P.S. hook). Use \\n for line breaks within each signature.`;
      outputShape = `{"emails":[{"body":"<signature text with \\n line breaks>","style":"minimal|full|marketing"},${"..."}${variantCount} total],"tip":"<one sentence>"}`;
    } else {
      styleInstruction = `Produce ${variantCount} email variants, each from a distinct angle:
- v1 direct / clear ask (style tag: direct or formal)
- v2 warm / relationship-led (style tag: warm)
- v3 ${type === "cold-outreach" || type === "sales-pitch" || type === "networking" ? "curious / question-led opener (style tag: curious or playful)" : "confident / credibility-led (style tag: confident)"}`;
      outputShape = `{"emails":[{"subject":"<= 60 chars","preview":"<= 90 chars teaser","body":"<${preset.min}-${preset.max} word body, plain text, use \\n\\n between paragraphs>","ctaText":"<= 40 chars action phrase${includeSignature ? '","signature":"<short signature block with \\n line breaks>' : ""}","style":"direct|warm|curious|confident|playful|formal"},${"..."}${variantCount} total],"tip":"<one sentence specific to the brief>"}`;
    }

    const systemPrompt = `You are a senior copywriter at a top B2B agency. You've written emails that opened 8-figure deals and emails that politely ended doomed conversations. You do not write AI slop.

Your job: write ${variantCount} ${cfg.noun} variants for the brief below.

Goal of this email type: ${cfg.goal}.
Structure to follow: ${cfg.structure}.
Subject line rules: ${cfg.subjectGuide}.
Exemplar patterns (study, never copy): ${cfg.examples}

${styleInstruction}

HARD RULES:
- Tone: ${toneLabel}. Do not drift.
- Audience: ${recipientDescription}
- Every variant must reference at least one concrete detail from the brief (product, role, name, metric, location). Zero generic output.
- Write like a real person: contractions allowed, first-person, no corporate robot voice.
- NEVER use em dashes (U+2014) or en dashes (U+2013). Use hyphens, commas, semicolons, or periods only.
- BANNED words (AI tells, remove on sight): leverage (as verb), synergy, unlock, unleash, empower, elevate, seamless, transform, revolutionize, reimagine, cutting-edge, next-level, game-changer, world-class, best-in-class, state-of-the-art, circle back, touch base, reach out (as opener), just checking in, hope this finds you well, hope you are doing well, I hope this email finds you well, bump (this to the top).
- BANNED openers: "I hope this email finds you well", "My name is [X] and I am", "I am reaching out", "Just wanted to".
- No fake urgency ("act now", "limited time", "last chance") unless the brief is a newsletter or break-up email.
- SECURITY: refuse to generate content that impersonates a specific real person, company, or authority to deceive. Refuse to request credentials, passwords, bank details, wire transfers, or gift cards. If the brief asks for these, return an empty emails array.
${!cfg.isSubjectOnly ? `- Subject line <= 60 chars. Preview text <= 90 chars. ${cfg.isSignature ? "" : `Body ${preset.min}-${preset.max} words. CTA text <= 40 chars.`}` : "- Subject line <= 60 chars. Preview text <= 90 chars."}
${includeSignature && !cfg.isSubjectOnly && !cfg.isSignature ? `- Include a short signature block (signature field) using \\n line breaks. Use the sender's name and role.` : ""}

OUTPUT FORMAT - JSON only, no prose before or after:
${outputShape}`;

    const userPrompt = `BRIEF
${details}

Write ${variantCount} ${cfg.noun} variants for this brief right now. Follow the structure, obey every HARD RULE, spread across the required angles. Output JSON only.`;

    const client = getSharedAnthropicClient();
    const message = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        temperature: 0.75,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: '{"emails":[' },
        ],
      },
      { timeout: 30_000 }
    );

    const block = message.content?.[0];
    if (!block || block.type !== "text") {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    const rawJson = '{"emails":[' + block.text.replace(/```\s*$/, "").trim();
    let parsed: { emails: RawEmail[]; tip?: string };
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Failed to parse AI response. Please try again." },
          { status: 500 }
        );
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return NextResponse.json(
          { error: "Failed to parse AI response. Please try again." },
          { status: 500 }
        );
      }
    }

    if (!parsed?.emails || !Array.isArray(parsed.emails)) {
      return NextResponse.json(
        { error: "Invalid AI response format. Please try again." },
        { status: 500 }
      );
    }

    // Validate per mode
    let activeStyleSet: Set<string>;
    let defaultStyle: string;
    if (cfg.isSubjectOnly) {
      activeStyleSet = VALID_STYLES_SUBJECT;
      defaultStyle = "curiosity";
    } else if (cfg.isSignature) {
      activeStyleSet = VALID_STYLES_SIGNATURE;
      defaultStyle = "minimal";
    } else {
      activeStyleSet = VALID_STYLES_EMAIL;
      defaultStyle = "direct";
    }

    const seen = new Set<string>();
    type CleanEmail = {
      subject: string;
      preview: string;
      body: string;
      ctaText: string;
      signature: string;
      style: string;
      wordCount: number;
    };

    const emails: CleanEmail[] = [];
    for (const raw of parsed.emails) {
      const subjectRaw = typeof raw.subject === "string" ? scrubDashes(raw.subject).trim() : "";
      const previewRaw = typeof raw.preview === "string" ? scrubDashes(raw.preview).trim() : "";
      const bodyRaw = typeof raw.body === "string" ? scrubBody(raw.body) : "";
      const ctaRaw = typeof raw.ctaText === "string" ? scrubDashes(raw.ctaText).trim() : "";
      const signatureRaw = typeof raw.signature === "string" ? scrubBody(raw.signature) : "";
      const styleRaw = typeof raw.style === "string" ? raw.style.toLowerCase().trim() : "";

      const style = activeStyleSet.has(styleRaw) ? styleRaw : defaultStyle;

      if (cfg.isSubjectOnly) {
        if (!subjectRaw) continue;
        const subject = subjectRaw.slice(0, CHAR_LIMITS.subject);
        const preview = previewRaw.slice(0, CHAR_LIMITS.preview);
        const key = subject.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        emails.push({
          subject,
          preview,
          body: "",
          ctaText: "",
          signature: "",
          style,
          wordCount: 0,
        });
      } else if (cfg.isSignature) {
        if (!bodyRaw) continue;
        const signatureBody = bodyRaw.slice(0, CHAR_LIMITS.signature);
        const key = signatureBody.toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) continue;
        seen.add(key);
        emails.push({
          subject: "",
          preview: "",
          body: signatureBody,
          ctaText: "",
          signature: "",
          style,
          wordCount: signatureBody.split(/\s+/).filter(Boolean).length,
        });
      } else {
        if (!subjectRaw || !bodyRaw) continue;
        const subject = subjectRaw.slice(0, CHAR_LIMITS.subject);
        const preview = previewRaw.slice(0, CHAR_LIMITS.preview);
        const bodyClean = bodyRaw.slice(0, CHAR_LIMITS.body);
        const ctaText = ctaRaw.slice(0, CHAR_LIMITS.ctaText);
        const signature = signatureRaw.slice(0, CHAR_LIMITS.signature);
        const wordCount = bodyClean.split(/\s+/).filter(Boolean).length;
        const minW = Math.floor(preset.min * 0.7);
        const maxW = Math.ceil(preset.max * 1.3);
        if (wordCount < minW || wordCount > maxW) continue;
        const key = subject.toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) continue;
        seen.add(key);
        emails.push({
          subject,
          preview,
          body: bodyClean,
          ctaText,
          signature,
          style,
          wordCount,
        });
      }

      if (emails.length >= (cfg.isSubjectOnly ? 6 : 4)) break;
    }

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "AI did not return valid emails. Please try again or rephrase your brief." },
        { status: 500 }
      );
    }

    const tip =
      typeof parsed.tip === "string" && parsed.tip.length > 0 && parsed.tip.length < 400
        ? scrubDashes(parsed.tip)
        : cfg.isSubjectOnly
          ? "Test the top 2 subject lines against your audience and pick the one with the clearest hook."
          : cfg.isSignature
            ? "Pick the signature length that matches the channel - minimal for internal email, full for cold outreach, marketing for newsletters."
            : "Pick the variant that reads most specific to this recipient, not just the most polished.";

    // Fire-and-forget lead capture
    if (hasDb) {
      import("@/lib/db")
        .then(({ sql }) =>
          sql`
            INSERT INTO leads (id, name, message, source, status, created_at)
            VALUES (
              gen_random_uuid(),
              ${senderName},
              ${`email: ${type} | ${toneLabel} | ${length}`},
              'email_generator',
              'new',
              NOW()
            )
          `.catch(() => {})
        )
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      emails: {
        type,
        emails,
        tip,
      },
    });
  } catch (err) {
    logError("email-generator", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
