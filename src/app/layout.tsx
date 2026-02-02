import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getBaseMetadata } from "@/lib/seo/metadata";
import { getOrganizationSchema } from "@/lib/seo/jsonld/organization";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = getOrganizationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Header />
          <main id="main-content" className="min-h-screen overflow-x-clip">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
