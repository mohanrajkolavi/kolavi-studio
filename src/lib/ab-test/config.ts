/**
 * A/B test configuration. Connect to Optimizely, VWO, or custom backend later.
 * For now, uses sessionStorage for persistence (session-lifetime only).
 */

export const AB_TESTS = {
  HERO_HEADLINE: {
    id: "hero_headline",
    variants: [
      { id: "a", weight: 0.5 }, // Control
      { id: "b", weight: 0.5 },  // Variant
    ],
  },
  CTA_BUTTON: {
    id: "cta_button",
    variants: [
      { id: "a", weight: 0.5 },
      { id: "b", weight: 0.5 },
    ],
  },
} as const;

export type TestId = keyof typeof AB_TESTS;

export function getVariant(testId: TestId): string {
  if (typeof window === "undefined") return "a";
  const key = `ab_${testId}`;

  try {
    let variant = sessionStorage.getItem(key);
    if (!variant) {
      const test = AB_TESTS[testId];
      const r = Math.random();
      let cum = 0;
      for (const v of test.variants) {
        cum += v.weight;
        if (r < cum) {
          variant = v.id;
          break;
        }
      }
      variant = variant ?? test.variants[0].id;
      sessionStorage.setItem(key, variant);
    }
    return variant;
  } catch {
    return "a"; // Default to control on error
  }
}
