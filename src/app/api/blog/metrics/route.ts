import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getPipelineMetricsAggregate } from "@/lib/pipeline/metrics";

/**
 * Returns aggregate stats from the last 50 pipeline runs (in-memory).
 * Average total duration, average per-chunk duration, cache hit rate,
 * average audit score, most common failure points, average cost.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aggregate = getPipelineMetricsAggregate();
  return new Response(JSON.stringify(aggregate), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
