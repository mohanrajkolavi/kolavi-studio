"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setPartnerRefCookie, PARTNER_CODE_REGEX } from "@/lib/partner/cookie";

/**
 * Sets partner_ref cookie when ?ref=CODE is in the URL.
 * Runs on any page - ensures attribution works regardless of entry point.
 */
export function PartnerRefHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && PARTNER_CODE_REGEX.test(ref.trim())) {
      setPartnerRefCookie(ref.trim());
    }
  }, [searchParams]);

  return null;
}
