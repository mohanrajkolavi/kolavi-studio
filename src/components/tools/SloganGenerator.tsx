"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Megaphone,
  Flag,
  Shield,
  MessageCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

export type SloganMode = "slogan" | "tagline" | "motto" | "catchphrase";

interface SloganVersion {
  text: string;
  wordCount: number;
  style: string;
}

interface SloganResult {
  mode: SloganMode;
  versions: SloganVersion[];
  tip: string;
}

interface SloganGeneratorProps {
  /** Lock the mode (used on variant pages like /tools/motto-generator). When set, mode toggle is hidden. */
  defaultMode?: SloganMode;
}

const MODE_META: Record<SloganMode, {
  label: string;
  icon: React.ElementType;
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  industryLabel: string;
  audienceLabel: string;
  audienceOptions: { value: string; label: string }[];
  submitVerb: string;
}> = {
  slogan: {
    label: "Slogan",
    icon: Megaphone,
    nameLabel: "Brand or Business Name",
    namePlaceholder: "Acme Coffee",
    descriptionLabel: "What you do / product description",
    descriptionPlaceholder: "Single-origin coffee roasted daily in Brooklyn",
    industryLabel: "Industry",
    audienceLabel: "Target Audience",
    audienceOptions: [
      { value: "", label: "General" },
      { value: "small-business-owners", label: "Small Biz" },
      { value: "enterprise-buyers", label: "Enterprise" },
      { value: "young-consumers-18-30", label: "Gen Z / Millennials" },
      { value: "families", label: "Families" },
      { value: "creative-professionals", label: "Creatives" },
    ],
    submitVerb: "Slogans",
  },
  tagline: {
    label: "Tagline",
    icon: Flag,
    nameLabel: "Brand Name",
    namePlaceholder: "Acme Coffee",
    descriptionLabel: "Brand essence / what you stand for",
    descriptionPlaceholder: "Ethically sourced coffee that wakes up communities",
    industryLabel: "Category",
    audienceLabel: "Brand Audience",
    audienceOptions: [
      { value: "", label: "General" },
      { value: "loyal-customers", label: "Loyal Customers" },
      { value: "new-customers", label: "New Buyers" },
      { value: "investors", label: "Investors" },
      { value: "employees", label: "Team" },
    ],
    submitVerb: "Taglines",
  },
  motto: {
    label: "Motto",
    icon: Shield,
    nameLabel: "Person, Team, or Family Name",
    namePlaceholder: "The Lee Family",
    descriptionLabel: "Core values or purpose",
    descriptionPlaceholder: "Love, resilience, curiosity, and lifelong learning",
    industryLabel: "Context",
    audienceLabel: "Purpose",
    audienceOptions: [
      { value: "", label: "General" },
      { value: "personal-life", label: "Personal" },
      { value: "family", label: "Family" },
      { value: "sports-team", label: "Sports Team" },
      { value: "school-or-club", label: "School/Club" },
      { value: "business", label: "Business" },
    ],
    submitVerb: "Mottos",
  },
  catchphrase: {
    label: "Catchphrase",
    icon: MessageCircle,
    nameLabel: "Character, Channel, or Brand Name",
    namePlaceholder: "GameStream Gary",
    descriptionLabel: "Personality / vibe",
    descriptionPlaceholder: "High-energy gamer with a sarcastic streak",
    industryLabel: "Context",
    audienceLabel: "Vibe",
    audienceOptions: [
      { value: "", label: "General" },
      { value: "funny", label: "Funny" },
      { value: "epic", label: "Epic" },
      { value: "laid-back", label: "Laid-back" },
      { value: "dramatic", label: "Dramatic" },
      { value: "wholesome", label: "Wholesome" },
    ],
    submitVerb: "Catchphrases",
  },
};

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Marketing & Advertising",
  "Real Estate",
  "Legal",
  "Retail & E-commerce",
  "Media & Entertainment",
  "Design",
  "Manufacturing",
  "Construction",
  "Hospitality & Tourism",
  "Food & Beverage",
  "Automotive",
  "Energy & Utilities",
  "Telecommunications",
  "Agriculture",
  "Aerospace & Defense",
  "Nonprofit & NGO",
  "Pharmaceuticals & Biotech",
  "Insurance",
  "Transportation & Logistics",
  "Sports & Fitness",
  "Fashion & Apparel",
  "Gaming",
  "Music & Audio",
  "Consulting",
  "SaaS & Cloud",
  "Cybersecurity",
  "AI & Machine Learning",
  "Beauty & Cosmetics",
  "Home & Garden",
  "Pet Care",
  "Travel",
];

const STYLE_OPTIONS = [
  { key: "punchy", label: "Punchy" },
  { key: "rhyming", label: "Rhyming" },
  { key: "alliterative", label: "Alliterative" },
  { key: "metaphoric", label: "Metaphoric" },
  { key: "emotional", label: "Emotional" },
  { key: "benefit", label: "Benefit-led" },
];

const TONE_LABELS = ["Serious", "Professional", "Balanced", "Playful", "Bold & Witty"];

const STYLE_TAG_COLORS: Record<string, string> = {
  punchy: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  rhyming: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  alliterative: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  metaphoric: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  emotional: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  witty: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  aspirational: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  benefit: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SloganGenerator({ defaultMode = "slogan" }: SloganGeneratorProps) {
  const isModeLocked = defaultMode !== "slogan";

  const [mode, setMode] = useState<SloganMode>(defaultMode);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState(3);
  const [length, setLength] = useState<"auto" | "short" | "medium" | "long" | "custom">("auto");
  const [customWords, setCustomWords] = useState(5);
  const [styles, setStyles] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const [industryOpen, setIndustryOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const industryRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SloganResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const meta = MODE_META[mode];

  const toggleStyle = useCallback((key: string) => {
    setStyles((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key].slice(0, 3)
    );
  }, []);

  const filteredIndustries = industry.trim()
    ? INDUSTRIES.filter((ind) => ind.toLowerCase().includes(industry.trim().toLowerCase()))
    : INDUSTRIES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        industryRef.current &&
        !industryRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIndustryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleIndustryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!industryOpen) {
        if (e.key === "ArrowDown") {
          setIndustryOpen(true);
          setHighlightedIndex(0);
          e.preventDefault();
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredIndustries.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredIndustries.length) {
            setIndustry(filteredIndustries[highlightedIndex]);
            setIndustryOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIndustryOpen(false);
          setHighlightedIndex(-1);
          break;
        case "Tab":
          setIndustryOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [industryOpen, filteredIndustries, highlightedIndex]
  );

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleCopy = useCallback(async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // Clipboard may be unavailable
    }
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!brandName.trim()) {
      setShowValidation(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/slogan-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          brandName: brandName.trim(),
          description: description.trim(),
          industry: industry.trim(),
          audience,
          tone,
          length,
          customWords: length === "custom" ? customWords : undefined,
          styles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to generate ${meta.label.toLowerCase()}s`);

      setResult(data.slogans);
      trackEvent("slogan_generator_submit", {
        mode,
        tone: String(tone),
        styles: styles.join(",") || "auto",
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
    return (
      <div className="w-full animate-reveal">
        <div className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 text-green-500 mb-5 border border-green-500/20">
            <Check className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-foreground mb-2">
            Your {MODE_META[result.mode].label}s Are Ready
          </h2>
          <p className="text-[14px] sm:text-[16px] text-muted-foreground max-w-md mx-auto">
            {result.versions.length} {MODE_META[result.mode].label.toLowerCase()} options for{" "}
            <span className="font-semibold text-foreground">{brandName}</span>
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {result.versions.map((v, i) => {
            const isCopied = copiedIdx === i;
            const tagClass = STYLE_TAG_COLORS[v.style] ?? STYLE_TAG_COLORS.punchy;
            return (
              <div
                key={`${i}-${v.text}`}
                className="rounded-2xl border border-border bg-background p-4 sm:p-6 transition-all duration-200 hover:border-border/80"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border ${tagClass}`}>
                      {v.style}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground tabular-nums">
                      {v.wordCount} {v.wordCount === 1 ? "word" : "words"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(i, v.text)}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${
                      isCopied
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        : "bg-muted hover:bg-muted/80 text-foreground border border-transparent"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[17px] sm:text-[20px] leading-snug font-semibold text-foreground select-all">
                  {v.text}
                </p>
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

  return (
    <form onSubmit={handleGenerate} className="w-full animate-reveal">
      {!isModeLocked && (
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2.5 sm:mb-3">
            What do you want to create?
          </p>
          <div role="group" aria-label="Select mode" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {(Object.keys(MODE_META) as SloganMode[]).map((m) => {
              const info = MODE_META[m];
              const Icon = info.icon;
              const selected = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="slogan-name" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              {meta.nameLabel} <span className="text-red-500">*</span>
            </label>
            <Input
              id="slogan-name"
              type="text"
              placeholder={meta.namePlaceholder}
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                if (showValidation) setShowValidation(false);
              }}
              aria-required="true"
              aria-invalid={showValidation && !brandName.trim()}
              maxLength={120}
              className={`h-11 sm:h-12 text-[14px] sm:text-sm ${showValidation && !brandName.trim() ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {showValidation && !brandName.trim() && (
              <p className="text-[11px] text-red-500 mt-1">Name is required</p>
            )}
          </div>
          <div>
            <label htmlFor="slogan-industry" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              {meta.industryLabel}
            </label>
            <div className="relative">
              <Input
                ref={industryRef}
                id="slogan-industry"
                type="text"
                role="combobox"
                aria-expanded={industryOpen}
                aria-controls="slogan-industry-listbox"
                aria-autocomplete="list"
                aria-activedescendant={highlightedIndex >= 0 ? `slogan-industry-option-${highlightedIndex}` : undefined}
                autoComplete="off"
                placeholder="Type or select..."
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  setIndustryOpen(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setIndustryOpen(true)}
                onKeyDown={handleIndustryKeyDown}
                maxLength={100}
                className="h-11 sm:h-12 text-[14px] sm:text-sm"
              />
              {industryOpen && filteredIndustries.length > 0 && (
                <ul
                  ref={listRef}
                  id="slogan-industry-listbox"
                  role="listbox"
                  className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-background shadow-lg"
                >
                  {filteredIndustries.map((ind, i) => (
                    <li
                      key={ind}
                      id={`slogan-industry-option-${i}`}
                      role="option"
                      aria-selected={highlightedIndex === i}
                      onMouseDown={() => {
                        setIndustry(ind);
                        setIndustryOpen(false);
                        setHighlightedIndex(-1);
                      }}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        highlightedIndex === i
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {ind}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="slogan-description" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
            {meta.descriptionLabel}
          </label>
          <textarea
            id="slogan-description"
            placeholder={meta.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
            rows={2}
            className="flex w-full rounded-xl border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-[14px] sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <span className="text-[10px] text-muted-foreground mt-1 block text-right tabular-nums">
            {description.length}/400
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="slogan-tone" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              Tone: <span className="text-primary font-semibold">{TONE_LABELS[tone - 1]}</span>
            </label>
            <input
              id="slogan-tone"
              type="range"
              min={1}
              max={5}
              step={1}
              value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Serious</span>
              <span className="text-[10px] text-muted-foreground">Witty</span>
            </div>
          </div>

          <div>
            <span className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              {meta.audienceLabel}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {meta.audienceOptions.map((opt) => (
                <button
                  key={opt.value || "general"}
                  type="button"
                  aria-pressed={audience === opt.value}
                  onClick={() => setAudience(opt.value)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                    audience === opt.value
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors pt-1"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          {showAdvanced ? "Hide" : "Show"} style options
        </button>

        {showAdvanced && (
          <div className="space-y-4 sm:space-y-5 animate-reveal rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="block text-xs sm:text-sm font-medium text-foreground">
                  Length
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {length === "auto" && "AI picks the best length"}
                  {length === "short" && "2 to 4 words"}
                  {length === "medium" && "4 to 6 words"}
                  {length === "long" && "6 to 10 words"}
                  {length === "custom" && `exactly ${customWords} ${customWords === 1 ? "word" : "words"}`}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                Pick a length or leave on Auto for the AI to choose.
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(
                  [
                    { key: "auto", label: "Auto" },
                    { key: "short", label: "Short" },
                    { key: "medium", label: "Medium" },
                    { key: "long", label: "Long" },
                    { key: "custom", label: "Custom" },
                  ] as const
                ).map((opt) => {
                  const selected = length === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setLength(opt.key)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {length === "custom" && (
                <div className="mt-3 flex items-center gap-3">
                  <label htmlFor="custom-words" className="text-[11px] text-muted-foreground shrink-0">
                    Exact word count
                  </label>
                  <input
                    id="custom-words"
                    type="number"
                    min={2}
                    max={12}
                    value={customWords}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) {
                        setCustomWords(Math.min(12, Math.max(2, Math.round(n))));
                      }
                    }}
                    className="w-20 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-[11px] text-muted-foreground">(2 to 12 words)</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="block text-xs sm:text-sm font-medium text-foreground">
                  Style Preferences
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {styles.length}/3 picked
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                Pick up to 3 styles. Leave blank to let the AI mix freely.
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {STYLE_OPTIONS.map((s) => {
                  const selected = styles.includes(s.key);
                  const disabled = !selected && styles.length >= 3;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={selected}
                      disabled={disabled}
                      onClick={() => toggleStyle(s.key)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : disabled
                            ? "border-border/30 bg-background text-muted-foreground/40 cursor-not-allowed"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
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
        disabled={isGenerating || !brandName.trim()}
        className="mt-6 sm:mt-8 w-full rounded-2xl shadow-premium text-[14px] sm:text-[16px] h-12 sm:h-14"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            Crafting Your {meta.submitVerb}...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Generate 8 {meta.submitVerb}
          </>
        )}
      </Button>

      <p className="mt-2.5 sm:mt-3 text-[10px] sm:text-xs text-center text-muted-foreground">
        Free, no signup required. Powered by AI.
      </p>
    </form>
  );
}
