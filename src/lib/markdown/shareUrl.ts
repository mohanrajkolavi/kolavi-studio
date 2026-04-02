/**
 * Encode/decode state to/from URL params for shareable links.
 */

const TRANSFER_KEY = "md-tool-transfer";

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

/**
 * Store content in sessionStorage for tool-to-tool transfer.
 * Used instead of URL params to avoid URI_TOO_LONG errors.
 */
export function setTransferContent(content: string): void {
  try {
    sessionStorage.setItem(TRANSFER_KEY, content);
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Read and consume transferred content from sessionStorage.
 * Returns null if nothing was transferred.
 */
export function getTransferContent(): string | null {
  try {
    const content = sessionStorage.getItem(TRANSFER_KEY);
    if (content) {
      sessionStorage.removeItem(TRANSFER_KEY);
      return content;
    }
  } catch {
    // sessionStorage unavailable
  }
  return null;
}

export function getContentFromUrl(searchParams: URLSearchParams): string | null {
  // Check sessionStorage first (tool-to-tool transfer)
  const transferred = getTransferContent();
  if (transferred) return transferred;

  // Fall back to URL param (shareable links)
  const encoded = searchParams.get("c");
  if (!encoded) return null;
  const decoded = decodeShareContent(encoded);
  return decoded || null;
}
