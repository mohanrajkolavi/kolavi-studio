import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indexing — Dashboard",
  robots: { index: false, follow: false },
};

export default function IndexingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
