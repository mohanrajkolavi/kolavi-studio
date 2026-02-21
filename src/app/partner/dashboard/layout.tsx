import { redirect } from "next/navigation";
import { getPartnerIdFromCookies } from "@/lib/partner-auth";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Partner Dashboard",
  description: "Manage your referrals, commissions, and payouts in the Kolavi Studio Partner Portal.",
  path: "/partner/dashboard",
  noIndex: true,
});

export default async function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const partnerId = await getPartnerIdFromCookies();
  if (!partnerId) {
    redirect("/partner/login");
  }

  return <>{children}</>;
}
