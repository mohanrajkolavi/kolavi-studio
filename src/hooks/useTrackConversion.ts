"use client";

import { useCallback } from "react";
import { trackEvent, EVENTS } from "@/lib/analytics/events";

export function useTrackConversion() {
  const sanitizeUrl = (url: string) => {
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`;
    } catch {
      return url;
    }
  };

  const trackSpeedAudit = useCallback((url: string) => {
    trackEvent(EVENTS.SPEED_AUDIT_SUBMIT, { url: sanitizeUrl(url) });
  }, []);

  const trackTreatmentAnalyzer = useCallback((url: string) => {
    trackEvent(EVENTS.TREATMENT_ANALYZER_SUBMIT, { url: sanitizeUrl(url) });
  }, []);

  const trackCompetitorComparison = useCallback(() => {
    trackEvent(EVENTS.COMPETITOR_COMPARISON_SUBMIT);
  }, []);

  const trackContactSubmit = useCallback(() => {
    trackEvent(EVENTS.CONTACT_FORM_SUBMIT);
  }, []);

  const trackPricingClick = useCallback((tier: string) => {
    trackEvent(EVENTS.PRICING_TIER_CLICK, { tier });
  }, []);

  return {
    trackSpeedAudit,
    trackTreatmentAnalyzer,
    trackCompetitorComparison,
    trackContactSubmit,
    trackPricingClick,
  };
}
