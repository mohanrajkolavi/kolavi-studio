import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Forgot Password - Partner Portal",
  description: "Reset your Partner Program account password.",
  path: "/partner/forgot-password",
  noIndex: true,
});

export default function PartnerForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
