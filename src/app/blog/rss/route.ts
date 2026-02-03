import { getPosts } from "@/lib/blog-data";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

const RSS_SPEC_URL = "https://www.rssboard.org/rss-specification";
const CHANNEL_IMAGE_URL = `${SITE_URL}/logo.png`;
const CHANNEL_IMAGE_TITLE = `${SITE_NAME} Blog`;
const TTL_MINUTES = 60;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getPosts();
  const lastBuild =
    posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Digital marketing insights, SEO strategies, and business growth resources.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss" rel="self" type="application/rss+xml"/>
    <docs>${RSS_SPEC_URL}</docs>
    <generator>${escapeXml(SITE_NAME)}</generator>
    <ttl>${TTL_MINUTES}</ttl>
    <image>
      <url>${CHANNEL_IMAGE_URL}</url>
      <title>${escapeXml(CHANNEL_IMAGE_TITLE)}</title>
      <link>${SITE_URL}/blog</link>
    </image>
    ${posts
      .map(
        (post) => {
          const authorName = post.author?.node?.name;
          const categories = post.categories?.nodes ?? [];
          const authorEl = authorName ? `\n      <dc:creator>${escapeXml(authorName)}</dc:creator>` : "";
          const categoryEls = categories.length
            ? "\n      " + categories.map((c) => `<category>${escapeXml(c.name)}</category>`).join("\n      ")
            : "";
          return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${encodeURIComponent(post.slug)}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${encodeURIComponent(post.slug)}</guid>
      <description>${escapeXml(stripHtml(post.excerpt || "").slice(0, 300))}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>${authorEl}${categoryEls}
    </item>`;
        }
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
