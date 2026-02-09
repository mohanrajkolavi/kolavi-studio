import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface ArticleSchemaProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  authorUrl?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  url: string;
  wordCount?: number;
}

function fullUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

/** Ensures ISO datetime has timezone for schema.org (e.g. 2026-02-09T17:45:11 → 2026-02-09T17:45:11Z). */
function withTimezone(isoDate: string): string {
  if (!isoDate || typeof isoDate !== "string") return isoDate;
  const trimmed = isoDate.trim();
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(trimmed)) return trimmed;
  return trimmed + "Z";
}

export function getArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  authorName = SITE_NAME,
  authorUrl = SITE_URL,
  image,
  imageWidth = 1200,
  imageHeight = 630,
  url,
  wordCount,
}: ArticleSchemaProps) {
  const imageUrl = image ? fullUrl(image) : `${SITE_URL}/og-image.jpg`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: imageWidth,
      height: imageHeight,
    },
    datePublished: withTimezone(datePublished),
    dateModified: withTimezone(dateModified),
    ...(wordCount != null && { wordCount }),
    author: {
      "@type": authorName === SITE_NAME ? "Organization" : "Person",
      name: authorName,
      url: authorUrl.startsWith("http") ? authorUrl : `${SITE_URL}${authorUrl}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": fullUrl(url),
    },
  };
}
