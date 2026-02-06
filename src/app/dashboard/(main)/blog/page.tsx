"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/dashboard/TagInput";
import { Loader2, Sparkles, ArrowLeft, X } from "lucide-react";
import { SEO } from "@/lib/constants";

type GeneratedContent = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
};

type IntentType = "informational" | "navigational" | "commercial" | "transactional";

const INTENT_OPTIONS: { value: IntentType; label: string }[] = [
  { value: "informational", label: "Informational" },
  { value: "navigational", label: "Navigational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
];

export default function BlogMakerPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [peopleAlsoSearchFor, setPeopleAlsoSearchFor] = useState<string[]>([]);
  const [intent, setIntent] = useState<IntentType[]>([]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [editing, setEditing] = useState<GeneratedContent | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    link?: string;
  }>({ type: null, message: "" });

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGenerating(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords.join(", "),
          peopleAlsoSearchFor: peopleAlsoSearchFor.join(", "),
          intent: intent.length > 0 ? intent : ["informational"],
          competitorUrls: competitorUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate blog post");
      }

      const result = await response.json();
      setGenerated(result);
      setEditing({ ...result });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate blog post",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!editing) return;

    setPublishing(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/blog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          content: editing.content,
          excerpt: editing.metaDescription,
          status: "draft",
          slug: editing.suggestedSlug,
          categories: editing.suggestedCategories,
          tags: editing.suggestedTags,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish blog post");
      }

      const result = await response.json();
      setStatus({
        type: "success",
        message: "Blog post created successfully!",
        link: result.post?.link,
      });

      setKeywords([]);
      setPeopleAlsoSearchFor([]);
      setIntent([]);
      setCompetitorUrls([]);
      setGenerated(null);
      setEditing(null);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to publish blog post",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Header – Apple/Google style: generous space, refined typography */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Blog Maker
        </h1>
        <p className="mt-2 text-base font-normal text-muted-foreground sm:text-lg">
          Generate SEO-optimized posts with AI and publish to WordPress
        </p>
      </header>

      {status.type && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-4 rounded-2xl px-5 py-4 text-sm ${
            status.type === "success"
              ? "bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-red-50/90 text-red-800 dark:bg-red-950/50 dark:text-red-200"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p>{status.message}</p>
            {status.type === "success" && status.link && (
              <a
                href={status.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-medium underline underline-offset-2 hover:no-underline"
              >
                View post →
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStatus({ type: null, message: "", link: undefined })}
            className="shrink-0 rounded-2xl p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!generated ? (
        <form
          onSubmit={handleGenerate}
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          {generating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 animate-in fade-in duration-200 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-5 text-sm font-medium text-muted-foreground">
                Generating your post…
              </p>
            </div>
          )}

          <div className="space-y-0">
            {/* Keywords & PASF */}
            <section className="grid gap-8 p-8 sm:grid-cols-2 sm:p-10">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Keywords
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Primary focus. First keyword is most important. Max 10.
                  </p>
                </div>
                <TagInput
                  tags={keywords}
                  onTagsChange={setKeywords}
                  placeholder="Add a keyword, press Enter"
                  maxTags={10}
                  disabled={generating}
                  className="min-h-12 rounded-2xl bg-background px-4 py-3"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    People also search for
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Related phrases for FAQs. Max 15.
                  </p>
                </div>
                <TagInput
                  tags={peopleAlsoSearchFor}
                  onTagsChange={setPeopleAlsoSearchFor}
                  placeholder="Add a phrase, press Enter"
                  maxTags={15}
                  disabled={generating}
                  className="min-h-12 rounded-2xl bg-background px-4 py-3"
                />
              </div>
            </section>

            {/* Search intent */}
            <section className="space-y-6 border-t border-border/50 p-8 sm:p-10">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Search intent
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select one or more to shape tone and structure
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {INTENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`inline-flex cursor-pointer items-center rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      intent.includes(opt.value)
                        ? "bg-orange-600 text-white shadow-md shadow-orange-500/20 dark:bg-orange-500 dark:shadow-orange-400/20"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${generating ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={intent.includes(opt.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIntent([...intent, opt.value]);
                        } else {
                          setIntent(intent.filter((i) => i !== opt.value));
                        }
                      }}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </section>

            {/* Competitor URLs */}
            <section className="space-y-3 border-t border-border/50 p-8 sm:p-10">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Competitor articles
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  URLs for structure reference. Fetched via Jina Reader. Max 5.
                </p>
              </div>
              <TagInput
                tags={competitorUrls}
                onTagsChange={setCompetitorUrls}
                placeholder="Paste URL, press Enter"
                maxTags={5}
                disabled={generating}
                className="min-h-12 rounded-2xl bg-background px-4 py-3"
              />
            </section>

            {/* Submit */}
            <section className="flex justify-end border-t border-border/50 p-8 sm:p-10">
              <Button
                type="submit"
                disabled={generating || keywords.length === 0}
                className="h-12 rounded-full bg-orange-600 px-8 text-base font-medium text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/25 dark:bg-orange-500 dark:shadow-orange-400/20 dark:hover:bg-orange-600 disabled:shadow-none"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate post
              </Button>
            </section>
          </div>
        </form>
      ) : editing ? (
        <div className="space-y-8">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGenerated(null);
                setEditing(null);
              }}
              className="-ml-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Start over
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing({ ...generated! })}
                className="rounded-full border-border"
              >
                Reset edits
              </Button>
              <Button
                size="sm"
                disabled={publishing || !editing.title || !editing.content}
                onClick={handlePublish}
                className="rounded-full bg-orange-600 px-6 text-white shadow-md shadow-orange-500/20 hover:bg-orange-700 dark:bg-orange-500 dark:shadow-orange-400/20 dark:hover:bg-orange-600"
              >
                {publishing ? "Publishing…" : "Publish to WordPress"}
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-8">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  Meta
                </h3>
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-foreground">
                      Title
                    </label>
                    <Input
                      id="edit-title"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      className="mt-2 h-11 rounded-2xl border border-border bg-background"
                    />
                    <p
                      className={`mt-1.5 text-right text-xs ${
                        editing.title.length > SEO.TITLE_MAX_CHARS
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {editing.title.length}/{SEO.TITLE_MAX_CHARS}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="edit-meta" className="block text-sm font-medium text-foreground">
                      Meta description
                    </label>
                    <Textarea
                      id="edit-meta"
                      value={editing.metaDescription}
                      onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                      rows={2}
                      className="mt-2 rounded-2xl border border-border bg-background text-sm"
                    />
                    <p className="mt-1.5 text-right text-xs text-muted-foreground">
                      {editing.metaDescription.length}/{SEO.META_DESCRIPTION_MAX_CHARS}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="edit-slug" className="block text-sm font-medium text-foreground">
                      URL slug
                    </label>
                    <Input
                      id="edit-slug"
                      value={editing.suggestedSlug ?? ""}
                      onChange={(e) => setEditing({ ...editing, suggestedSlug: e.target.value })}
                      className="mt-2 h-11 rounded-2xl border border-border bg-background font-mono text-sm"
                    />
                    <p className="mt-1.5 text-right text-xs text-muted-foreground">
                      {(editing.suggestedSlug ?? "").length}/75
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  Outline
                </h3>
                <div className="mt-6 space-y-3">
                  {editing.outline.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="w-6 shrink-0 pt-2.5 text-sm tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newOutline = [...editing.outline];
                          newOutline[index] = e.target.value;
                          setEditing({ ...editing, outline: newOutline });
                        }}
                        className="rounded-2xl border border-border bg-background"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <label htmlFor="edit-content" className="block text-sm font-semibold text-foreground">
                Content (HTML)
              </label>
              <Textarea
                id="edit-content"
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={28}
                className="mt-4 rounded-2xl border border-border bg-background font-mono text-sm"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
