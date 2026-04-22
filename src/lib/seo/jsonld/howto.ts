import { SITE_URL } from "@/lib/constants";

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  /** ISO 8601 duration, e.g. "PT5M" for 5 minutes. */
  totalTime?: string;
  estimatedCost?: { currency: string; value: string };
  supply?: string[];
  tool?: string[];
  image?: string;
}

function fullUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

export function getHowToSchema({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
  supply,
  tool,
  image,
}: HowToSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime && { totalTime }),
    ...(estimatedCost && {
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: estimatedCost.currency,
        value: estimatedCost.value,
      },
    }),
    ...(supply && {
      supply: supply.map((s) => ({ "@type": "HowToSupply", name: s })),
    }),
    ...(tool && {
      tool: tool.map((t) => ({ "@type": "HowToTool", name: t })),
    }),
    ...(image && { image: fullUrl(image) }),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url && { url: fullUrl(s.url) }),
      ...(s.image && { image: fullUrl(s.image) }),
    })),
  };
}
