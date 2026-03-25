/**
 * Encode/decode state to/from URL params for shareable links.
 */

export function encodeShareContent(content: string): string {
  try {
    return btoa(encodeURIComponent(content));
  } catch {
    return "";
  }
}

export function decodeShareContent(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return "";
  }
}

export function getShareUrl(content: string, basePath: string): string {
  const encoded = encodeShareContent(content);
  if (!encoded) return basePath;
  const url = new URL(basePath, window.location.origin);
  url.searchParams.set("c", encoded);
  return url.toString();
}

export function getContentFromUrl(searchParams: URLSearchParams): string | null {
  const encoded = searchParams.get("c");
  if (!encoded) return null;
  const decoded = decodeShareContent(encoded);
  return decoded || null;
}
