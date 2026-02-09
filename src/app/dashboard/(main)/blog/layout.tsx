import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Writer",
};

export default function BlogMakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
