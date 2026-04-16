"use client";

import { useState, useCallback } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  Mail,
  MessageSquareReply,
  Heart,
  HeartHandshake,
  Calendar,
  MessageSquare,
  FileText,
  XCircle,
  Megaphone,
  PartyPopper,
  CircleSlash,
  Target,
  Users,
  Briefcase,
  Handshake,
  AtSign,
  Type,
  Signature,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

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

interface EmailVariant {
  subject: string;
  preview: string;
  body: string;
  ctaText: string;
  signature: string;
  style: string;
  wordCount: number;
}

interface EmailResult {
  type: EmailType;
  emails: EmailVariant[];
  tip: string;
}

const EMAIL_TYPE_GROUPS: {
  label: string;
  options: { value: EmailType; label: string }[];
}[] = [
  {
    label: "Outbound / Sales",
    options: [
      { value: "cold-outreach", label: "Cold Outreach" },
      { value: "sales-pitch", label: "Sales Pitch" },
      { value: "follow-up", label: "Follow-up" },
      { value: "networking", label: "Networking" },
      { value: "introduction", label: "Introduction" },
    ],
  },
  {
    label: "Reply / Response",
    options: [
      { value: "reply", label: "Reply" },
      { value: "thank-you", label: "Thank You" },
      { value: "apology", label: "Apology" },
    ],
  },
  {
    label: "Business / Operational",
    options: [
      { value: "meeting-request", label: "Meeting Request" },
      { value: "feedback-request", label: "Feedback / Review Request" },
      { value: "application", label: "Job Application" },
      { value: "cancellation", label: "Cancellation / Decline" },
    ],
  },
  {
    label: "Marketing / Transactional",
    options: [
      { value: "newsletter", label: "Newsletter / Announcement" },
      { value: "welcome", label: "Welcome Email" },
      { value: "break-up", label: "Break-up / Re-engagement" },
    ],
  },
];

const TYPE_ICONS: Record<EmailType, React.ElementType> = {
  "cold-outreach": Target,
  "sales-pitch": Briefcase,
  "follow-up": MessageSquareReply,
  networking: Handshake,
  introduction: AtSign,
  reply: MessageSquare,
  "thank-you": Heart,
  apology: HeartHandshake,
  "meeting-request": Calendar,
  "feedback-request": FileText,
  application: Briefcase,
  cancellation: XCircle,
  newsletter: Megaphone,
  welcome: PartyPopper,
  "break-up": CircleSlash,
  "subject-line": Type,
  signature: Signature,
};

const QUICK_TEMPLATES: {
  label: string;
  type: EmailType;
  context: string;
  ctaGoal: string;
}[] = [
  {
    label: "Cold sales email",
    type: "cold-outreach",
    context:
      "I sell a tool that helps [ideal customer] solve [specific pain]. They lose time or money because of [problem]. I noticed this prospect seems to match.",
    ctaGoal: "Book a 15-minute intro call",
  },
  {
    label: "Follow-up after meeting",
    type: "follow-up",
    context:
      "We met yesterday and discussed [topic]. I want to keep momentum and confirm the agreed next steps before they forget.",
    ctaGoal: "Confirm the next step we agreed on",
  },
  {
    label: "Application email",
    type: "application",
    context:
      "I'm applying for the [role] position at [company]. I have [years] of relevant experience and specific results in [skill area].",
    ctaGoal: "Schedule an interview",
  },
  {
    label: "Thank you note",
    type: "thank-you",
    context:
      "I want to thank [recipient] for [specific thing they did]. It made a real difference because [concrete impact].",
    ctaGoal: "",
  },
  {
    label: "Meeting request",
    type: "meeting-request",
    context:
      "I would like to meet with [recipient] to discuss [specific topic]. 30 minutes should be enough.",
    ctaGoal: "Suggest 3 time options next week",
  },
  {
    label: "Polite decline",
    type: "cancellation",
    context:
      "I need to decline [invitation / offer / project]. The reason is [brief honest reason] and I want to leave the door open for the future.",
    ctaGoal: "",
  },
];

const TONE_LABELS = ["Formal", "Professional", "Balanced", "Warm", "Persuasive"];
const LENGTH_OPTIONS: { value: Length; label: string; hint: string }[] = [
  { value: "short", label: "Short", hint: "50-100 words" },
  { value: "medium", label: "Medium", hint: "100-200 words" },
  { value: "long", label: "Long", hint: "200-300 words" },
];

const STYLE_TAG_COLORS: Record<string, string> = {
  direct: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  warm: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  curious: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  confident: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  playful: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  formal: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  curiosity: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  benefit: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  urgency: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  personal: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  question: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  numeric: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  minimal: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  full: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  marketing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EmailGenerator() {
  const [type, setType] = useState<EmailType>("cold-outreach");
  const [senderName, setSenderName] = useState("");
  const [senderRole, setSenderRole] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("");
  const [context, setContext] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [ctaGoal, setCtaGoal] = useState("");
  const [tone, setTone] = useState(3);
  const [length, setLength] = useState<Length>("medium");
  const [includeSignature, setIncludeSignature] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isSubjectOnly = type === "subject-line";
  const isSignatureMode = type === "signature";
  const hideRecipient = type === "newsletter" || type === "signature";
  const hideCtaGoal =
    type === "thank-you" ||
    type === "apology" ||
    type === "signature" ||
    type === "subject-line";
  const hideLength = isSubjectOnly || isSignatureMode;

  const applyTemplate = useCallback((tpl: (typeof QUICK_TEMPLATES)[number]) => {
    setType(tpl.type);
    setContext(tpl.context);
    setCtaGoal(tpl.ctaGoal);
    setShowValidation(false);
  }, []);

  const handleCopy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard may be unavailable
    }
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!senderName.trim()) {
      setShowValidation(true);
      return;
    }
    if (!isSignatureMode && !context.trim()) {
      setShowValidation(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/email-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          senderName: senderName.trim(),
          senderRole: senderRole.trim(),
          recipientName: recipientName.trim(),
          recipientRole: recipientRole.trim(),
          context: context.trim(),
          keyPoints: keyPoints.trim(),
          ctaGoal: ctaGoal.trim(),
          tone,
          length,
          includeSignature,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate emails");

      setResult(data.emails);
      trackEvent("email_generator_submit", {
        type,
        tone: String(tone),
        length,
        includeSignature: String(includeSignature),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  /* ------------------------------------------------------------------ */
  /*  Results View                                                       */
  /* ------------------------------------------------------------------ */

  if (result) {
    const modeLabelMap: Record<EmailType, string> = {
      "cold-outreach": "Cold Emails",
      "sales-pitch": "Sales Pitches",
      "follow-up": "Follow-ups",
      networking: "Networking Emails",
      introduction: "Introduction Emails",
      reply: "Replies",
      "thank-you": "Thank-You Emails",
      apology: "Apology Emails",
      "meeting-request": "Meeting Requests",
      "feedback-request": "Feedback Requests",
      application: "Application Emails",
      cancellation: "Decline Emails",
      newsletter: "Newsletter Emails",
      welcome: "Welcome Emails",
      "break-up": "Break-up Emails",
      "subject-line": "Subject Lines",
      signature: "Email Signatures",
    };
    const modeLabel = modeLabelMap[result.type];

    return (
      <div className="w-full animate-reveal">
        <div className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 text-green-500 mb-5 border border-green-500/20">
            <Check className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-foreground mb-2">
            Your {modeLabel} Are Ready
          </h2>
          <p className="text-[14px] sm:text-[16px] text-muted-foreground max-w-md mx-auto">
            {result.emails.length} ready-to-send option{result.emails.length !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold text-foreground">{senderName}</span>
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {result.emails.map((v, i) => {
            const tagClass = STYLE_TAG_COLORS[v.style] ?? STYLE_TAG_COLORS.direct;
            const subjectKey = `${i}-subject`;
            const bodyKey = `${i}-body`;
            const fullKey = `${i}-full`;

            const subjectIsCopied = copiedKey === subjectKey;
            const bodyIsCopied = copiedKey === bodyKey;
            const fullIsCopied = copiedKey === fullKey;

            const fullText = result.type === "signature"
              ? v.body
              : result.type === "subject-line"
                ? `Subject: ${v.subject}${v.preview ? `\nPreview: ${v.preview}` : ""}`
                : `Subject: ${v.subject}\n\n${v.body}${v.signature ? `\n\n${v.signature}` : ""}`;

            return (
              <div
                key={`${i}-${v.subject || v.body.slice(0, 20)}`}
                className="rounded-2xl border border-border bg-background p-4 sm:p-6 transition-all duration-200 hover:border-border/80"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border ${tagClass}`}
                    >
                      {v.style}
                    </span>
                    {result.type !== "subject-line" && result.type !== "signature" && (
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground tabular-nums">
                        {v.wordCount} words
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject (not for signature mode) */}
                {v.subject && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Subject
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(subjectKey, v.subject)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                          subjectIsCopied
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                        aria-label="Copy subject"
                      >
                        {subjectIsCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[15px] sm:text-[16px] font-semibold text-foreground select-all">
                      {v.subject}
                    </p>
                    {v.preview && (
                      <p className="text-[12px] sm:text-[13px] text-muted-foreground italic mt-1 select-all">
                        {v.preview}
                      </p>
                    )}
                  </div>
                )}

                {/* Body */}
                {v.body && result.type !== "subject-line" && (
                  <div className="mb-3">
                    {!isSignatureMode && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        {isSignatureMode ? "Signature" : "Body"}
                      </span>
                    )}
                    <div className="text-[14px] sm:text-[15px] leading-relaxed text-foreground whitespace-pre-wrap select-all rounded-lg bg-muted/30 p-3 sm:p-4 border border-border/50 font-mono">
                      {v.body}
                    </div>
                  </div>
                )}

                {/* Signature (optional, when included with regular email) */}
                {v.signature && (
                  <div className="mb-3 pt-3 border-t border-border/50">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Signature
                    </span>
                    <div className="text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground whitespace-pre-wrap select-all">
                      {v.signature}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {v.ctaText && (
                  <div className="mb-3 text-[12px] sm:text-[13px] text-muted-foreground">
                    <span className="font-semibold">Suggested CTA: </span>
                    <span className="italic">{v.ctaText}</span>
                  </div>
                )}

                {/* Copy actions */}
                <div className="flex gap-2 mt-4">
                  {result.type !== "subject-line" && result.type !== "signature" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bodyKey, v.body)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        bodyIsCopied
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : "bg-muted hover:bg-muted/80 text-foreground border border-transparent"
                      }`}
                    >
                      {bodyIsCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {bodyIsCopied ? "Copied!" : "Copy Body"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(fullKey, fullText)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      fullIsCopied
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent"
                    }`}
                  >
                    {fullIsCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {fullIsCopied
                      ? "Copied!"
                      : result.type === "subject-line"
                        ? "Copy Subject + Preview"
                        : result.type === "signature"
                          ? "Copy Signature"
                          : "Copy Full Email"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {result.tip && (
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[13px] sm:text-sm text-foreground leading-relaxed">{result.tip}</p>
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="flex-1 rounded-2xl h-12 sm:h-14 text-[14px] sm:text-[16px]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Edit Inputs
          </Button>
          <Button
            onClick={() => handleGenerate()}
            size="lg"
            className="flex-1 rounded-2xl h-12 sm:h-14 text-[14px] sm:text-[16px]"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Regenerate
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Form View                                                          */
  /* ------------------------------------------------------------------ */

  const TypeIcon = TYPE_ICONS[type] ?? Mail;
  const submitButtonLabel = isSubjectOnly
    ? "Generate 5 Subject Lines"
    : isSignatureMode
      ? "Generate 3 Signatures"
      : "Generate 3 Emails";

  return (
    <form onSubmit={handleGenerate} className="w-full animate-reveal">
      {/* Quick-start templates */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2.5 sm:mb-3">
          Quick start - pick an email type:
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                type === t.type && context === t.context
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border bg-background hover:bg-muted hover:border-primary/30 text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Email type selector */}
        <div>
          <label
            htmlFor="email-type"
            className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
          >
            Email Type
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <TypeIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <select
              id="email-type"
              value={type}
              onChange={(e) => setType(e.target.value as EmailType)}
              className="flex w-full h-11 sm:h-12 rounded-xl border border-input bg-background pl-10 pr-3 text-[14px] sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
            >
              {EMAIL_TYPE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[11px] text-muted-foreground">Specialized modes:</span>
            <button
              type="button"
              onClick={() => setType("subject-line")}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                type === "subject-line"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <Type className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              Subject lines only
            </button>
            <button
              type="button"
              onClick={() => setType("signature")}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                type === "signature"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <Signature className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              Email signature
            </button>
          </div>
        </div>

        {/* Sender row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label
              htmlFor="email-sender-name"
              className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
            >
              Your Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="email-sender-name"
              type="text"
              placeholder="Jane Smith"
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                if (showValidation) setShowValidation(false);
              }}
              aria-required="true"
              aria-invalid={showValidation && !senderName.trim()}
              maxLength={80}
              className={`h-11 sm:h-12 text-[14px] sm:text-sm ${
                showValidation && !senderName.trim()
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
            />
            {showValidation && !senderName.trim() && (
              <p className="text-[11px] text-red-500 mt-1">Your name is required</p>
            )}
          </div>
          <div>
            <label
              htmlFor="email-sender-role"
              className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
            >
              Your Role / Company
            </label>
            <Input
              id="email-sender-role"
              type="text"
              placeholder="Head of Sales, Acme Inc."
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value)}
              maxLength={120}
              className="h-11 sm:h-12 text-[14px] sm:text-sm"
            />
          </div>
        </div>

        {/* Recipient row (hidden for newsletter/signature) */}
        {!hideRecipient && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label
                htmlFor="email-recipient-name"
                className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
              >
                Recipient Name
              </label>
              <Input
                id="email-recipient-name"
                type="text"
                placeholder="Alex Chen"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={80}
                className="h-11 sm:h-12 text-[14px] sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email-recipient-role"
                className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
              >
                Recipient Role / Company
              </label>
              <Input
                id="email-recipient-role"
                type="text"
                placeholder="VP Marketing, Globex Corp"
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
                maxLength={120}
                className="h-11 sm:h-12 text-[14px] sm:text-sm"
              />
            </div>
          </div>
        )}

        {/* Context (required unless signature mode) */}
        {!isSignatureMode && (
          <div>
            <label
              htmlFor="email-context"
              className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
            >
              {isSubjectOnly ? "What is this email about?" : "Purpose / Context"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="email-context"
              placeholder={
                isSubjectOnly
                  ? "I'm writing to introduce our new time-tracking app to operations leaders at mid-sized agencies."
                  : "Describe what this email is about. Be specific - who, what, why, and what you want them to do."
              }
              value={context}
              onChange={(e) => {
                setContext(e.target.value);
                if (showValidation) setShowValidation(false);
              }}
              maxLength={500}
              rows={3}
              aria-required="true"
              aria-invalid={showValidation && !context.trim()}
              className={`flex w-full rounded-xl border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-[14px] sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${
                showValidation && !context.trim()
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-input"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {showValidation && !context.trim() ? (
                <p className="text-[11px] text-red-500">Please describe the email context</p>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {context.length}/500
              </span>
            </div>
          </div>
        )}

        {/* CTA goal (hidden for certain types) */}
        {!hideCtaGoal && (
          <div>
            <label
              htmlFor="email-cta"
              className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
            >
              What should they do? (CTA)
            </label>
            <Input
              id="email-cta"
              type="text"
              placeholder="Book a 15-minute call next week"
              value={ctaGoal}
              onChange={(e) => setCtaGoal(e.target.value)}
              maxLength={120}
              className="h-11 sm:h-12 text-[14px] sm:text-sm"
            />
          </div>
        )}

        {/* Tone + Length row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label
              htmlFor="email-tone"
              className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
            >
              Tone: <span className="text-primary font-semibold">{TONE_LABELS[tone - 1]}</span>
            </label>
            <input
              id="email-tone"
              type="range"
              min={1}
              max={5}
              step={1}
              value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Formal</span>
              <span className="text-[10px] text-muted-foreground">Persuasive</span>
            </div>
          </div>

          {!hideLength && (
            <div>
              <span className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                Length
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={length === opt.value}
                    onClick={() => setLength(opt.value)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                      length === opt.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30"
                    }`}
                    title={opt.hint}
                  >
                    {opt.label}
                    <span className="ml-1 text-[10px] text-muted-foreground">({opt.hint})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Advanced toggle */}
        {!isSubjectOnly && !isSignatureMode && (
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors pt-1"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>
        )}

        {showAdvanced && !isSubjectOnly && !isSignatureMode && (
          <div className="space-y-4 sm:space-y-5 animate-reveal rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
            <div>
              <label
                htmlFor="email-keypoints"
                className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
              >
                Key Points to Include
              </label>
              <textarea
                id="email-keypoints"
                placeholder="- We shipped v2 with 3 new integrations&#10;- Our team doubled this year&#10;- Pricing starts at $29/mo"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                maxLength={400}
                rows={3}
                className="flex w-full rounded-xl border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-[14px] sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block text-right tabular-nums">
                {keyPoints.length}/400
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="w-4 h-4 rounded border-input accent-primary"
              />
              <span className="text-xs sm:text-sm text-foreground">
                Include a signature block with each email
              </span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={
          isGenerating ||
          !senderName.trim() ||
          (!isSignatureMode && !context.trim())
        }
        className="mt-6 sm:mt-8 w-full rounded-2xl shadow-premium text-[14px] sm:text-[16px] h-12 sm:h-14"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            Writing Your Email
            <span className="inline-block w-6 text-left">...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {submitButtonLabel}
          </>
        )}
      </Button>

      <p className="mt-2.5 sm:mt-3 text-[10px] sm:text-xs text-center text-muted-foreground">
        Free, no signup required. Up to 8 generations per day.
      </p>
    </form>
  );
}
