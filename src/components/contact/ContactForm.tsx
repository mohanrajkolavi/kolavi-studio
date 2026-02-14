"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getReferralCodeForSubmit } from "@/lib/partner/cookie";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    const formData = new FormData(form);
    const referralCode = getReferralCodeForSubmit();
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      businessType: formData.get("businessType"),
      message: formData.get("message"),
      honeypot: formData.get("website"), // Honeypot field
      referralCode: referralCode || undefined,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit form");
      }

      setSubmitStatus({
        type: "success",
        message: "Thank you! We'll get back to you within 24 hours.",
      });
      form.reset();
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 space-y-6">
      {/* Honeypot field - hidden from users but bots might fill it */}
      <div className="hidden">
        <label htmlFor="website">Website (leave blank)</label>
        <Input type="text" id="website" name="website" tabIndex={-1} />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input
          type="text"
          id="name"
          name="name"
          className="mt-2"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email Address
        </label>
        <Input
          type="email"
          id="email"
          name="email"
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
          type="tel"
          id="phone"
          name="phone"
          className="mt-2"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="businessType" className="block text-sm font-medium">
          Business Type
        </label>
        <select
          id="businessType"
          name="businessType"
          className="mt-2 flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20 md:min-h-9 md:py-1 md:text-sm"
          disabled={isSubmitting}
        >
          <option value="">Select your business type</option>
          <option value="medical-spa">Medical Spa</option>
          <option value="dental">Dental Practice</option>
          <option value="law">Law Firm</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Tell us about your project
        </label>
        <Textarea
          id="message"
          name="message"
          rows={6}
          className="mt-2"
          placeholder="What are your goals? What challenges are you facing?"
          required
          disabled={isSubmitting}
        />
      </div>

      {submitStatus.type && (
        <div
          className={`rounded-md p-4 ${
            submitStatus.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <div>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
}
