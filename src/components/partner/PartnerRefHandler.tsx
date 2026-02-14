"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setPartnerRefCookie, setPartnerRefStorage, PARTNER_CODE_REGEX } from "@/lib/partner/cookie";

/**
 * Sets partner_ref cookie and sessionStorage when ?ref=CODE is in the URL.
 * Cookie + sessionStorage: sessionStorage works when cookies are blocked.
 */
export function PartnerRefHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && PARTNER_CODE_REGEX.test(ref.trim())) {
      const code = ref.trim();
      setPartnerRefCookie(code);
      setPartnerRefStorage(code);
    }
  }, [searchParams]);

  return null;
}
