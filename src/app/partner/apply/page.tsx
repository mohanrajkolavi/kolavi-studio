"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";

const inputClass =
  "h-14 rounded-xl border border-input bg-background text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent px-4";
const selectClass =
  "h-14 w-full rounded-xl border border-input bg-background px-4 text-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:opacity-50";

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
      <PageHero
        title="Apply to Partner"
        description="Tell us about yourself and how you plan to strategically promote Kolavi Studio. We thoroughly review all applications within a few business days."
        badge="Application"
      />

      <section className="relative z-10 bg-background py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl animate-reveal">
            <div className="overflow-hidden rounded-[32px] border border-border bg-card shadow-premium p-8 sm:p-12">

              {status.type === "success" ? (
                <div className="flex flex-col items-center py-8 text-center animate-reveal">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-8">
                    <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
                  </div>
                  <h2 className="text-h3 text-foreground mb-4">
                    Application Received
                  </h2>
                  <p className="text-body text-muted-foreground mb-10 max-w-sm">
                    {status.message}
                  </p>
                  <Button asChild size="lg" className="h-14 px-8 rounded-[48px] bg-primary hover:bg-primary/90 text-primary-foreground text-button shadow-premium">
                    <Link href="/partner">Back to Partner Program</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label htmlFor="name" className="text-small font-semibold text-foreground">
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

                  <div className="space-y-3">
                    <label htmlFor="email" className="text-small font-semibold text-foreground">
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

                  <div className="space-y-3">
                    <label htmlFor="phone" className="text-small font-semibold text-foreground">
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

                  <div className="space-y-3">
                    <label htmlFor="audience" className="text-small font-semibold text-foreground">
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

                  <div className="space-y-3">
                    <label htmlFor="promotionMethod" className="text-small font-semibold text-foreground">
                      How will you actively promote?
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

                  <div className="space-y-3">
                    <label htmlFor="message" className="text-small font-semibold text-foreground">
                      Additional details (optional)
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="min-h-[120px] rounded-xl border border-input bg-background px-4 py-3 text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent resize-none"
                      placeholder="Tell us more about your exact audience, reach, or why you want to partner with us."
                      disabled={isSubmitting}
                    />
                  </div>

                  <label className="flex cursor-pointer items-start gap-4 py-4">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      disabled={isSubmitting}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-small text-muted-foreground leading-relaxed">
                      I fully accept the{" "}
                      <Link href="/partner/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                        Partner Program Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                        Kolavi Studio Terms of Service
                      </Link>
                    </span>
                  </label>

                  {status.type === "error" && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-small text-red-500"
                    >
                      {status.message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !acceptedTerms}
                    className="h-14 w-full rounded-[48px] bg-primary text-button text-primary-foreground hover:bg-primary/90 shadow-premium mt-4"
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </form>
              )}
            </div>

            <p className="mt-8 text-center text-body text-muted-foreground">
              Already a partner?{" "}
              <Link href="/partner/login" className="text-foreground font-semibold hover:text-primary transition-colors">
                Sign in securely
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
