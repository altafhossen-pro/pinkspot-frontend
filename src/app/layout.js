import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "@/context/AppContext";
import { generateStaticMetadata, generateViewport } from "@/utils/metadata";
import ConditionalHeader from "@/components/Common/ConditionalHeader";
import MobileBottomNavigation from "@/components/Common/MobileBottomNavigation";
import { Suspense } from "react";
import AffiliateTracker from "@/components/Common/AffiliateTracker";
import Script from "next/script";
import VisitorTracker from "@/components/VisitorTracker/VisitorTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = generateViewport();

export async function generateMetadata() {
  const siteSettings = await getSiteSettings();
  const ogImage = siteSettings?.ogImage || '';

  return generateStaticMetadata('home', { image: ogImage });
}

async function getSiteSettings() {
  try {
    // Next.js automatically deduplicates fetch calls with the same URL + options
    // within a single render pass (generateMetadata + RootLayout share the same cache)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/settings/site-settings`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      cache: 'force-cache'      // Ensures request deduplication across the same render
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

export default async function RootLayout({ children }) {
  const siteSettings = await getSiteSettings();
  const logoUrl = siteSettings?.logoUrl || '';

  return (
    <html lang="en">
      <head>
        {/* Structured Data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Pinkspot",
              "url": "https://pinkspot.bd",
              "logo": logoUrl || "https://pinkspot.bd/images/logo.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+8801519181818",
                "contactType": "customer service",
                "email": "info@pinkspot.bd",
                "availableLanguage": ["English", "Bengali"]
              },
              "sameAs": [
                "https://www.facebook.com/pinkspot"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Pinkspot",
              "url": "https://pinkspot.bd",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://pinkspot.bd/shop?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* tag manager script here  */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PSBHRW9D');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} antialiased`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PSBHRW9D"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AppProvider>
          <VisitorTracker />
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          <ConditionalHeader logoUrl={logoUrl} />
          {children}
          <MobileBottomNavigation />
          <Toaster />
        </AppProvider>

      </body>
    </html>
  );
}
