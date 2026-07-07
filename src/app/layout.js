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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = generateStaticMetadata('home');
export const viewport = generateViewport();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* tag manager script here  */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WZBVXD9D');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} antialiased`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WZBVXD9D"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AppProvider>
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          <ConditionalHeader />
          {children}
          <MobileBottomNavigation />
          <Toaster />
        </AppProvider>

      </body>
    </html>
  );
}
