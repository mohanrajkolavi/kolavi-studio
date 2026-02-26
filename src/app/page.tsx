import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { HeroRevamp } from "@/components/sections/home/HeroRevamp";
import { HomeBelowFoldSections } from "@/components/sections/home/HomeBelowFoldSections";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/constants/homepage-faq";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";

const ServicesSection = dynamic(
  () => import("@/components/sections/home/ServicesSection").then((m) => ({ default: m.ServicesSection })),
  { ssr: true }
);

export const metadata = getPageMetadata({
  title: "Kolavi Studio — AI-Native Growth Agency | PageSpeed & SEO",
  description:
    "Your site loads in 4 seconds. Every second costs you a booking. We build performance websites, AI-powered SEO, and automation that compounds. Free revenue audit.",
  path: "/",
  image: `${SITE_URL}/og-image.jpg`,
  keywords:
    "growth agency, Next.js websites, AI-powered SEO, PageSpeed optimization, lead generation, revenue audit",
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
      <main id="main-content" className="relative w-full">
        <HeroRevamp />
        <ServicesSection />
        <HomeBelowFoldSections />
      </main>
    </>
  );
}
