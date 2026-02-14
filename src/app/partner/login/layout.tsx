import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Login",
  robots: { index: false, follow: false },
};

export default function PartnerLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
