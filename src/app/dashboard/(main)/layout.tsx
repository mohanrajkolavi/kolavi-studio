import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { DashboardNavStrip } from "@/components/dashboard/DashboardNavStrip";
import { IdleLogout } from "@/components/dashboard/IdleLogout";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin-auth");

  if (!authCookie?.value || !(await verifySessionToken(authCookie.value))) {
    redirect("/dashboard/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <IdleLogout />
      <main>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <DashboardNavStrip />
          <div className="pt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
