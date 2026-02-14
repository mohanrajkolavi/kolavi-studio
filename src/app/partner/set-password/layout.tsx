import type { Metadata } from "next";
import { SetPasswordErrorBoundary } from "./SetPasswordErrorBoundary";

export const metadata: Metadata = {
  title: "Set Password - Partner Portal",
  robots: { index: false, follow: false },
};

export default function PartnerSetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SetPasswordErrorBoundary>{children}</SetPasswordErrorBoundary>;
}
