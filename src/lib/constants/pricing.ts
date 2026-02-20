/**
 * Kolavi Studio — Single source of truth for pricing, tiers, features,
 * competitors, one-time projects, add-ons, and discounts.
 * Used by homepage PricingTiers and /pricing page.
 */

export type TierId = "visibility" | "growth" | "dominance";

/** Annual pay discount (10% off total). Used for yearly billing display. */
export const ANNUAL_DISCOUNT = 0.1;

/** Effective monthly amount when paid annually (10% off). */
export function getYearlyMonthlyEquivalent(monthlyRetainer: number): number {
  return Math.round(monthlyRetainer * (1 - ANNUAL_DISCOUNT));
}

export interface TierSummary {
  id: TierId;
  name: string;
  setupFee: number;
  monthlyRetainer: number;
  bestFor: string;
  /** 3–4 bullet deliverables for cards */
  deliverables: string[];
  /** Optional badge e.g. "Most Popular" */
  badge?: string | null;
}

export const TIER_SUMMARIES: TierSummary[] = [
  {
    id: "visibility",
    name: "Visibility",
    setupFee: 2599,
    monthlyRetainer: 1299,
    bestFor: "New or small single-location med spas",
    deliverables: [
      "Custom Next.js website + ADA/HIPAA",
      "GEO / AI search optimization",
      "6 blog posts/mo, reputation + dashboard",
      "Basic lead gen funnel + automation",
    ],
    badge: null,
  },
  {
    id: "growth",
    name: "Growth",
    setupFee: 3599,
    monthlyRetainer: 1699,
    bestFor: "Established spas ready to dominate their city",
    deliverables: [
      "Everything in Visibility",
      "Programmatic SEO (location + treatment)",
      "16 blog posts/mo, Google Ads up to $5K",
      "AI Chatbot, full automation, CRO",
    ],
    badge: "Most Popular",
  },
  {
    id: "dominance",
    name: "Dominance",
    setupFee: 5599,
    monthlyRetainer: 2499,
    bestFor: "Multi-location, $2M+ revenue, PE-backed groups",
    deliverables: [
      "Everything in Growth",
      "50–200+ programmatic pages, 30 posts/mo",
      "Meta Ads, video editing, micro-influencer",
      "Dedicated manager, 60-min monthly + 90-min quarterly",
    ],
    badge: null,
  },
];

export interface AccountDetails {
  manager: string;
  responseTime: string;
  monthlyCall: string | null;
  quarterlyStrategy: string | null;
  adHocRequests: string;
  founderAccess?: boolean;
}

export const TIER_ACCOUNT_DETAILS: Record<TierId, AccountDetails> = {
  visibility: {
    manager: "Shared (1:5)",
    responseTime: "48 hrs via email",
    monthlyCall: null,
    quarterlyStrategy: null,
    adHocRequests: "2/mo",
  },
  growth: {
    manager: "Shared (1:3)",
    responseTime: "24 hrs via email + Slack/WhatsApp",
    monthlyCall: "30 min",
    quarterlyStrategy: null,
    adHocRequests: "5/mo",
  },
  dominance: {
    manager: "Dedicated (1:1)",
    responseTime: "4 hrs via email + Slack/WhatsApp + phone",
    monthlyCall: "60 min",
    quarterlyStrategy: "90 min",
    adHocRequests: "Unlimited",
    founderAccess: true,
  },
};

export interface TierServiceGroup {
  title: string;
  services: { service: string; details: string }[];
}

export interface TierFullDetail {
  id: TierId;
  notIncluded: string[];
}

export const TIER_SERVICE_GROUPS: Record<TierId, TierServiceGroup[]> = {
  visibility: [
    {
      title: "Website & Technical Foundation",
      services: [
        { service: "Custom Website (Next.js + Headless CMS)", details: "High-performance, SEO-ready, mobile-optimized" },
        { service: "ADA + HIPAA Compliant Setup", details: "Legal compliance built in from day one" },
      ],
    },
    {
      title: "Search & Local Visibility",
      services: [
        { service: "Google Business Profile Optimization", details: "Full setup + ongoing optimization" },
        { service: "Local SEO & Citation Building", details: "NAP consistency across 50+ directories" },
        { service: "On-Page SEO", details: "Up to 8 pages/mo" },
        { service: "Technical SEO", details: "Site speed, crawlability, schema, Core Web Vitals" },
        { service: "Off-Page SEO & Link Building", details: "Monthly DR-relevant backlinks" },
        { service: "GEO: AI Search Optimization", details: "Visibility on ChatGPT, Perplexity, Google AI Overviews" },
        { service: "RealSelf Profile Optimization", details: "Med spa-specific platform most agencies ignore" },
      ],
    },
    {
      title: "Content",
      services: [
        { service: "Blog Posts", details: "6 posts/mo (AI-assisted, human-edited, SEO-optimized)" },
      ],
    },
    {
      title: "Lead Generation & Automation",
      services: [
        { service: "Basic Lead Gen Funnel", details: "Landing page + form + confirmation page" },
        { service: "Basic Marketing Automation", details: "Booking confirmations + appointment reminders" },
        { service: "Basic Email Marketing", details: "1 campaign/mo" },
      ],
    },
    {
      title: "Reputation & Reporting",
      services: [
        { service: "Reputation Management", details: "Review monitoring + professional responses" },
        { service: "Review Generation Strategy", details: "Automated post-visit review request prompts" },
        { service: "Call Tracking & Recording", details: "Track which campaigns drive inbound calls" },
        { service: "Real-Time Reporting Dashboard", details: "Live view of SEO, GBP, leads, calls" },
        { service: "Monthly Performance Report", details: "Summary report with key metrics" },
      ],
    },
    {
      title: "Account Management",
      services: [
        { service: "Shared Account Manager (1:5)", details: "Email support, 48-hr response, 2 ad-hoc requests/mo" },
      ],
    },
  ],
  growth: [
    {
      title: "Website & Technical Foundation",
      services: [
        { service: "Custom Website (Next.js + Headless CMS)", details: "High-performance, SEO-ready, mobile-optimized" },
        { service: "ADA + HIPAA Compliant Setup", details: "Legal compliance built in from day one" },
      ],
    },
    {
      title: "Search & Local Visibility",
      services: [
        { service: "Google Business Profile Optimization", details: "Full setup + ongoing optimization" },
        { service: "Local SEO & Citation Building", details: "NAP consistency across 50+ directories" },
        { service: "On-Page SEO", details: "Unlimited pages/mo" },
        { service: "Technical SEO", details: "Site speed, crawlability, schema, Core Web Vitals" },
        { service: "Off-Page SEO & Link Building", details: "Monthly DR-relevant backlinks" },
        { service: "Programmatic SEO", details: "Location + treatment pages (city + service combinations)" },
        { service: "GEO: AI Search Optimization", details: "Visibility on ChatGPT, Perplexity, Google AI Overviews" },
        { service: "RealSelf Profile Optimization", details: "Med spa-specific platform most agencies ignore" },
      ],
    },
    {
      title: "Content",
      services: [
        { service: "Blog Posts", details: "16 posts/mo (AI-assisted, human-edited, SEO-optimized)" },
      ],
    },
    {
      title: "Paid Advertising",
      services: [
        { service: "Google Ads Management", details: "Up to $5K ad spend managed" },
      ],
    },
    {
      title: "Lead Generation & Automation",
      services: [
        { service: "Custom AI Chatbot", details: "24/7 lead capture, FAQ handling, booking assist" },
        { service: "Full Lead Gen Funnel", details: "Landing page + CRM integration + follow-up sequence" },
        { service: "Full Marketing Automation", details: "Confirmations, reminders, re-engagement, review requests" },
        { service: "GLP-1 Marketing Funnel", details: "Dedicated landing page + email sequence for weight loss services" },
        { service: "Post-Consultation Email Nurture", details: "5-step sequence to convert consultations into bookings" },
        { service: "Email Marketing", details: "2 campaigns/mo" },
      ],
    },
    {
      title: "Conversion & Optimization",
      services: [
        { service: "CRO Audit + A/B Testing", details: "Ongoing page + booking flow optimization" },
      ],
    },
    {
      title: "Reputation & Reporting",
      services: [
        { service: "Reputation Management", details: "Review monitoring + professional responses" },
        { service: "Review Generation Strategy", details: "Automated post-visit review request prompts" },
        { service: "Call Tracking & Recording", details: "Track which campaigns drive inbound calls" },
        { service: "Real-Time Reporting Dashboard", details: "Live view of all channels" },
        { service: "Monthly Performance Report", details: "Full metrics summary" },
      ],
    },
    {
      title: "Account Management",
      services: [
        { service: "Shared Account Manager (1:3)", details: "Email + Slack/WhatsApp, 24-hr response, 5 ad-hoc requests/mo, 30-min monthly call" },
      ],
    },
  ],
  dominance: [
    {
      title: "Website & Technical Foundation",
      services: [
        { service: "Custom Website (Next.js + Headless CMS)", details: "High-performance, SEO-ready, mobile-optimized" },
        { service: "ADA + HIPAA Compliant Setup", details: "Legal compliance built in from day one" },
      ],
    },
    {
      title: "Search & Local Visibility",
      services: [
        { service: "Google Business Profile Optimization", details: "Full setup + ongoing optimization" },
        { service: "Local SEO & Citation Building", details: "NAP consistency across 50+ directories" },
        { service: "On-Page SEO", details: "Unlimited pages/mo" },
        { service: "Technical SEO", details: "Site speed, crawlability, schema, Core Web Vitals" },
        { service: "Off-Page SEO & Link Building", details: "Monthly DR-relevant backlinks" },
        { service: "Programmatic SEO at Scale", details: "50–200+ location + treatment pages" },
        { service: "GEO: AI Search Optimization", details: "Visibility on ChatGPT, Perplexity, Google AI Overviews" },
        { service: "RealSelf Profile Optimization", details: "Med spa-specific platform most agencies ignore" },
      ],
    },
    {
      title: "Content",
      services: [
        { service: "Blog Posts", details: "Up to 30 posts/mo (AI-assisted, human-edited, SEO-optimized)" },
        { service: "Video Content Editing", details: "4 videos/mo for Instagram Reels, TikTok, YouTube Shorts" },
      ],
    },
    {
      title: "Paid Advertising",
      services: [
        { service: "Google Ads Management", details: "Up to $10K ad spend managed" },
        { service: "Meta Ads Management", details: "Facebook + Instagram campaigns" },
      ],
    },
    {
      title: "Lead Generation & Automation",
      services: [
        { service: "Custom AI Chatbot", details: "Free ($999 value). 24/7 lead capture, FAQ, booking" },
        { service: "Full Lead Gen Funnel", details: "Landing page + CRM integration + follow-up sequence" },
        { service: "Full Marketing Automation", details: "Confirmations, reminders, re-engagement, review requests" },
        { service: "Membership Upsell Automation", details: "Auto-promote membership plans to repeat clients" },
        { service: "GLP-1 Marketing Funnel", details: "Landing page + ads + full email sequence" },
        { service: "Post-Consultation Email Nurture", details: "5-step sequence to convert consultations into bookings" },
        { service: "Email Marketing", details: "4 campaigns/mo" },
        { service: "Virtual Consultation Setup", details: "Landing page + booking flow + pre-consult intake" },
      ],
    },
    {
      title: "Conversion & Optimization",
      services: [
        { service: "CRO Audit + A/B Testing", details: "Ongoing page + booking flow optimization" },
        { service: "Micro-Influencer Matching", details: "Local influencer outreach + campaign coordination" },
      ],
    },
    {
      title: "Reputation & Reporting",
      services: [
        { service: "Reputation Management", details: "Review monitoring + professional responses" },
        { service: "Review Generation Strategy", details: "Automated post-visit review request prompts" },
        { service: "Call Tracking & Recording", details: "Track which campaigns drive inbound calls" },
        { service: "Real-Time Reporting Dashboard", details: "Live view of all channels" },
        { service: "Monthly Performance Report", details: "Full metrics summary with live call walkthrough" },
      ],
    },
    {
      title: "Account Management",
      services: [
        { service: "Dedicated Account Manager (1:1)", details: "Email + Slack/WhatsApp + Phone, 4-hr response, unlimited requests, 60-min monthly call, 90-min quarterly strategy session, direct founder access" },
      ],
    },
  ],
};

export const TIER_NOT_INCLUDED: Record<TierId, string[]> = {
  visibility: [
    "Programmatic SEO",
    "Google Ads",
    "Meta Ads",
    "AI Chatbot",
    "Full Marketing Automation",
    "GLP-1 Funnel",
    "CRO Audit",
    "Video Editing",
    "Micro-Influencer Matching",
    "Virtual Consultation Setup",
    "Strategy Call",
    "Dedicated Manager",
  ],
  growth: [
    "Meta Ads",
    "Membership Upsell Automation",
    "Video Editing",
    "Micro-Influencer Matching",
    "Virtual Consultation Setup",
    "Quarterly Strategy Session",
    "Dedicated Manager",
  ],
  dominance: [],
};

/** Full feature comparison: feature label -> [T1, T2, T3] cell values */
export type FeatureCell = string | boolean | number;
export const FEATURE_COMPARISON_ROWS: { feature: string; visibility: FeatureCell; growth: FeatureCell; dominance: FeatureCell }[] = [
  { feature: "Pricing", visibility: "$2,599 setup + $1,299/mo", growth: "$3,599 setup + $1,699/mo", dominance: "$5,599 setup + $2,499/mo" },
  { feature: "Custom Website (Next.js)", visibility: true, growth: true, dominance: true },
  { feature: "ADA + HIPAA Compliance", visibility: true, growth: true, dominance: true },
  { feature: "Google Business Profile", visibility: true, growth: true, dominance: true },
  { feature: "Local SEO & Citations", visibility: true, growth: true, dominance: true },
  { feature: "On-Page SEO", visibility: "8 pages/mo", growth: "Unlimited", dominance: "Unlimited" },
  { feature: "Technical SEO", visibility: true, growth: true, dominance: true },
  { feature: "Off-Page SEO & Links", visibility: true, growth: true, dominance: true },
  { feature: "GEO / AI Search", visibility: true, growth: true, dominance: true },
  { feature: "RealSelf Profile", visibility: true, growth: true, dominance: true },
  { feature: "Programmatic SEO", visibility: false, growth: "location + treatment", dominance: "50–200+ pages" },
  { feature: "Blog Posts/mo", visibility: 6, growth: 16, dominance: 30 },
  { feature: "Video Content Editing", visibility: false, growth: false, dominance: "4 videos/mo" },
  { feature: "Google Ads", visibility: false, growth: "up to $5K spend", dominance: "up to $10K spend" },
  { feature: "Meta Ads", visibility: false, growth: false, dominance: true },
  { feature: "AI Chatbot", visibility: false, growth: true, dominance: "Free" },
  { feature: "Basic Lead Gen Funnel", visibility: true, growth: "Full", dominance: "Full" },
  { feature: "Marketing Automation", visibility: "Basic", growth: "Full", dominance: "Full + Membership" },
  { feature: "GLP-1 Funnel", visibility: false, growth: true, dominance: true },
  { feature: "Post-Consult Email Nurture", visibility: false, growth: true, dominance: true },
  { feature: "Email Marketing", visibility: "1 campaign/mo", growth: "2 campaigns/mo", dominance: "4 campaigns/mo" },
  { feature: "CRO Audit + A/B Testing", visibility: false, growth: true, dominance: true },
  { feature: "Micro-Influencer Matching", visibility: false, growth: false, dominance: true },
  { feature: "Virtual Consultation Setup", visibility: false, growth: false, dominance: true },
  { feature: "Reputation Management", visibility: true, growth: true, dominance: true },
  { feature: "Review Generation", visibility: true, growth: true, dominance: true },
  { feature: "Call Tracking", visibility: true, growth: true, dominance: true },
  { feature: "Real-Time Dashboard", visibility: true, growth: true, dominance: true },
  { feature: "Monthly Report", visibility: true, growth: true, dominance: "Live walkthrough" },
  { feature: "Account Manager", visibility: "Shared 1:5", growth: "Shared 1:3", dominance: "Dedicated 1:1" },
  { feature: "Response Time", visibility: "48 hrs email", growth: "24 hrs email + Slack", dominance: "4 hrs email + Slack + phone" },
  { feature: "Monthly Strategy Call", visibility: false, growth: "30 min", dominance: "60 min" },
  { feature: "Quarterly Strategy Session", visibility: false, growth: false, dominance: "90 min" },
  { feature: "Ad-hoc Support Requests", visibility: "2/mo", growth: "5/mo", dominance: "Unlimited" },
  { feature: "Founder Access", visibility: false, growth: false, dominance: true },
];

/** Competitor comparison */
export const COMPETITOR_COMPARISON_ROWS: { feature: string; patientGain: string; growth99: string; sagapixel: string; kolaviT1: string; kolaviT2: string; kolaviT3: string }[] = [
  { feature: "Monthly Price", patientGain: "$1,399–$1,999", growth99: "$2,500–$5,000", sagapixel: "$2,500–$5,000", kolaviT1: "$1,299", kolaviT2: "$1,699", kolaviT3: "$2,499" },
  { feature: "Setup Fee", patientGain: "None", growth99: "None", sagapixel: "None", kolaviT1: "$2,599", kolaviT2: "$3,599", kolaviT3: "$5,599" },
  { feature: "Custom Next.js Website", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "Yes", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "GEO / AI Search", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "Yes", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "Programmatic SEO", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "No", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "Blog Posts/mo", patientGain: "2", growth99: "2–4", sagapixel: "2–4", kolaviT1: "6", kolaviT2: "16", kolaviT3: "30" },
  { feature: "AI Chatbot", patientGain: "$250/mo extra", growth99: "Yes", sagapixel: "No", kolaviT1: "No", kolaviT2: "Yes", kolaviT3: "Yes Free" },
  { feature: "GLP-1 Funnel", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "No", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "Video Content", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "No", kolaviT2: "No", kolaviT3: "Yes" },
  { feature: "Micro-Influencer", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "No", kolaviT2: "No", kolaviT3: "Yes" },
  { feature: "RealSelf Optimization", patientGain: "No", growth99: "No", sagapixel: "No", kolaviT1: "Yes", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "Real-Time Dashboard", patientGain: "No", growth99: "Yes", sagapixel: "No", kolaviT1: "Yes", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "Call Tracking", patientGain: "No", growth99: "Yes", sagapixel: "No", kolaviT1: "Yes", kolaviT2: "Yes", kolaviT3: "Yes" },
  { feature: "ADA + HIPAA", patientGain: "Yes", growth99: "Yes", sagapixel: "No", kolaviT1: "Yes", kolaviT2: "Yes", kolaviT3: "Yes" },
];

export interface OneTimeProject {
  name: string;
  price: string;
  whoBuys: string;
}

export const ONE_TIME_PROJECTS: OneTimeProject[] = [
  { name: "SEO Audit + Roadmap", price: "Free", whoBuys: "Cold prospects (sales conversion tool)" },
  { name: "Custom AI Chatbot", price: "$999", whoBuys: "Tier 1 clients who want it now" },
  { name: "GLP-1 Launch Package", price: "$2,499–$3,999", whoBuys: "Tier 1 clients adding weight loss services" },
  { name: "Full Marketing Automation Build", price: "$2,499–$4,999", whoBuys: "Tier 1 clients upgrading automation only" },
  { name: "Full Lead Gen Funnel Build", price: "$1,499–$2,999", whoBuys: "Tier 1 clients upgrading funnel only" },
  { name: "CRO Sprint (30-day intensive)", price: "$1,499–$2,499", whoBuys: "Tier 1 + Tier 2 clients" },
  { name: "Virtual Consultation Setup", price: "$499", whoBuys: "Tier 1 + Tier 2 clients" },
];

export interface MonthlyAddOn {
  name: string;
  price: string;
  availableFor: string;
}

export const MONTHLY_ADDONS: MonthlyAddOn[] = [
  { name: "Extra Blog Posts", price: "$199/post", availableFor: "All tiers" },
  { name: "Meta Ads Management", price: "$699/mo + ad spend", availableFor: "Tier 1 + Tier 2" },
  { name: "Google Ads (standalone)", price: "$599/mo + ad spend", availableFor: "Tier 1 only" },
  { name: "SMS Marketing Campaigns", price: "$299/mo", availableFor: "All tiers" },
  { name: "Social Media Content Calendar (8 posts/mo)", price: "$499/mo", availableFor: "All tiers" },
  { name: "Video Content Editing (4 videos/mo)", price: "$599/mo", availableFor: "Tier 1 + Tier 2" },
  { name: "Micro-Influencer Matching", price: "$399/mo", availableFor: "Tier 1 + Tier 2" },
  { name: "Competitor Analysis Report", price: "$249/mo", availableFor: "All tiers" },
  { name: "Additional Location", price: "60% of base retainer", availableFor: "All tiers" },
  { name: "Extra Landing Page", price: "$299/page", availableFor: "All tiers" },
  { name: "Email Marketing Extra Campaign", price: "$199/campaign", availableFor: "All tiers" },
];

export interface Discount {
  name: string;
  amount: string;
  notes: string;
}

export const DISCOUNTS: Discount[] = [
  { name: "Annual Pay", amount: "10% off total", notes: "Any tier, paid upfront" },
  { name: "Multi-location", amount: "60% of base retainer", notes: "Per additional location" },
  { name: "2+ Add-Ons Bundle", amount: "Cheapest add-on at 50% off", notes: "Applied automatically" },
];

export const VALUE_ARGUMENT =
  "PatientGain charges $1,399–$1,999/month for a templated website and 2 blog posts. Growth99 and Sagapixel charge $2,500–$5,000/month for largely the same stack. Kolavi's Tier 1 at $1,299/month delivers a custom Next.js website, GEO optimization, 6 blogs, reputation management, call tracking, RealSelf optimization, a basic funnel, basic automation, real-time dashboard, and a shared account manager. That's 3–4x the deliverables at a lower monthly price than every competitor. The setup fee covers your Month 1 onboarding cost entirely. After that, margins are clean and sustainable.";

export const VALUE_HOOK_SENTENCE =
  "3–4x the deliverables at a lower monthly price than PatientGain, Growth99, and Sagapixel.";
