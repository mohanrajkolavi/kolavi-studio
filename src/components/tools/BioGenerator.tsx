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
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Globe,
  Mail,
  Facebook,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

interface BioVersion {
  bio: string;
  charCount: number;
}

interface BioResult {
  versions: BioVersion[];
  limit: number;
  tip: string;
}

interface PlatformConfig {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  limit: number;
  color: string;
}

const PLATFORMS: PlatformConfig[] = [
  { key: "linkedin_headline", label: "LinkedIn Headline", shortLabel: "LinkedIn", icon: Linkedin, limit: 120, color: "bg-[#0A66C2]" },
  { key: "linkedin_about", label: "LinkedIn About", shortLabel: "LI About", icon: Linkedin, limit: 2000, color: "bg-[#0A66C2]" },
  { key: "twitter", label: "Twitter / X", shortLabel: "Twitter", icon: Twitter, limit: 160, color: "bg-foreground" },
  { key: "instagram", label: "Instagram", shortLabel: "Insta", icon: Instagram, limit: 150, color: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
  { key: "tiktok", label: "TikTok", shortLabel: "TikTok", icon: Globe, limit: 80, color: "bg-foreground" },
  { key: "facebook", label: "Facebook", shortLabel: "Facebook", icon: Facebook, limit: 101, color: "bg-[#1877F2]" },
  { key: "github", label: "GitHub", shortLabel: "GitHub", icon: Github, limit: 160, color: "bg-foreground" },
  { key: "professional", label: "Professional / Website", shortLabel: "Website", icon: Globe, limit: 500, color: "bg-primary" },
  { key: "email_signature", label: "Email Signature", shortLabel: "Email", icon: Mail, limit: 200, color: "bg-primary" },
  { key: "threads", label: "Threads", shortLabel: "Threads", icon: Globe, limit: 150, color: "bg-foreground" },
];

const ROLE_TEMPLATES = [
  { label: "Software Engineer", role: "Software Engineer", industry: "Technology", skills: "Full-stack development, system design, cloud architecture" },
  { label: "Marketing Manager", role: "Marketing Manager", industry: "Marketing & Advertising", skills: "Brand strategy, digital marketing, content creation, analytics" },
  { label: "Founder / CEO", role: "Founder & CEO", industry: "", skills: "Business strategy, fundraising, team building, product vision" },
  { label: "Designer", role: "Product Designer", industry: "Design", skills: "UI/UX design, design systems, user research, prototyping" },
  { label: "Content Creator", role: "Content Creator", industry: "Media & Entertainment", skills: "Video production, storytelling, community building" },
  { label: "Freelancer", role: "Freelance Consultant", industry: "", skills: "Project management, client relations, domain expertise" },
  { label: "Student", role: "Student", industry: "Education", skills: "Research, academic writing, emerging technologies" },
  { label: "Real Estate Agent", role: "Real Estate Agent", industry: "Real Estate", skills: "Property valuation, negotiation, market analysis, client advisory" },
];

const AUDIENCE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "recruiters", label: "Recruiters" },
  { value: "clients", label: "Clients" },
  { value: "collaborators", label: "Collaborators" },
  { value: "followers", label: "Followers" },
];

const TONE_LABELS = ["Very Formal", "Professional", "Balanced", "Casual", "Bold & Witty"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BioGenerator() {
  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [achievements, setAchievements] = useState("");
  const [skills, setSkills] = useState("");
  const [personality, setPersonality] = useState("");
  const [tone, setTone] = useState(3);
  const [audience, setAudience] = useState("general");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "linkedin_headline",
    "twitter",
    "instagram",
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Results state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, BioResult> | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [activeVersion, setActiveVersion] = useState<Record<string, number>>({});

  const togglePlatform = useCallback((key: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }, []);

  const applyTemplate = useCallback((template: typeof ROLE_TEMPLATES[0]) => {
    setRole(template.role);
    setIndustry(template.industry);
    setSkills(template.skills);
  }, []);

  const handleCopy = useCallback(async (platform: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || !role.trim() || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setResults(null);

    const controller = new AbortController();

    try {
      const res = await fetch("/api/bio-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          industry: industry.trim(),
          achievements: achievements.trim(),
          skills: skills.trim(),
          personality: personality.trim(),
          tone,
          platforms: selectedPlatforms,
          audience,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate bios");

      setResults(data.bios);
      setActiveVersion({});
      trackEvent("bio_generator_submit", {
        platforms: selectedPlatforms.join(","),
        tone: String(tone),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  /* ------------------------------------------------------------------ */
  /*  Results View                                                       */
  /* ------------------------------------------------------------------ */

  if (results) {
    const platformResults = PLATFORMS.filter((p) => results[p.key]);
    return (
      <div className="w-full animate-reveal">
        {/* Success header */}
        <div className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 text-green-500 mb-5 border border-green-500/20">
            <Check className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-foreground mb-2">
            Your Bios Are Ready
          </h2>
          <p className="text-[14px] sm:text-[16px] text-muted-foreground max-w-md mx-auto">
            {platformResults.length} platform-optimized bio{platformResults.length !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold text-foreground">{name}</span>
          </p>
        </div>

        {/* Bio cards */}
        <div className="space-y-3 sm:space-y-4">
          {platformResults.map((platform) => {
            const result = results[platform.key];
            if (!result) return null;
            const Icon = platform.icon;
            const vIdx = activeVersion[platform.key] ?? 0;
            const bio = result.versions[vIdx] ?? result.versions[0];
            const hasMultiple = result.versions.length > 1;
            const isOver = bio.charCount > result.limit;
            const pct = Math.min((bio.charCount / result.limit) * 100, 100);
            const isCopied = copiedPlatform === platform.key;

            return (
              <div
                key={platform.key}
                className="rounded-2xl border border-border bg-background p-4 sm:p-6 transition-all duration-200 hover:border-border/80"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${platform.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground text-[13px] sm:text-[15px] hidden sm:inline">{platform.label}</span>
                      <span className="font-semibold text-foreground text-[13px] sm:hidden">{platform.shortLabel}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(platform.key, bio.bio)}
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

                {/* Version tabs */}
                {hasMultiple && (
                  <div className="flex items-center gap-1 mb-3">
                    {result.versions.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveVersion((prev) => ({ ...prev, [platform.key]: i }))}
                        className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-200 ${
                          vIdx === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                      >
                        V{i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bio text */}
                <p className="text-[14px] sm:text-[15px] leading-relaxed text-foreground whitespace-pre-wrap mb-3 select-all">
                  {bio.bio}
                </p>

                {/* Character count bar */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? "bg-red-500" : pct > 85 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium tabular-nums shrink-0 ${isOver ? "text-red-500" : "text-muted-foreground"}`}>
                    {bio.charCount}/{result.limit}
                  </span>
                </div>

                {/* Tip */}
                {result.tip && (
                  <p className="mt-2 sm:mt-2.5 text-[11px] sm:text-xs text-muted-foreground flex items-start gap-1.5">
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                    <span>{result.tip}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="flex-1 rounded-2xl h-12 sm:h-14 text-[14px] sm:text-[16px]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Edit & Regenerate
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
            Regenerate All
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
      {/* Quick-start templates */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2.5 sm:mb-3">
          Quick start  - pick a role:
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {ROLE_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all duration-200 ${
                role === t.role
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
        {/* Name + Role side by side on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="bio-name" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="bio-name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="h-11 sm:h-12 text-[14px] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="bio-industry" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              Industry
            </label>
            <Input
              id="bio-industry"
              type="text"
              placeholder="Technology, Finance..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              maxLength={100}
              className="h-11 sm:h-12 text-[14px] sm:text-sm"
            />
          </div>
        </div>

        {/* Role  - full width */}
        <div>
          <label htmlFor="bio-role" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
            Role / Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="bio-role"
            type="text"
            placeholder="Senior Product Designer at Acme Inc."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            maxLength={200}
            className="h-11 sm:h-12 text-[14px] sm:text-sm"
          />
        </div>

        {/* Platform selection */}
        <div>
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <label className="block text-xs sm:text-sm font-medium text-foreground">
              Platforms <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] sm:text-xs text-muted-foreground tabular-nums">
              {selectedPlatforms.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const selected = selectedPlatforms.includes(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePlatform(p.key)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 text-left ${
                    selected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate hidden sm:inline">{p.label}</span>
                  <span className="truncate sm:hidden">{p.shortLabel}</span>
                  {selected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone + Audience row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Tone slider */}
          <div>
            <label htmlFor="bio-tone" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              Tone: <span className="text-primary font-semibold">{TONE_LABELS[tone - 1]}</span>
            </label>
            <input
              id="bio-tone"
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
              <span className="text-[10px] text-muted-foreground">Witty</span>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
              Audience
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
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

        {/* Advanced fields toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors pt-1"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          {showAdvanced ? "Hide" : "Show"} advanced options
        </button>

        {showAdvanced && (
          <div className="space-y-4 sm:space-y-5 animate-reveal rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
            <div>
              <label htmlFor="bio-achievements" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                Key Achievements
              </label>
              <textarea
                id="bio-achievements"
                placeholder="Led a team of 20, grew revenue 3x, published in Forbes..."
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                maxLength={500}
                rows={2}
                className="flex w-full rounded-xl border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="bio-skills" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                  Skills / Expertise
                </label>
                <Input
                  id="bio-skills"
                  type="text"
                  placeholder="React, Python, Growth..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  maxLength={300}
                  className="h-11 sm:h-12 text-[14px] sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="bio-personality" className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                  Personality / Fun Facts
                </label>
                <Input
                  id="bio-personality"
                  type="text"
                  placeholder="Coffee addict, runner..."
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  maxLength={300}
                  className="h-11 sm:h-12 text-[14px] sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isGenerating || !name.trim() || !role.trim() || selectedPlatforms.length === 0}
        className="mt-6 sm:mt-8 w-full rounded-2xl shadow-premium text-[14px] sm:text-[16px] h-12 sm:h-14"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            Crafting Your Bios...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Generate {selectedPlatforms.length} Bio{selectedPlatforms.length !== 1 ? "s" : ""}
          </>
        )}
      </Button>

      <p className="mt-2.5 sm:mt-3 text-[10px] sm:text-xs text-center text-muted-foreground">
        Free, no signup required. Powered by AI.
      </p>
    </form>
  );
}
