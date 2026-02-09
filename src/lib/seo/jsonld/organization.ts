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
    description: "Digital marketing agency specializing in medical spas, dental practices, and law firms.",
    address: getOrgAddress(),
    sameAs: [
      // Add social media URLs here when available
    ],
  };
}
