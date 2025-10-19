"use client";

import Link from "next/link";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/useIsMobile";

export function Footer() {
  const isMobile = useIsMobile();

  const links = [
    { href: "/terms", label: "תנאי שימוש" },
    { href: "/privacy", label: "מדיניות פרטיות" },
    { href: "/about", label: "אודות" },
    { href: "https://wa.me/972XXXXXXXXX", label: "צרו קשר" },
  ];

  return (
    <footer
      className={cn(
        "relative bg-brand-dark text-brand-white overflow-hidden mt-20",
        isMobile ? "rounded-t-[50px]" : "rounded-t-[100px]"
      )}
    >
      <div className="container mx-auto px-6 py-14 flex flex-col items-center gap-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-green">Hiilo</span>
        </Link>

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

        <div className="bg-[#2EE59D] w-full py-4 mt-8">
          <p className="text-center text-[#1B2B3A] text-sm font-medium">
            © 2025 Hiilo. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
}
