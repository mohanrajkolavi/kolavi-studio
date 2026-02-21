import { SetPasswordErrorBoundary } from "./SetPasswordErrorBoundary";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Set Password - Partner Portal",
  description: "Set or reset your Partner Program account password.",
  path: "/partner/set-password",
  noIndex: true,
});

export default function PartnerSetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SetPasswordErrorBoundary>{children}</SetPasswordErrorBoundary>;
}
