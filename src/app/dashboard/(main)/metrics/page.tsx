import { getPageMetadata } from "@/lib/seo/metadata";
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";

export const metadata = getPageMetadata({
  title: "Metrics Dashboard",
  description: "Key conversion metrics and lead analytics.",
  path: "/dashboard/metrics",
  noIndex: true,
});

export default function MetricsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Metrics Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Key conversion metrics. Connect GA4 API for live data.
      </p>
      <MetricsDashboard />
    </div>
  );
}
