"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

export default function PartnerApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
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
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Partner Program
            </Link>

            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Apply to Partner
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Tell us about yourself and how you plan to promote Kolavi Studio. We review applications within a few business days.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Full Name (as per government ID)
                </label>
                <Input
                  id="name"
                  name="name"
                  className="mt-2"
                  placeholder="Legal name on ID"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="mt-2"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-2"
                  placeholder="+1 234 567 8900"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="audience" className="block text-sm font-medium">
                  Your Audience
                </label>
                <select
                  id="audience"
                  name="audience"
                  className="mt-2 flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:min-h-9 md:py-1 md:text-sm"
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

              <div>
                <label htmlFor="promotionMethod" className="block text-sm font-medium">
                  How will you promote?
                </label>
                <select
                  id="promotionMethod"
                  name="promotionMethod"
                  className="mt-2 flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:min-h-9 md:py-1 md:text-sm"
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

              <div>
                <label htmlFor="message" className="block text-sm font-medium">
                  Additional details (optional)
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-2"
                  placeholder="Tell us more about your audience, reach, or why you want to partner with us."
                  disabled={isSubmitting}
                />
              </div>

              {status.type && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className={`rounded-md p-4 ${
                    status.type === "success"
                      ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-2xl">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
