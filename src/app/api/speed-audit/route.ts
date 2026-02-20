import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { sql } from "@/lib/db";
import * as cheerio from "cheerio";

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 5;
const PAGESPEED_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

function hashIp(ip: string): string {
  return createHash("sha256").update(`speed-audit-rl:${ip}`).digest("hex");
}

async function checkRateLimit(ipHash: string): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_SEC * 1000);

  const updated = await sql`
    INSERT INTO contact_rate_limit (ip_hash, request_count, reset_at)
    VALUES (${ipHash}, 1, ${resetAt})
    ON CONFLICT (ip_hash) DO UPDATE SET
      request_count = CASE
        WHEN contact_rate_limit.reset_at <= ${now}
        THEN 1
        ELSE contact_rate_limit.request_count + 1
      END,
      reset_at = CASE
        WHEN contact_rate_limit.reset_at <= ${now}
        THEN ${resetAt}
        ELSE contact_rate_limit.reset_at
      END
    RETURNING request_count
  `;

  const row = updated[0];
  if (!row) return false;
  const count = Number(row.request_count);
  if (!Number.isFinite(count) || count < 0) return false;
  return count <= RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string | null {
  const vercelIp = request.headers.get("x-vercel-ip");
  if (vercelIp?.trim()) return vercelIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() ?? null;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchHtmlMetaTags(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Always fetch HTTPS first, fallback to HTTP is not recommended for audits anyway
    const secureUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url;

    const response = await fetch(secureUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KolaviAuditBot/1.0',
        'Accept': 'text/html'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').text() || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    
    // Naive schema check: look for any application/ld+json scripts
    const schemaScripts = $('script[type="application/ld+json"]').length > 0;

    return {
      hasHttps: secureUrl.startsWith('https://'), // Technically true if fetch succeeds on https
      title: {
        present: title.length > 0,
        length: title.length
      },
      description: {
        present: description.length > 0,
        length: description.length
      },
      h1: {
        present: h1.trim().length > 0
      },
      ogTags: {
        present: ogTitle.length > 0
      },
      schema: {
        present: schemaScripts
      }
    };
  } catch (error) {
    console.error('Meta tag fetch error:', error);
    // Return null object indicating fetch failure, but don't crash
    return null;
  }
}

async function fetchPageSpeedScores(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";
  const encodedUrl = encodeURIComponent(url);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s max

    const [mobileRes, desktopRes] = await Promise.all([
      fetch(`${PAGESPEED_API}?url=${encodedUrl}&strategy=mobile&category=performance&category=seo&category=best-practices${keyParam}`, { signal: controller.signal }),
      fetch(`${PAGESPEED_API}?url=${encodedUrl}&strategy=desktop&category=performance${keyParam}`, { signal: controller.signal }),
    ]);
    
    clearTimeout(timeoutId);

    if (!mobileRes.ok || !desktopRes.ok) {
      return { error: `PageSpeed API error: ${!mobileRes.ok ? mobileRes.status : desktopRes.status}` };
    }

    const [mobileData, desktopData] = await Promise.all([
      mobileRes.json() as Promise<any>,
      desktopRes.json() as Promise<any>,
    ]);

    if (mobileData?.error?.message || desktopData?.error?.message) {
      return { error: mobileData?.error?.message || desktopData?.error?.message };
    }

    // Extract Mobile data
    const mobilePerformance = mobileData?.lighthouseResult?.categories?.performance?.score;
    const mobileSeo = mobileData?.lighthouseResult?.categories?.seo?.score;
    
    // Core Web Vitals (Mobile)
    const metrics = mobileData?.lighthouseResult?.audits || {};
    const lcp = metrics['largest-contentful-paint']?.displayValue;
    const fid = metrics['max-potential-fid']?.displayValue || metrics['interactive']?.displayValue;
    const cls = metrics['cumulative-layout-shift']?.displayValue;
    const loadTime = metrics['speed-index']?.displayValue;
    const isMobileFriendly = metrics['viewport']?.score === 1;

    // Extract Desktop data
    const desktopPerformance = desktopData?.lighthouseResult?.categories?.performance?.score;

    return {
      mobile: mobilePerformance != null ? Math.round(mobilePerformance * 100) : undefined,
      desktop: desktopPerformance != null ? Math.round(desktopPerformance * 100) : undefined,
      seoScore: mobileSeo != null ? Math.round(mobileSeo * 100) : undefined,
      coreWebVitals: {
        lcp,
        fid,
        cls,
        loadTime,
        isMobileFriendly
      }
    };
  } catch (err) {
    console.error("PageSpeed API error:", err);
    return { error: err instanceof Error ? err.message : "Failed to fetch PageSpeed data" };
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { error: "Server not configured. Please try again later." },
        { status: 503 }
      );
    }

    const ip = getClientIp(request);
    if (!ip) {
      return NextResponse.json({ error: "Unable to identify request source." }, { status: 400 });
    }

    const ipHash = hashIp(ip);
    const allowed = await checkRateLimit(ipHash);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    let body: { url?: string; name?: string; email?: string; phone?: string; spaName?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // New API handles more fields
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "Unknown";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const spaName = typeof body.spaName === "string" ? body.spaName.trim() : "";

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Valid website URL is required" }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Run fetches in parallel for speed
    const [pageSpeedResult, metaTagsResult] = await Promise.all([
      fetchPageSpeedScores(url),
      fetchHtmlMetaTags(url)
    ]);

    // Calculate a naive composite score if we have data
    let compositeScore = 0;
    let scoreCount = 0;

    if (pageSpeedResult.mobile) {
      compositeScore += pageSpeedResult.mobile;
      scoreCount++;
    }
    if (pageSpeedResult.desktop) {
      compositeScore += pageSpeedResult.desktop;
      scoreCount++;
    }
    if (pageSpeedResult.seoScore) {
      compositeScore += pageSpeedResult.seoScore;
      scoreCount++;
    }
    if (metaTagsResult) {
      const metaScore = [
        metaTagsResult.hasHttps,
        metaTagsResult.title.present,
        metaTagsResult.description.present,
        metaTagsResult.h1.present,
        metaTagsResult.schema.present
      ].filter(Boolean).length * 20; // 5 checks * 20 = 100
      
      compositeScore += metaScore;
      scoreCount++;
    }

    const finalScore = scoreCount > 0 ? Math.round(compositeScore / scoreCount) : 0;

    // Store lead
    await sql`
      INSERT INTO leads (name, email, message, source, status)
      VALUES (
        ${name},
        ${email},
        ${`Speed audit for: ${url}\nSpa: ${spaName}\nPhone: ${phone}\nComposite Score: ${finalScore}\nMobile: ${pageSpeedResult.mobile ?? "N/A"}\nDesktop: ${pageSpeedResult.desktop ?? "N/A"}\nSEO: ${pageSpeedResult.seoScore ?? "N/A"}`},
        'speed_audit',
        'new'
      )
    `;

    return NextResponse.json({
      success: true,
      url,
      results: {
        score: finalScore,
        pageSpeed: pageSpeedResult.error ? null : {
          mobile: pageSpeedResult.mobile,
          desktop: pageSpeedResult.desktop,
          seo: pageSpeedResult.seoScore,
          coreWebVitals: pageSpeedResult.coreWebVitals
        },
        meta: metaTagsResult,
        error: pageSpeedResult.error // Pass along if partial failure
      }
    });
  } catch (error) {
    console.error("Speed audit error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
