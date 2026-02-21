import type { Metadata } from "next";
import type { Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { getBaseMetadata } from "@/lib/seo/metadata";
import { getOrganizationSchema } from "@/lib/seo/jsonld/organization";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = getBaseMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = getOrganizationSchema();
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;
  const isAdmin = headersList.get("x-authenticated") === "1";
  const pathname = headersList.get("x-pathname") ?? "";
  const isBlogRoute = pathname.startsWith("/blog");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {isBlogRoute && (
          <link rel="preconnect" href="https://cms.kolavistudio.com" crossOrigin="anonymous" />
        )}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
          nonce={nonce}
          suppressHydrationWarning
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible focus:[clip:auto] focus:whitespace-normal focus:rounded focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <ThemeProvider>
          <LayoutShell isAdmin={isAdmin}>
            <main id="main-content" className="min-h-screen overflow-x-clip">{children}</main>
          </LayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
