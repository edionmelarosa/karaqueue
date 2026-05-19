import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://karaqueue.party";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "KaraQueue — Free Karaoke Online | YouTube Karaoke Queue",
    template: "%s | KaraQueue",
  },
  description:
    "KaraQueue is a free online karaoke machine powered by YouTube. Search any song, build a queue, and sing along — no account or download required. Start your free karaoke session now!",
  keywords: [
    "free karaoke",
    "free karaoke online",
    "online karaoke",
    "karaoke machine",
    "youtube karaoke",
    "karaoke queue",
    "karaoke songs",
    "sing online",
    "karaoke app",
    "free karaoke app",
    "karaoke no download",
    "karaoke party",
  ],
  authors: [{ name: "KaraQueue" }],
  creator: "KaraQueue",
  publisher: "KaraQueue",
  category: "music",
  applicationName: "KaraQueue",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "KaraQueue",
    title: "KaraQueue — Free Karaoke Online",
    description:
      "Free online karaoke machine powered by YouTube. Search songs, build a queue, and sing along with friends — no sign-up needed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaraQueue — Free Karaoke Online",
    description:
      "Free online karaoke machine powered by YouTube. Search songs, build a queue, and sing along — no sign-up needed.",
    creator: "@karaqueue",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "KaraQueue",
  url: BASE_URL,
  description:
    "Free online karaoke machine powered by YouTube. Search any song, build a queue, and sing along with friends.",
  applicationCategory: "MusicApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "YouTube karaoke search",
    "Song queue management",
    "Free to use",
    "No download required",
    "No account required",
  ],
  screenshot: `${BASE_URL}/og-image.png`,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full md:h-full flex flex-col bg-[#0a0a0f] antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
