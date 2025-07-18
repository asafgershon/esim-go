import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import AuthMetaTags from "./AuthMetaTags";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiilo - Global eSIM",
  description: "Stay connected worldwide with Hiilo's global eSIM solutions",
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
      </head>
      <body
        className={`${rubik.variable} antialiased font-hebrew`}
      >
        <Providers>{children}</Providers>

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
