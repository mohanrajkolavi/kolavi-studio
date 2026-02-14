"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PartnerRefHandler } from "@/components/partner/PartnerRefHandler";

export function LayoutShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isPartnerPortal =
    pathname?.startsWith("/partner/dashboard") ||
    pathname?.startsWith("/partner/login") ||
    pathname?.startsWith("/partner/set-password") ||
    pathname?.startsWith("/partner/forgot-password");

  return (
    <>
      <Suspense fallback={null}>
        <PartnerRefHandler />
      </Suspense>
      {!isPartnerPortal && (
        <Suspense fallback={<header className="h-14" />}>
          <Header isAdmin={isAdmin ?? false} />
        </Suspense>
      )}
      {children}
      {!isDashboard && !isPartnerPortal && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  );
}
