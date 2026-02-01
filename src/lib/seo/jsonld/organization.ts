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
      addressCountry: "US",
    },
    sameAs: [
      // Add social media URLs here when available
    ],
  };
}
