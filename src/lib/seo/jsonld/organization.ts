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
    description: "Med spa marketing agency specializing in Next.js websites, AI-driven strategies, and multi-treatment SEO. Focused on delivering high-performance digital experiences and GEO optimization for medical practices.",
    address: getOrgAddress(),
    sameAs: [
      "https://www.instagram.com/mohanrajkolavi/",
      "https://www.threads.com/@mohanrajkolavi/",
    ],
  };
}
