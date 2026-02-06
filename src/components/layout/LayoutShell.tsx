"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isDashboardAuth = isDashboard && pathname !== "/dashboard/login";

  return (
    <>
      <Header isAdmin={isDashboardAuth} />
      {children}
      {!isDashboard && <Footer />}
    </>
  );
}
