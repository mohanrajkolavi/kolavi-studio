import { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

function getMetadataBaseUrl(): URL {
  try {
    const u = SITE_URL?.trim();
    if (u && u.startsWith("http")) return new URL(u);
  } catch {
    // invalid URL
  }
  return new URL("https://kolavistudio.com");
}

export function getBaseMetadata(): Metadata {
  return {
    metadataBase: getMetadataBaseUrl(),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
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
  /** OG/Twitter image URL. Set per-page for key landing pages (home, services) for better social previews. */
  image?: string;
  noIndex?: boolean;
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** Override Open Graph description when different from meta description. */
  ogDescription?: string;
  /** Override Twitter card title. */
  twitterTitle?: string;
  /** Override Twitter card description. */
  twitterDescription?: string;
  /** Override Twitter card image. */
  twitterImage?: string;
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
  ogDescription,
  twitterTitle,
  twitterDescription,
  twitterImage,
}: PageMetadataProps): Metadata {
  const base = (SITE_URL ?? "").trim() || "https://kolavistudio.com";
  const withSiteName = (value: string) =>
    value.includes(SITE_NAME) ? value : `${value} | ${SITE_NAME}`;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = image || `${base}/og-image.jpg`;
  const ogDesc = ogDescription ?? description;
  const twTitle = twitterTitle ?? withSiteName(title);
  const twDesc = twitterDescription ?? description;
  const twImage = twitterImage ?? ogImage;

  return {
    title,
    description,
    keywords,
    authors: author ? [{ name: author }] : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: publishedTime ? "article" : "website",
      url,
      title: withSiteName(title),
      description: ogDesc,
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
      title: twTitle,
      description: twDesc,
      images: [twImage],
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
