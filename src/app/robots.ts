import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/partner/login",
        "/partner/forgot-password",
        "/partner/set-password",
        "/partner/dashboard",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
