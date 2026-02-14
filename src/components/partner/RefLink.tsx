"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PARTNER_CODE_REGEX } from "@/lib/partner/cookie";

type RefLinkProps = React.ComponentProps<typeof Link>;

/**
 * Link that preserves ?ref=CODE when navigating. Ensures attribution works
 * when user clicks Contact from /partner?ref=CODE (cookies blocked).
 */
export function RefLink({ href, ...props }: RefLinkProps) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  let resolvedHref = href;
  if (ref && PARTNER_CODE_REGEX.test(ref.trim()) && typeof href === "string" && href.startsWith("/")) {
    const url = new URL(href, "http://dummy");
    if (!url.searchParams.has("ref")) {
      url.searchParams.set("ref", encodeURIComponent(ref.trim()));
    }
    resolvedHref = url.pathname + url.search + url.hash;
  }

  return <Link href={resolvedHref} {...props} />;
}
