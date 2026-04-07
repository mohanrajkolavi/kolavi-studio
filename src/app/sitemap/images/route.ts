import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { getImageEntries, escapeXml } from "@/lib/sitemap";

export const revalidate = 3600;

/**
 * Image sitemap: helps search engines and AI crawlers discover blog post images.
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot) cannot execute JavaScript,
 * so image sitemaps are critical for image discoverability.
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */
export async function GET() {
  const entries = await getImageEntries();
  const IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1";
  const NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${NS}" xmlns:image="${IMAGE_NS}">`,
    ...entries.map((e) => {
      const loc = `${SITE_URL}${e.path}`;
      const imageTags = e.images
        .map(
          (img) =>
            `    <image:image><image:loc>${escapeXml(img.url)}</image:loc>${img.alt ? `<image:title>${escapeXml(img.alt)}</image:title>` : ""}</image:image>`
        )
        .join("\n");
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${imageTags}\n  </url>`;
    }),
    "</urlset>",
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
