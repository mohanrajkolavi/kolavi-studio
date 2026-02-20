"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";

const inputClass =
  "h-12 rounded-[12px] border border-input bg-background text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-colors px-4";
const selectClass =
  "h-12 w-full rounded-[12px] border border-input bg-background px-4 text-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-colors disabled:opacity-50";

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
      company: formData.get("company"),
      role: formData.get("role"),
      networkSize: formData.get("networkSize"),
      source: formData.get("source"),
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

      const submittedEmail = formData.get("email") as string;
      setStatus({
        type: "success",
        message: `Thanks for applying. We review every application within 48 hours. You'll receive an email at ${submittedEmail} with next steps. If approved, you'll get login credentials and your unique referral link.`,
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

  if (status.type === "success") {
    return (
      <PartnerAuthShell maxWidth="800px">
        <div className="flex flex-col items-center py-12 text-center animate-reveal">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
          </div>
          <h2 className="text-h3 text-foreground mb-4">
            Application Submitted
          </h2>
          <p className="text-body text-muted-foreground mb-8 max-w-lg">
            {status.message}
          </p>
          <Button asChild variant="outline" className="h-12 w-full sm:w-auto px-8 rounded-[48px] text-button">
            <Link href="/partner">Back to Partner Program</Link>
          </Button>
        </div>
      </PartnerAuthShell>
    );
  }

  return (
    <PartnerAuthShell maxWidth="800px">
      <div className="text-center mb-8">
        <h1 className="text-h3 text-foreground mb-2">Apply to the Partner Program</h1>
        <p className="text-small text-muted-foreground">
          Refer med spa owners. Earn recurring commissions. Takes 2 minutes to apply.
        </p>
      </div>

      <div className="h-px bg-border my-8 w-full" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-[14px] font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                className={inputClass}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-[14px] font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                className={inputClass}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-[14px] font-medium text-foreground">
                Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                className={inputClass}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-[14px] font-medium text-foreground">
                Company / Organization <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="company"
                name="company"
                className={inputClass}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="role" className="text-[14px] font-medium text-foreground">
                Your Role <span className="text-destructive">*</span>
              </label>
              <select
                id="role"
                name="role"
                className={selectClass}
                required
                disabled={isSubmitting}
                defaultValue=""
              >
                <option value="" disabled className="text-muted-foreground">Select your role</option>
                <option value="consultant">Consultant</option>
                <option value="software">Software Vendor</option>
                <option value="equipment">Equipment Supplier</option>
                <option value="professional">Accountant / Attorney</option>
                <option value="agency">Web Developer / Designer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="networkSize" className="text-[14px] font-medium text-foreground">
                Network Size <span className="text-destructive">*</span>
              </label>
              <select
                id="networkSize"
                name="networkSize"
                className={selectClass}
                required
                disabled={isSubmitting}
                defaultValue=""
              >
                <option value="" disabled className="text-muted-foreground">Med spa relationships</option>
                <option value="1-5">1-5</option>
                <option value="6-15">6-15</option>
                <option value="16-50">16-50</option>
                <option value="50+">50+</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="source" className="text-[14px] font-medium text-foreground">
                How did you hear about Kolavi? <span className="text-destructive">*</span>
              </label>
              <select
                id="source"
                name="source"
                className={selectClass}
                required
                disabled={isSubmitting}
                defaultValue=""
              >
                <option value="" disabled className="text-muted-foreground">Select an option</option>
                <option value="google">Google</option>
                <option value="social">Social Media</option>
                <option value="referral">Referral</option>
                <option value="blog">Blog</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-[14px] font-medium text-foreground">
                Brief description of how you'd refer clients <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                id="message"
                name="message"
                rows={3}
                maxLength={500}
                className="min-h-[72px] rounded-[12px] border border-input bg-background text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-colors p-3 resize-none"
                placeholder="Tell us a bit about your network and how you'd introduce Kolavi to med spa owners."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[14px] text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link href="/partner/terms" target="_blank" className="font-medium text-foreground underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
                Partner Program Terms and Conditions
              </Link>
            </span>
          </label>
        </div>

        {status.type === "error" && (
          <div
            className="text-[14px] text-destructive flex items-start gap-2"
            role="alert"
          >
            <span className="block">{status.message}</span>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-[48px] bg-primary text-button text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-4"
          disabled={isSubmitting || !acceptedTerms}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>

      <div className="h-px bg-border my-8 w-full" />

      <div className="flex flex-col sm:flex-row items-center justify-between text-[14px] text-muted-foreground gap-4">
        <div>
          Already a partner?{" "}
          <Link href="/partner/login" className="font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            Log in here
          </Link>
        </div>
        <div>
          Questions about the program?{" "}
          <Link href="/contact" className="font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            Contact us
          </Link>
        </div>
      </div>
    </PartnerAuthShell>
  );
}
