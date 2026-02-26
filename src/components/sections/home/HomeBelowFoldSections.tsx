"use client";

import dynamic from "next/dynamic";

const HowWeWorkSection = dynamic(
  () => import("@/components/sections/home/HowWeWorkSection").then((m) => ({ default: m.HowWeWorkSection })),
  { ssr: false }
);
const PricingSection = dynamic(
  () => import("@/components/sections/home/PricingSection").then((m) => ({ default: m.PricingSection })),
  { ssr: false }
);
const TestimonialsSection = dynamic(
  () => import("@/components/sections/home/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection })),
  { ssr: false }
);
const WhyChooseUsSection = dynamic(
  () => import("@/components/sections/home/WhyChooseUsSection").then((m) => ({ default: m.WhyChooseUsSection })),
  { ssr: false }
);
const WhoWeAreSection = dynamic(
  () => import("@/components/sections/home/WhoWeAreSection").then((m) => ({ default: m.WhoWeAreSection })),
  { ssr: false }
);
const FAQsSection = dynamic(
  () => import("@/components/sections/home/FAQsSection").then((m) => ({ default: m.FAQsSection })),
  { ssr: false }
);
const CTASection = dynamic(
  () => import("@/components/sections/home/CTASection").then((m) => ({ default: m.CTASection })),
  { ssr: false }
);

export function HomeBelowFoldSections() {
  return (
    <>
      <TestimonialsSection />
      <HowWeWorkSection />
      <PricingSection />
      <WhyChooseUsSection />
      <WhoWeAreSection />
      <FAQsSection />
      <CTASection />
    </>
  );
}
