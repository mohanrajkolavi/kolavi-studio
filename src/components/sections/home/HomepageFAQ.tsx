"use client";

import { FAQ } from "@/components/sections/FAQ";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/constants/homepage-faq";

export function HomepageFAQ() {
  return (
    <FAQ
      title="Frequently Asked Questions"
      items={HOMEPAGE_FAQ_ITEMS}
      className="border-t border-border"
    />
  );
}
