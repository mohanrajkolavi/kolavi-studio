export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL || "";

export const SITE_NAME = "Kolavi Studio";
export const SITE_DESCRIPTION = "Kolavi Studio helps businesses grow with expert digital marketing, web design, and SEO services. Specializing in medical spas, dental practices, and law firms.";

export const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Who We Serve", href: "/industries" },
  { name: "Services", href: "/services" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

// Vertical landing pages - industries we specialize in
export const VERTICAL_LINKS = [
  { name: "Medical Spas", href: "/medical-spas", available: true },
  { name: "Dental Practices", href: "/dental", available: false },
  { name: "Law Firms", href: "/law-firms", available: false },
];
