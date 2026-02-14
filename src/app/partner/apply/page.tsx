"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, Handshake } from "lucide-react";

const inputClass =
  "h-11 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0";
const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-4 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:opacity-50";

export default function PartnerApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!acceptedTerms) {
      setStatus({ type: "error", message: "Please accept the Program Terms and Terms of Service to continue." });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: null, message: "" });

    const formData = new FormData(form);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      audience: formData.get("audience"),
      promotionMethod: formData.get("promotionMethod"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit");
      }

      setStatus({
        type: "success",
        message: "Thank you! We'll review your application and get back to you within a few business days.",
      });
      form.reset();
      setAcceptedTerms(false);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative border-b border-border bg-background">
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/40 via-background to-background dark:from-muted/15 dark:via-background dark:to-background" />
        <div className="relative container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Partner Program
            </Link>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:text-orange-400">
              <Handshake className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Apply to{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Partner
              </span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Tell us about yourself and how you plan to promote Kolavi Studio. We review applications within a few business days.
            </p>
          </div>
        </div>
      </section>

      {/* Form card */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/5 px-6 py-8 sm:px-8 sm:py-10">

              <div className="px-6 py-6 sm:px-8 sm:py-8">
                {status.type === "success" ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-foreground">
                      Application received
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {status.message}
                    </p>
                    <Button asChild className="mt-8 h-11 rounded-2xl bg-orange-600 hover:bg-orange-700">
                      <Link href="/partner">Back to Partner Program</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        Full Name (as per government ID)
                      </label>
                      <Input
                        id="name"
                        name="name"
                        className={inputClass}
                        placeholder="Legal name on ID"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        className={inputClass}
                        placeholder="you@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-foreground">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        className={inputClass}
                        placeholder="+1 234 567 8900"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="audience" className="text-sm font-medium text-foreground">
                        Your Audience
                      </label>
                      <select
                        id="audience"
                        name="audience"
                        className={selectClass}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Select your primary audience</option>
                        <option value="medical-spa">Medical spas / aesthetics</option>
                        <option value="dental">Dental practices</option>
                        <option value="law">Law firms</option>
                        <option value="agencies">Marketing agencies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="promotionMethod" className="text-sm font-medium text-foreground">
                        How will you promote?
                      </label>
                      <select
                        id="promotionMethod"
                        name="promotionMethod"
                        className={selectClass}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Select promotion method</option>
                        <option value="website">Website / blog</option>
                        <option value="social">Social media</option>
                        <option value="email">Email / newsletter</option>
                        <option value="referral">Direct referrals</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-foreground">
                        Additional details (optional)
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={4}
                        className="min-h-[100px] rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 resize-none"
                        placeholder="Tell us more about your audience, reach, or why you want to partner with us."
                        disabled={isSubmitting}
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        disabled={isSubmitting}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-orange-600 focus:ring-2 focus:ring-ring focus:ring-offset-0"
                      />
                      <span className="text-sm text-foreground">
                        I accept the{" "}
                        <Link href="/partner/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400">
                          Partner Program Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400">
                          Kolavi Studio Terms of Service
                        </Link>
                      </span>
                    </label>

                    {status.type === "error" && (
                      <div
                        role="alert"
                        className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                      >
                        {status.message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || !acceptedTerms}
                      className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-medium text-white hover:bg-orange-700"
                    >
                      {isSubmitting ? "Submitting…" : "Submit Application"}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already a partner?{" "}
              <Link href="/partner/login" className="text-foreground underline underline-offset-4 hover:no-underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
