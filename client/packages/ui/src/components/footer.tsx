"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { cn } from "../lib/utils";

interface FooterLink {
  href: string;
  label: string;
}

interface SocialLink {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface FooterProps {
  className?: string;
  logoComponent?: React.ReactNode;
  links?: FooterLink[];
  socialLinks?: SocialLink[];
  copyrightText?: string;
  companyName?: string;
  tagline?: string;
}

const defaultLinks: FooterLink[] = [
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/contact", label: "צור קשר" },
];

const defaultSocialLinks: SocialLink[] = [
  { href: "#", icon: Facebook, label: "Facebook" },
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Linkedin, label: "LinkedIn" },
];

export function Footer({
  className,
  logoComponent,
  links = defaultLinks,
  socialLinks = defaultSocialLinks,
  copyrightText,
  companyName = "Hiilo",
  tagline,
}: FooterProps): JSX.Element {
  const currentYear = new Date().getFullYear();
  const copyright = copyrightText || `© ${currentYear} ${companyName}. כל הזכויות שמורות.`;

  return (
    <footer className={cn("bg-[brand-dark] text-white", className)}>
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Logo and Company Info */}
          <div className="text-center md:text-right">
            {logoComponent || (
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  <span className="text-[brand-green]">Hiii</span>
                  <span className="text-white">lo</span>
                </span>
              </div>
            )}
            {tagline && (
              <p className="text-gray-400 text-sm mb-4">{tagline}</p>
            )}
          </div>

          {/* Navigation Links */}
          <div className="text-center">
            <nav className="space-y-3">
              {links.map((link, index) => (
                <div key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[brand-green] transition-colors text-sm block"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-left">
            <div className="flex justify-center md:justify-start gap-4 mb-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-[brand-green] rounded-full flex items-center justify-center hover:bg-[brand-green]/80 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-white" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            {copyright}
          </div>
        </div>
      </div>
    </footer>
  );
}