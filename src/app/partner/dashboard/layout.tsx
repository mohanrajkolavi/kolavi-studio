import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerIdFromCookies } from "@/lib/partner-auth";

export const metadata: Metadata = {
  title: "Partner Dashboard",
  robots: { index: false, follow: false },
};

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
