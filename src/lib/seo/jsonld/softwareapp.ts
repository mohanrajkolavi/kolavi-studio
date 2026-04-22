interface SoftwareAppSchemaProps {
  name: string;
  description: string;
  operatingSystem: string;
  applicationCategory: string;
  url?: string;
  offers?: { price: string; currency: string };
  author?: { name: string; url?: string };
}

export function getSoftwareApplicationSchema({
  name,
  description,
  operatingSystem,
  applicationCategory,
  url,
  offers,
  author,
}: SoftwareAppSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    operatingSystem,
    applicationCategory,
    ...(url && { url }),
    ...(offers && {
      offers: {
        "@type": "Offer",
        price: offers.price,
        priceCurrency: offers.currency,
      },
    }),
    ...(author && {
      author: {
        "@type": "Organization",
        name: author.name,
        ...(author.url && { url: author.url }),
      },
    }),
  };
}
