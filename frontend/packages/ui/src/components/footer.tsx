"use client";

import Link from "next/link";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/useIsMobile";

interface FooterLink {
  href: string;
  label: string;
}

export function Footer() {
  const isMobile = useIsMobile();

  const links: FooterLink[] = [
    { href: "/terms", label: "תנאי שימוש" },
    { href: "/privacy", label: "מדיניות פרטיות" },
    { href: "/about", label: "אודות" },
    { href: "#faq", label: "שאלות ותשובות" },
    { href: "https://wa.me/972XXXXXXXXX", label: "צרו קשר" },
  ];

  return (
    <footer
      className={cn(
        "relative bg-brand-dark text-brand-white overflow-hidden",
        isMobile ? "rounded-t-[50px]" : "rounded-t-[100px]"
      )}
    >
      <div className="container mx-auto px-6 py-14 relative z-10 flex flex-col items-center gap-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-green">Hiilo</span>
        </Link>

        {/* Links */}
        <ul className="flex flex-wrap justify-center gap-6 text-center">
          {links.map((link, i) => (
            <li key={i}>
              <Link
                href={link.href}
                className="text-brand-white hover:text-brand-green transition-colors text-base"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Copyright */}
        <div className="bg-[#2EE59D] w-full py-4 mt-8">
          <p className="text-center text-[#1B2B3A] text-sm font-medium">
            © 2025 Hiilo. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
}
