import { SITE_NAME, SITE_URL } from "@/lib/constants";

function getOrgAddress() {
  const street = process.env.NEXT_PUBLIC_ORG_STREET_ADDRESS?.trim();
  const locality = process.env.NEXT_PUBLIC_ORG_ADDRESS_LOCALITY?.trim();
  const postal = process.env.NEXT_PUBLIC_ORG_POSTAL_CODE?.trim();
  return {
    "@type": "PostalAddress" as const,
    ...(street && { streetAddress: street }),
    ...(locality && { addressLocality: locality }),
    ...(postal && { postalCode: postal }),
    addressCountry: "US",
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Digital growth agency specializing in Next.js websites, AI-driven SEO, and high-performance digital experiences. We help businesses grow with expert web design, content strategy, and GEO optimization.",
    address: getOrgAddress(),
    sameAs: [
      "https://www.instagram.com/mohanrajkolavi/",
      "https://www.threads.com/@mohanrajkolavi/",
    ],
  };
}
