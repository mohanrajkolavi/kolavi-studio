"use client";

import { useEffect, useRef } from "react";

const TYPEFORM_SCRIPT = "https://embed.typeform.com/next/embed.js";

export function TypeformEmbed({ formId }: { formId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formId || !containerRef.current) return;

    const wrapper = containerRef.current;

    // 1. Create the div Typeform's script looks for (data-tf-live from Share → Embed)
    const widgetDiv = document.createElement("div");
    widgetDiv.setAttribute("data-tf-widget", formId);
    widgetDiv.setAttribute("data-tf-live", formId);
    widgetDiv.style.width = "100%";
    widgetDiv.style.height = "600px";
    widgetDiv.style.minHeight = "600px";
    wrapper.appendChild(widgetDiv);

    // 2. Load script after div is in DOM; cache-bust so script runs and finds our div
    const script = document.createElement("script");
    script.src = `${TYPEFORM_SCRIPT}?t=${Date.now()}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
      script.remove();
    };
  }, [formId]);

  return (
    <div
      ref={containerRef}
      className="min-h-[600px] w-full"
      aria-label="Contact form"
    />
  );
}
