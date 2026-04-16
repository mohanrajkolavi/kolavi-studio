/**
 * GA4 custom events. Call these when conversions happen.
 * Requires NEXT_PUBLIC_GA_MEASUREMENT_ID to be set.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
}

export const EVENTS = {
  SPEED_AUDIT_SUBMIT: "speed_audit_submit",
  GEO_CHECKER_SUBMIT: "geo_checker_submit",
  CONSULTATION_BOOK: "consultation_book",
  CONTACT_FORM_SUBMIT: "contact_form_submit",
  PRICING_TIER_CLICK: "pricing_tier_click",
  BIO_GENERATOR_SUBMIT: "bio_generator_submit",
  EMAIL_GENERATOR_SUBMIT: "email_generator_submit",
  SITEMAP_GENERATOR_SUBMIT: "sitemap_generator_submit",
  SITEMAP_GENERATOR_DOWNLOAD: "sitemap_generator_download",
  SITEMAP_GENERATOR_COPY: "sitemap_generator_copy",
} as const;
