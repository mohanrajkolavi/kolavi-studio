"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ROICalculator() {
  const [botoxPatients, setBotoxPatients] = useState(30);
  const [avgSpend, setAvgSpend] = useState(400);
  const [returnRate, setReturnRate] = useState(60);
  const [otherTreatments, setOtherTreatments] = useState(5);

  const botoxMonthly = botoxPatients * avgSpend;
  const botoxAnnual = botoxMonthly * 12 * (1 + returnRate / 100);
  const otherRevenueMin = botoxAnnual * 0.5 * Math.min(otherTreatments / 3, 1);
  const otherRevenueMax = botoxAnnual * 1.5 * Math.min(otherTreatments / 3, 1);
  const ourPricing = 29988; // ~30K annually for Growth tier

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <label htmlFor="botox-patients" className="block text-sm font-medium">Monthly Botox patients</label>
          <Input
            id="botox-patients"
            type="number"
            min={1}
            max={500}
            value={botoxPatients}
            onChange={(e) => setBotoxPatients(Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
        <div>
          <label htmlFor="avg-spend" className="block text-sm font-medium">Average spend per Botox patient ($)</label>
          <Input
            id="avg-spend"
            type="number"
            min={100}
            max={2000}
            value={avgSpend}
            onChange={(e) => setAvgSpend(Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
        <div>
          <label htmlFor="return-rate" className="block text-sm font-medium">Patient return rate (%)</label>
          <Input
            id="return-rate"
            type="number"
            min={0}
            max={100}
            value={returnRate}
            onChange={(e) => setReturnRate(Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
        <div>
          <label htmlFor="other-treatments" className="block text-sm font-medium">Other treatments not ranking (e.g. 5)</label>
          <Input
            id="other-treatments"
            type="number"
            min={0}
            max={15}
            value={otherTreatments}
            onChange={(e) => setOtherTreatments(Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="mt-8 space-y-4 rounded-xl bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">
          Current annual revenue from Botox (with returns):{" "}
          <strong className="text-foreground">${Math.round(botoxAnnual).toLocaleString()}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Projected additional revenue if other treatments ranked:{" "}
          <strong className="text-orange-600 dark:text-orange-400">
            ${Math.round(otherRevenueMin).toLocaleString()} – ${Math.round(otherRevenueMax).toLocaleString()}
          </strong>
        </p>
        <p className="text-lg font-semibold">
          Our investment (Growth tier): $29,988/year. Projected ROI:{" "}
          <span className="text-orange-600 dark:text-orange-400">
            {Math.round((otherRevenueMin / ourPricing) * 10) / 10}× – {Math.round((otherRevenueMax / ourPricing) * 10) / 10}×
          </span>
        </p>
      </div>

      <Button asChild size="lg" className="mt-8 w-full rounded-2xl bg-orange-600 hover:bg-orange-700">
        <Link href="/contact">Get Your Free Audit</Link>
      </Button>
    </div>
  );
}
