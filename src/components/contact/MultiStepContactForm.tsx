"use client";

import { useState } from "react";
import { trackEvent, EVENTS } from "@/lib/analytics/events";
import { Input } from "@/components/ui/input";
import { getReferralCodeForSubmit } from "@/lib/partner/cookie";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, label: "Your site" },
  { id: 2, label: "Your practice" },
  { id: 3, label: "Contact" },
];

const TREATMENT_CATEGORIES = [
  "Botox & Injectables",
  "Body Contouring",
  "Laser Treatments",
  "Skin Rejuvenation",
  "Medical Skincare",
  "IV Therapy / Wellness",
  "Other",
];

export function MultiStepContactForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    website: "",
    businessType: "",
    treatmentCategories: [] as string[],
    marketingSpend: "",
    name: "",
    email: "",
    phone: "",
    message: "",
    bestTime: "",
  });

  const update = (key: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTreatment = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      treatmentCategories: prev.treatmentCategories.includes(cat)
        ? prev.treatmentCategories.filter((c) => c !== cat)
        : [...prev.treatmentCategories, cat],
    }));
  };

  const canProceed = () => {
    if (step === 1) return formData.website.trim().length > 0 && formData.businessType;
    if (step === 2) return true;
    return formData.name.trim().length > 0 && formData.email.trim().length > 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canProceed()) return;
    setIsSubmitting(true);
    setSubmitStatus(null);

    const referralCode = getReferralCodeForSubmit();
    const data = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      businessType: formData.businessType,
      message: `Website: ${formData.website}
Treatments: ${formData.treatmentCategories.join(", ") || "Not specified"}
Marketing spend: ${formData.marketingSpend || "Not specified"}
Best time: ${formData.bestTime || "Not specified"}

${formData.message}`,
      honeypot: undefined,
      referralCode: referralCode || undefined,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      let result;
      if (isJson) {
        result = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(`Server error (${res.status}): ${text.slice(0, 100)}`);
      }

      if (!res.ok) throw new Error(result?.error || "Failed to submit");
      trackEvent(EVENTS.CONTACT_FORM_SUBMIT);
      setSubmitStatus({ type: "success", message: "Thank you! We'll get back to you within 24 hours." });
      setStep(1);
      setFormData({
        website: "",
        businessType: "",
        treatmentCategories: [],
        marketingSpend: "",
        name: "",
        email: "",
        phone: "",
        message: "",
        bestTime: "",
      });
    } catch (err) {
      setSubmitStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12">
      {/* Progress bar */}
      <div className="mb-8 flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s.id ? "bg-orange-500" : "bg-muted"
              }`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Step {step} of 3 - {STEPS[step - 1].label}
      </p>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="website" className="block text-sm font-medium">
              Your website URL
            </label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourmedspa.com"
              value={formData.website}
              onChange={(e) => update("website", e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="businessType" className="block text-sm font-medium">
              Business type
            </label>
            <select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => update("businessType", e.target.value)}
              disabled={isSubmitting}
              className="mt-2 flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2"
              required
            >
              <option value="">Select</option>
              <option value="medical-spa">Medical Spa</option>
              <option value="dental">Dental Practice</option>
              <option value="law">Law Firm</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <span className="block text-sm font-medium mb-2" id="treatment-categories-label">Treatment categories you offer</span>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="treatment-categories-label">
              {TREATMENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleTreatment(cat)}
                  aria-pressed={formData.treatmentCategories.includes(cat)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${formData.treatmentCategories.includes(cat)
                      ? "bg-orange-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="marketingSpend" className="block text-sm font-medium">
              Current monthly marketing spend (optional)
            </label>
            <select
              id="marketingSpend"
              value={formData.marketingSpend}
              onChange={(e) => update("marketingSpend", e.target.value)}
              disabled={isSubmitting}
              className="mt-2 flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2"
            >
              <option value="">Select</option>
              <option value="under-2k">Under $2,000</option>
              <option value="2k-5k">$2,000 - $5,000</option>
              <option value="5k-10k">$5,000 - $10,000</option>
              <option value="over-10k">Over $10,000</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              required
              disabled={isSubmitting}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              required
              disabled={isSubmitting}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">Phone (optional)</label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
              disabled={isSubmitting}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="bestTime" className="block text-sm font-medium">Best time for a call</label>
            <select
              id="bestTime"
              value={formData.bestTime}
              onChange={(e) => update("bestTime", e.target.value)}
              disabled={isSubmitting}
              className="mt-2 flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2"
            >
              <option value="">Select</option>
              <option value="morning">Morning (9am-12pm)</option>
              <option value="afternoon">Afternoon (12pm-5pm)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium">Anything else?</label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Goals, challenges, questions..."
              rows={4}
              disabled={isSubmitting}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {submitStatus && (
        <div
          role="alert"
          aria-live="polite"
          className={`mt-6 rounded-lg p-4 text-sm ${submitStatus.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
        >
          {submitStatus.message}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => !isSubmitting && setStep(step - 1)}
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || !canProceed()}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        )}
      </div>
    </form>
  );
}
