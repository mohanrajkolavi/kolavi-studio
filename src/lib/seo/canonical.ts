import { SITE_URL } from "@/lib/constants";

export function getCanonicalUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // Remove trailing slash unless it's the root
  const cleanPath = normalizedPath === "/" 
    ? normalizedPath 
    : normalizedPath.replace(/\/$/, "");
  
  return `${SITE_URL}${cleanPath}`;
}
