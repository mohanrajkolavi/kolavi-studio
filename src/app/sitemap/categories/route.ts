import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { getCategoryEntries, buildUrlsetXml } from "@/lib/sitemap-index";

export async function GET() {
  const entries = await getCategoryEntries();
  const xml = buildUrlsetXml(entries, SITE_URL);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
