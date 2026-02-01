export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL || "";

export const SITE_NAME = "Kolavi Studio";
export const SITE_DESCRIPTION = "Kolavi Studio helps businesses grow with expert digital marketing, web design, and SEO services. Specializing in medical spas, dental practices, and law firms.";

export const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Medical Spas", href: "/medical-spas" },
  { name: "Services", href: "/services" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

// Future verticals - not yet implemented
export const FUTURE_VERTICALS = ["dental", "law-firms"];
