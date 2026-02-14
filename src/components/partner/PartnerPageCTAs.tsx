"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefLink } from "./RefLink";

export function PartnerPageCTAs() {
  return (
    <>
      <Button asChild size="lg" className="rounded-2xl bg-orange-600 px-8 font-semibold hover:bg-orange-700">
        <Link href="/partner/apply">Apply to Partner</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="rounded-2xl border-2 px-8 font-semibold">
        <Link href="/partner/login">Partner Login</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="rounded-2xl border-2 px-8 font-semibold">
        <Link href="/partner/terms">Program Terms</Link>
      </Button>
    </>
  );
}

export function PartnerPageCTA() {
  return (
    <>
      <Button asChild size="lg" className="rounded-2xl bg-orange-600 px-8 font-semibold hover:bg-orange-700">
        <Link href="/partner/apply">Apply Now</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="rounded-2xl border-2 px-8 font-semibold">
        <RefLink href="/contact">Contact Us</RefLink>
      </Button>
    </>
  );
}
