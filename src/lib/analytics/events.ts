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
  TREATMENT_ANALYZER_SUBMIT: "treatment_analyzer_submit",
  GEO_CHECKER_SUBMIT: "geo_checker_submit",
  COMPETITOR_COMPARISON_SUBMIT: "competitor_comparison_submit",
  ROI_CALCULATOR_VIEW: "roi_calculator_view",
  TREATMENT_VISUALIZER_VIEW: "treatment_visualizer_view",
  CONSULTATION_BOOK: "consultation_book",
  CONTACT_FORM_SUBMIT: "contact_form_submit",
  PRICING_TIER_CLICK: "pricing_tier_click",
} as const;
