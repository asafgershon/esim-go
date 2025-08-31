import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import AuthMetaTags from "./AuthMetaTags";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieBannerWrapper } from "@/components/cookie-banner/CookieBannerWrapper";
import "@workspace/ui/theme.css";
import "@workspace/ui/globals.css";
import "./globals.css";


export const metadata: Metadata = {
  title: "Hilo ESIM - Unlimited Travel. Unlimited Data",
  description:
    "Stay connected worldwide with Hilo ESIM's global eSIM solutions. Unlimited travel, unlimited data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <AuthMetaTags />
        <link
          href="https://fonts.cdnfonts.com/css/agency-fb"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-title" content="Hiilo ESIM" />
      </head>
      <body className={`antialiased font-hebrew`}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
        <CookieBannerWrapper />

        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="lazyOnload"
        />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
