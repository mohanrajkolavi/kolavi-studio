import { headers } from "next/headers";
import { HeroRevamp } from "@/components/sections/home/HeroRevamp";
import { ServicesSection } from "@/components/sections/home/ServicesSection";
import { HowWeWorkSection } from "@/components/sections/home/HowWeWorkSection";
import { PricingSection } from "@/components/sections/home/PricingSection";
import { WhyChooseUsSection } from "@/components/sections/home/WhyChooseUsSection";
import { WhoWeAreSection } from "@/components/sections/home/WhoWeAreSection";
import { FAQsSection } from "@/components/sections/home/FAQsSection";
import { CTASection } from "@/components/sections/home/CTASection";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/constants/homepage-faq";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";

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
