import { SITE_NAME, SITE_URL } from "@/lib/constants";

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Digital marketing agency specializing in medical spas, dental practices, and law firms.",
    address: {
      "@type": "PostalAddress",
      streetAddress: process.env.NEXT_PUBLIC_ORG_STREET_ADDRESS ?? "",
      addressLocality: process.env.NEXT_PUBLIC_ORG_ADDRESS_LOCALITY ?? "",
      postalCode: process.env.NEXT_PUBLIC_ORG_POSTAL_CODE ?? "",
      addressCountry: "US",
    },
    sameAs: [
      // Add social media URLs here when available
    ],
  };
}
