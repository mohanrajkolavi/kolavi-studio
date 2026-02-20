"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageSpeedSlider() {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Drag to compare</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Their site: 38 score, 6.2s load. Ours: 98 score, 0.8s load.
      </p>

      <div className="relative mt-6 aspect-video overflow-hidden rounded-xl bg-muted">
        <div
          className="absolute inset-0 flex"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <div className="flex w-full shrink-0 items-center justify-center bg-red-950/30">
            <div className="text-center">
              <p className="text-4xl font-bold text-red-400">38</p>
              <p className="text-sm text-muted-foreground">6.2 seconds</p>
              <p className="mt-2 text-xs text-muted-foreground">Competitor</p>
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 flex justify-end"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <div className="flex w-full shrink-0 items-center justify-center bg-green-950/30">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-400">98</p>
              <p className="text-sm text-muted-foreground">0.8 seconds</p>
              <p className="mt-2 text-xs text-muted-foreground">Kolavi</p>
            </div>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Compare PageSpeed scores"
        />
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-1 bg-foreground"
          style={{ left: `${sliderPos}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        At 6 seconds load time, you lose 53% of mobile visitors before the page loads. At 0.8 seconds, less than 5%.
      </p>

      <Button asChild size="sm" className="mt-4">
        <Link href="/tools/speed-audit">Get Your Score</Link>
      </Button>
    </div>
  );
}
