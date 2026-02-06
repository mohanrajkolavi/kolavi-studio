import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Maintenance",
};

export default function ContentMaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
