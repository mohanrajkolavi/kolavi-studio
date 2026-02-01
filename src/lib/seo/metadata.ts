import { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

interface PageMetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function getPageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  keywords,
  author,
  publishedTime,
  modifiedTime,
}: PageMetadataProps): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/og-image.jpg`;

  return {
    title,
    description,
    keywords,
    authors: author ? [{ name: author }] : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      publishedTime,
      modifiedTime,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
