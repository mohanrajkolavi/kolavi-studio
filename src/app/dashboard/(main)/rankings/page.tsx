import { getPageMetadata } from "@/lib/seo/metadata";
import { RankingsOverview } from "@/components/dashboard/RankingsOverview";

export const metadata = getPageMetadata({
  title: "Rankings Dashboard",
  description: "Google Search Console performance and AI-ranked improvement suggestions.",
  path: "/dashboard/rankings",
  noIndex: true,
});

export default function RankingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Rankings</h1>
      <p className="mt-1 text-muted-foreground">
        Google Search Console performance for every page, with AI-ranked improvements per URL.
      </p>
      <RankingsOverview />
    </div>
  );
}
