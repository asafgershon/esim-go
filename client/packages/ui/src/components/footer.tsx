"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "../lib/utils";

interface FooterLink {
  href: string;
  label: string;
}

interface FooterProps {
  className?: string;
  links?: FooterLink[];
  copyrightText?: string;
  onNavigate?: (href: string) => void;
}

const defaultLinks: FooterLink[] = [
  { href: "/other", label: "תקנון אתר" },
  { href: "/privacy", label: "הצהרת נגישות" },
  { href: "#reviews", label: "ביקורת" },
  { href: "#about", label: "עלינו" },
  { href: "#what-is-esim", label: "מה זה eSIM?" },
  { href: "#faq", label: "שאלות ותשובות" },
  { href: "/company", label: "HIILO החברה" },
  { href: "#contact", label: "צרו קשר" },
];

export function Footer({
  className,
  links = defaultLinks,
  copyrightText = "© 2025 Hiilo. All rights reserved.",
  onNavigate,
}: FooterProps) {
  
  // Handle navigation - simplified since scroll logic is now in parent
  const handleFooterNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else if (!href.startsWith('#')) {
      // Handle external navigation
      window.location.href = href;
    }
  };
  return (
    <footer className={cn("relative bg-[#1B2B3A] text-white rounded-t-[2.5rem] overflow-hidden", className)}>
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {/* Desktop Background */}
        <div className="hidden md:block">
          <Image
            src="/images/bgs/desktop-bottom.png"
            alt=""
            fill
            className="object-contain"
            priority={false}
          />
        </div>
        
        {/* Mobile Background */}
        <div className="block md:hidden">
          <Image
            src="/images/bgs/mobile-bottom.png"
            alt=""
            fill
            className="object-contain"
            priority={false}
          />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="flex flex-col items-center">
          
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold tracking-tight">
                <span className="text-white">H</span>
                <span className="text-white">i</span>
                <span className="text-[#2EE59D]">i</span>
                <span className="text-white">l</span>
                <span className="text-white">o</span>
              </span>
              <span className="text-sm font-normal mt-2">eSIM</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mb-12">
            <Link
              href="#"
              className="w-12 h-12 bg-[#2EE59D] rounded-full flex items-center justify-center hover:bg-[#2EE59D]/80 transition-colors"
              aria-label="TikTok"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.28 6.28 0 00-.88-.05 6.33 6.33 0 00-5.39 9.59A6.33 6.33 0 0015.86 16V8.59a8.33 8.33 0 003.73 1.9v-3.8z" fill="currentColor"/>
              </svg>
            </Link>
            <Link
              href="#"
              className="w-12 h-12 bg-[#2EE59D] rounded-full flex items-center justify-center hover:bg-[#2EE59D]/80 transition-colors"
              aria-label="LinkedIn"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor"/>
              </svg>
            </Link>
            <Link
              href="#"
              className="w-12 h-12 bg-[#2EE59D] rounded-full flex items-center justify-center hover:bg-[#2EE59D]/80 transition-colors"
              aria-label="Instagram"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" fill="currentColor"/>
              </svg>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="mb-12" aria-label="ניווט פוטר">
            <ul className="flex flex-col items-center gap-4 text-center">
              {links.map((link, index) => (
                <li key={index}>
                  {link.href.startsWith('#') ? (
                    <button
                      onClick={() => handleFooterNavigation(link.href)}
                      className="text-white hover:text-[#2EE59D] transition-colors text-base"
                      aria-label={`נווט לשל ${link.label}`}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-white hover:text-[#2EE59D] transition-colors text-base"
                      onClick={(e) => {
                        if (!link.href.startsWith('http') && !link.href.startsWith('/')) {
                          e.preventDefault();
                          handleFooterNavigation(link.href);
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#2EE59D] py-4">
        <div className="container mx-auto px-4">
          <p className="text-center text-[#1B2B3A] text-sm font-medium">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}