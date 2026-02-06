import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Maker",
};

export default function BlogMakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
