import type { WPPost } from "@/lib/graphql/types";

export const SAMPLE_POSTS: WPPost[] = [
  {
    id: "sample-1",
    slug: "introducing-next-level-seo-for-medical-spas",
    title: "Introducing the next level of SEO for medical spas",
    author: { node: { name: "Kolavi Studio", slug: "kolavi-studio", url: "https://kolavistudio.com" } },
    content: `
      <p>Medical spas face unique challenges when it comes to digital marketing. Unlike traditional retail or service businesses, med spas must balance compliance, trust-building, and conversion optimization.</p>
      
      <h2>Why SEO matters for medical spas</h2>
      <p>Search engine optimization is critical for medical spas looking to attract high-intent clients. When someone searches for "Botox near me" or "medical spa in [city]," they're often ready to book. Capturing these searches requires a strategic approach.</p>
      
      <h2>Key strategies for med spa SEO</h2>
      <ul>
        <li><strong>Local SEO:</strong> Optimize for "near me" and city-specific searches with a complete Google Business Profile.</li>
        <li><strong>Service pages:</strong> Create dedicated pages for each treatment with detailed, helpful content.</li>
        <li><strong>Reviews and reputation:</strong> Encourage satisfied clients to leave reviews—they influence both rankings and conversions.</li>
        <li><strong>Mobile-first design:</strong> Most med spa searches happen on mobile; ensure your site loads fast and looks great on phones.</li>
      </ul>
      
      <h2>Getting started</h2>
      <p>If you're ready to take your medical spa's online presence to the next level, start with an SEO audit. Identify your top opportunities, fix technical issues, and create a content plan that addresses your ideal client's questions.</p>
      
      <p>At Kolavi Studio, we specialize in helping medical spas grow through strategic digital marketing. <a href="/contact">Get in touch</a> to learn how we can help.</p>
    `,
    excerpt: "<p>Discover how strategic SEO can help medical spas attract more high-intent clients and grow their business. Learn the key strategies that drive real results.</p>",
    date: "2024-03-12T10:00:00Z",
    modified: "2024-03-12T10:00:00Z",
    featuredImage: {
      node: {
        sourceUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
        altText: "Modern medical spa interior",
      },
    },
    categories: { nodes: [{ slug: "seo", name: "SEO" }] },
    tags: { nodes: [{ slug: "medical-spa", name: "Medical Spa" }] },
  },
  {
    id: "sample-2",
    slug: "how-to-optimize-your-website-for-conversions",
    title: "How to optimize your website for conversions",
    excerpt: "<p>Your website is your 24/7 salesperson. Learn how to structure your pages, craft compelling CTAs, and remove friction so more visitors become clients.</p>",
    content: `
      <p>A beautiful website means nothing if it doesn't convert visitors into clients. Conversion rate optimization (CRO) is the practice of improving your site's ability to turn traffic into leads and customers.</p>
      
      <h2>Elements of a high-converting website</h2>
      <p>Clear value proposition, trust signals, easy navigation, and strategic calls-to-action are the foundation. We'll walk through each element and show you how to implement them.</p>
      
      <h2>Testing and iteration</h2>
      <p>Optimization is never "done." Use analytics to identify drop-off points, run A/B tests on key pages, and continuously improve based on data.</p>
    `,
    date: "2024-03-12T09:00:00Z",
    modified: "2024-03-12T09:00:00Z",
    featuredImage: {
      node: {
        sourceUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        altText: "Analytics and conversion optimization",
      },
    },
    categories: { nodes: [{ slug: "guides", name: "Guides" }] },
    tags: { nodes: [{ slug: "conversions", name: "Conversions" }] },
  },
  {
    id: "sample-3",
    slug: "building-trust-with-social-proof-for-service-businesses",
    title: "Building trust with social proof for service businesses",
    excerpt: "<p>Testimonials, reviews, and case studies build credibility. Here's how to collect and showcase social proof that turns skeptical visitors into confident clients.</p>",
    content: `
      <p>When someone is considering a medical spa, dental practice, or professional service, trust is everything. Social proof—reviews, testimonials, before-and-after photos—helps bridge the gap between stranger and client.</p>
      
      <h2>Types of social proof</h2>
      <p>Google reviews, testimonials on your site, case studies with specific results, and before-and-after galleries each serve a purpose. We'll help you prioritize based on your industry.</p>
    `,
    date: "2024-03-10T14:00:00Z",
    modified: "2024-03-10T14:00:00Z",
    featuredImage: {
      node: {
        sourceUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
        altText: "Customer reviews and testimonials",
      },
    },
    categories: { nodes: [{ slug: "marketing", name: "Marketing" }] },
    tags: { nodes: [{ slug: "trust", name: "Trust" }] },
  },
  {
    id: "sample-4",
    slug: "getting-started-with-local-seo",
    title: "Getting started with local SEO",
    excerpt: "<p>Local SEO helps businesses appear in \"near me\" searches and local pack results. Learn the basics of Google Business Profile, citations, and local content.</p>",
    content: `<p>Local SEO is essential for businesses that serve a geographic area. This guide covers the fundamentals.</p>`,
    date: "2024-03-13T11:00:00Z",
    modified: "2024-03-13T11:00:00Z",
    featuredImage: {
      node: {
        sourceUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80",
        altText: "Map and location",
      },
    },
    categories: { nodes: [{ slug: "seo", name: "SEO" }] },
    tags: { nodes: [] },
  },
  {
    id: "sample-5",
    slug: "content-marketing-strategies-that-drive-results",
    title: "Content marketing strategies that drive results",
    excerpt: "<p>Quality content attracts, educates, and converts. Explore content types that work for service businesses and how to plan a sustainable content strategy.</p>",
    content: `<p>Content marketing builds long-term organic traffic and authority. Learn how to create content that resonates.</p>`,
    date: "2024-03-13T10:00:00Z",
    modified: "2024-03-13T10:00:00Z",
    featuredImage: {
      node: {
        sourceUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
        altText: "Content marketing",
      },
    },
    categories: { nodes: [{ slug: "marketing", name: "Marketing" }] },
    tags: { nodes: [] },
  },
  {
    id: "sample-6",
    slug: "why-mobile-first-design-matters",
    title: "Why mobile-first design matters for your business",
    excerpt: "<p>Most of your prospects are searching on their phones. A mobile-first website isn't optional—it's essential for rankings and conversions.</p>",
    content: `<p>Mobile-first design ensures your site performs well on the devices your audience actually uses. We'll cover the why and how.</p>`,
    date: "2024-03-13T09:00:00Z",
    modified: "2024-03-13T09:00:00Z",
    featuredImage: {
      node: {
        sourceUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
        altText: "Mobile phone",
      },
    },
    categories: { nodes: [{ slug: "guides", name: "Guides" }] },
    tags: { nodes: [] },
  },
];

export function getSamplePostBySlug(slug: string): WPPost | null {
  return SAMPLE_POSTS.find((p) => p.slug === slug) ?? null;
}
