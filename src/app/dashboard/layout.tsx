import type { Metadata } from "next";

/**
 * Dashboard layout - pass-through only.
 * Auth-protected layout is in (main)/layout.tsx so /dashboard/login renders without redirect.
 * Noindex so login and admin pages are not indexed (robots.txt disallow is advisory only).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
