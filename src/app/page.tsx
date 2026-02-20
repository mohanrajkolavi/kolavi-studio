import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { HeroRevamp } from "@/components/sections/home/HeroRevamp";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/constants/homepage-faq";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";

const ServicesSection = dynamic(
  () => import("@/components/sections/home/ServicesSection").then((m) => ({ default: m.ServicesSection })),
  { ssr: true }
);
const HowWeWorkSection = dynamic(
  () => import("@/components/sections/home/HowWeWorkSection").then((m) => ({ default: m.HowWeWorkSection })),
  { ssr: true }
);
const PricingSection = dynamic(
  () => import("@/components/sections/home/PricingSection").then((m) => ({ default: m.PricingSection })),
  { ssr: true }
);
const WhyChooseUsSection = dynamic(
  () => import("@/components/sections/home/WhyChooseUsSection").then((m) => ({ default: m.WhyChooseUsSection })),
  { ssr: true }
);
const WhoWeAreSection = dynamic(
  () => import("@/components/sections/home/WhoWeAreSection").then((m) => ({ default: m.WhoWeAreSection })),
  { ssr: true }
);
const FAQsSection = dynamic(
  () => import("@/components/sections/home/FAQsSection").then((m) => ({ default: m.FAQsSection })),
  { ssr: true }
);
const CTASection = dynamic(
  () => import("@/components/sections/home/CTASection").then((m) => ({ default: m.CTASection })),
  { ssr: true }
);

export const metadata = getPageMetadata({
  title: "Kolavi Studio - Next.js Med Spa Websites & AI-Powered SEO | Fastest in the Industry",
  description:
    "The only med spa marketing agency built on Next.js, AI, and real results. 95-100 PageSpeed scores guaranteed. Dominate every treatment, Botox, fillers, CoolSculpting, lasers, not just one or two.",
  path: "/",
  image: `${SITE_URL}/og-image.jpg`,
  keywords:
    "med spa marketing agency, Next.js med spa websites, AI-powered SEO, medical spa SEO, PageSpeed optimization",
});

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const faqSchema = getFAQSchema(HOMEPAGE_FAQ_ITEMS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        nonce={nonce}
      />
      <main className="relative w-full">
        <HeroRevamp />
        <ServicesSection />
        <HowWeWorkSection />
        <PricingSection />
        <WhyChooseUsSection />
        <WhoWeAreSection />
        <FAQsSection />
        <CTASection />
      </main>
    </>
  );
}
