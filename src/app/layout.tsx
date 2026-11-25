
import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/layout/site-chrome";
import { buildMetadata } from "@/lib/seo";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Canadian Take-Home Pay & Salary Calculators (2026)",
    description:
      "Free 2026 Canadian take-home pay calculator: estimate net salary after federal and provincial tax, CPP/QPP, CPP2/QPP2 and EI, for all provinces and territories.",
    path: "/",
  }),
  other: {
    "google-adsense-account": "ca-pub-1543283177172409",
    "google-site-verification":
      "18BoR4z2qVdBUV77V8ivb4ao8IM2vcccFsVXmZl19HU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1543283177172409"
          crossOrigin="anonymous"
        />
      </head>

      <body className="antialiased">
        <Header />
        <main className="sfx-container sfx-section flex-1">
          {children}
        </main>
        <Footer />
        {/* Google Tag Manager — loads once, after hydration, on every route.
            No financial calculator values are pushed to dataLayer. */}
        <GoogleTagManager gtmId="GTM-WJ2GZCG7" />
      </body>
    </html>
  );
}
