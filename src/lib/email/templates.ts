/**
 * Email templates for lead nurture and automation.
 * Connect Resend, SendGrid, or similar - use these as content.
 */

export const NURTURE_EMAILS = [
  {
    day: 0,
    subject: "Your Med Spa Speed Audit Report is Ready",
    body: `Hi,

Your PageSpeed audit for {{url}} is complete. Here's a quick summary:

• Mobile score: {{mobileScore}}
• Desktop score: {{desktopScore}}

[Attach PDF or link to report]

We'd love to walk you through the findings on a 15-minute call. Book here: {{bookingLink}}

Kolavi Studio`,
  },
  {
    day: 2,
    subject: "Why PageSpeed Matters for Patient Acquisition",
    body: `Hi,

Quick follow-up: 53% of mobile visitors leave if your site takes 6+ seconds to load. At 0.8 seconds, you lose less than 5%.

That's the difference between a WordPress site and a Next.js site. We've seen clients improve from 38 to 98 in 14 days.

Want to see your full report? Reply to this email or book a call: {{bookingLink}}

Kolavi Studio`,
  },
  {
    day: 4,
    subject: "71% of Patients Now Use AI Search: Are You There?",
    body: `Hi,

New stat: 71% of patients use ChatGPT or Perplexity when researching med spas. If you're only optimizing for Google, you're invisible to a huge chunk of your market.

GEO (Generative Engine Optimization) is what we do. We make your practice show up when patients ask AI for recommendations.

Curious how? Book a 15-min call: {{bookingLink}}

Kolavi Studio`,
  },
  {
    day: 7,
    subject: "How We Optimize Your Entire Treatment Menu",
    body: `Hi,

Most med spas offer 10-15 treatments but only rank for 1-2. Our AI content pipeline covers all of them simultaneously at one-third the cost of manual writers.

8-12 pieces monthly. Every treatment. Botox, fillers, CoolSculpting, lasers, skin: all at once.

Want to see the full picture? Let's talk: {{bookingLink}}

Kolavi Studio`,
  },
  {
    day: 10,
    subject: "Pricing Transparency: What You Get",
    body: `Hi,

No surprises. Our tiers:

• Starter $1,499/mo: 5 treatments, 4 posts/month
• Growth $2,499/mo: Full menu, 8 posts/month (most popular)
• Scale $3,999/mo: Multi-location, 12+ posts/month

Each includes Next.js website, 95-100 PageSpeed guarantee, and GEO optimization.

Questions? Book a call: {{bookingLink}}

Kolavi Studio`,
  },
  {
    day: 14,
    subject: "Before & After: Multi-Treatment Results",
    body: `Hi,

One of our clients went from ranking for 2 treatments to 8 in 90 days. 240% traffic increase.

Another: zero visibility to 14 first-page rankings in 60 days. Fully booked by month 4.

These are projected benchmarks; real results vary. But the pattern is clear: comprehensive coverage wins.

Ready to start? {{bookingLink}}

Kolavi Studio`,
  },
  {
    day: 21,
    subject: "Launch Pricing: Limited Spots",
    body: `Hi,

We're offering launch pricing to our first 5 clients. After that, full pricing kicks in.

If you've been thinking about it, now's the time. Book a strategy call: {{bookingLink}}

No pressure. Just want to make sure you have the option.

Kolavi Studio`,
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
  options?: { escapeHtml?: boolean }
): string {
  const doEscape = options?.escapeHtml ?? false;
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const replacement = doEscape ? escapeHtml(value) : value;
    out = out.replace(new RegExp(`{{${escapedKey}}}`, "g"), replacement);
  }
  return out;
}
