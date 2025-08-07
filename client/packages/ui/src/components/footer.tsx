"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/useIsMobile";

interface FooterLink {
  href: string;
  label: string;
  target?: string;
}

interface FooterProps {
  className?: string;
  links?: FooterLink[];
  copyrightText?: string;
  onNavigate?: (href: string) => void;
}

const defaultLinks: FooterLink[] = [
  { href: "/other", label: "תקנון אתר" },
  { href: "/docs/privacy.pdf", target: "_blank", label: "הצהרת פרטיות" },
  { href: "#reviews", label: "ביקורות" },
  { href: "#about", label: "עלינו" },
  { href: "#what-is-esim", label: "מה זה eSim?" },
  { href: "#faq", label: "שאלות ותשובות" },
  { href: "/docs/about-hiilo.pdf", target: "_blank", label: "HIILO החברה" },
  { href: "https://wa.me/972XXXXXXXXX", target: "_blank", label: "צרו קשר" },
];

export function Footer({
  className,
  links = defaultLinks,
  copyrightText = "© 2025 Hiilo. All rights reserved.",
  onNavigate,
}: FooterProps) {
  const isMobile = useIsMobile();
  // Handle navigation - simplified since scroll logic is now in parent
  const handleFooterNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else if (!href.startsWith("#")) {
      // Handle external navigation
      window.location.href = href;
    }
  };

  return (
    <footer
      className={cn(
        "relative bg-brand-dark text-brand-white overflow-hidden",
        className,
        isMobile ? "rounded-t-[50px]" : "rounded-t-[100px]"
      )}
    >
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="flex flex-col items-center gap-14">
          {/* Logo */}
          <div>
            <svg
              width={isMobile ? 100 : 220}
              height={isMobile ? 30 : 60}
              viewBox="0 0 234 74"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_121_4716)">
                <path
                  d="M210.999 44.0499C210.999 60.2949 197.687 73.5427 179.797 73.5427C161.907 73.5427 148.7 60.2949 148.7 44.0499C148.7 27.8049 162.012 14.4556 179.797 14.4556C197.583 14.4556 210.999 27.7033 210.999 44.0499ZM196.819 44.0499C196.819 35.0469 190.927 26.6647 179.797 26.6647C168.668 26.6647 162.886 35.0469 162.886 44.0499C162.886 53.053 168.778 61.3279 179.797 61.3279C190.817 61.3279 196.819 52.9457 196.819 44.0499Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M215.01 71.7814V73.3675H210.201C209.738 73.3675 209.361 73.0006 209.361 72.549V65.2901C209.361 64.8386 209.738 64.4717 210.201 64.4717H214.9V66.0578H210.791V69.3091C211.358 68.4172 212.209 67.9995 212.973 67.9882H214.316V69.5123H213.181C212.093 69.5123 210.797 70.0711 210.797 71.7757H215.016L215.01 71.7814Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M221.724 71.0817C221.724 72.8879 220.503 73.5596 218.888 73.5596C217.418 73.5596 215.855 72.696 215.855 70.7543H217.227C217.227 71.5953 218.077 71.9735 218.882 71.9735C219.686 71.9735 220.375 71.7082 220.375 71.0817C220.375 69.2133 215.895 70.4438 215.895 67.091C215.895 65.1831 217.128 64.2856 218.662 64.2856C220.474 64.2856 221.596 65.2622 221.596 67.1587H220.236C220.236 66.2838 219.536 65.8774 218.679 65.8774C217.823 65.8774 217.25 66.2443 217.25 66.8934C217.25 68.9763 221.718 67.5425 221.718 71.0873L221.724 71.0817Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M222.858 73.3675V64.4717H224.288V73.3675H222.858Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M234 65.296V73.3677H232.57V66.9781L230.533 71.3752H229.179L227.13 66.9781V73.3677H225.7V65.296C225.7 64.8444 226.076 64.4775 226.539 64.4775H227.575L229.856 69.2698L232.136 64.4775H233.161C233.624 64.4775 234 64.8444 234 65.296Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M104.51 1.27589C103.654 1.79519 103.034 2.42738 102.583 3.00312C102.189 3.51113 101.639 4.3183 101.217 5.40205C100.574 7.04461 100.69 8.11143 100.505 9.1839C99.9667 12.3674 97.0092 14.4277 96.5462 14.7494C93.1835 17.0524 89.0683 16.6403 88.1944 16.55C85.9487 16.3242 84.4497 15.5848 82.0651 16.2678C81.8799 16.3186 80.7339 16.6855 79.7095 17.3628C75.7101 19.9988 74.6625 25.3047 77.3712 29.2164C80.0799 33.1281 85.5204 34.161 89.5198 31.525C90.5616 30.8364 91.3719 29.8881 91.4471 29.7978C92.9172 27.9633 92.8593 26.3094 93.3629 24.4693C93.4786 24.0516 94.7172 19.7505 98.132 17.6507C101.153 15.788 105.077 16.1436 106.183 16.2791C108.122 16.5218 109.713 17.1992 111.976 16.5275C112.792 16.2847 113.585 15.9235 114.326 15.4324C118.326 12.7964 119.373 7.49053 116.664 3.57886C113.614 -0.823883 107.636 -0.62068 104.516 1.27024L104.51 1.27589Z"
                  fill="#00E095"
                />
                <path
                  d="M85.3818 40.1499C80.9946 40.1499 77.4409 43.6157 77.4409 47.8942V66.2559C77.4409 70.5345 80.9946 74.0002 85.3818 74.0002C89.7689 74.0002 93.3226 70.5345 93.3226 66.2559V47.8942C93.3226 43.6157 89.7689 40.1499 85.3818 40.1499Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M109.522 25.5078C105.135 25.5078 101.582 28.9736 101.582 33.2521V66.2558C101.582 70.5344 105.135 74.0001 109.522 74.0001C113.91 74.0001 117.463 70.5344 117.463 66.2558V33.2521C117.463 28.9736 113.91 25.5078 109.522 25.5078Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M133.767 0C129.38 0 125.827 3.46575 125.827 7.74432V66.2557C125.827 70.5342 129.38 74 133.767 74C138.155 74 141.708 70.5342 141.708 66.2557V7.74432C141.708 3.46575 138.155 0 133.767 0Z"
                  fill="#FEFEFE"
                />
                <path
                  d="M61.3331 0H61.2174C56.8476 0 53.2881 3.42624 53.2881 7.63707V30.0741H45.4457C36.4051 30.0741 24.083 32.3884 15.8527 43.1921V7.63707C15.8527 3.42624 12.299 0 7.92926 0C3.55948 0 0 3.42624 0 7.63707V66.3629C0 70.5738 3.5537 74 7.92926 74H8.34019C12.3685 74 15.7486 71.1156 16.2058 67.283C18.7293 46.2119 34.4373 43.5082 47.836 43.5082H53.2881V66.3629C53.2881 70.5738 56.8418 74 61.2174 74H61.3331C65.7029 74 69.2624 70.5738 69.2624 66.3629V7.63707C69.2624 3.42624 65.7087 0 61.3331 0Z"
                  fill="#FEFEFE"
                />
              </g>
              <defs>
                <clipPath id="clip0_121_4716">
                  <rect width="234" height="74" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            <SocialLink href="#" ariaLabel="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.28 6.28 0 00-.88-.05 6.33 6.33 0 00-5.39 9.59A6.33 6.33 0 0015.86 16V8.59a8.33 8.33 0 003.73 1.9v-3.8z"
                  fill="currentColor"
                />
              </svg>
            </SocialLink>
            <SocialLink href="#" ariaLabel="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  fill="currentColor"
                />
              </svg>
            </SocialLink>
            <SocialLink href="#" ariaLabel="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"
                  fill="currentColor"
                />
              </svg>
            </SocialLink>
          </div>

          {/* Navigation Links */}
          <nav aria-label="ניווט פוטר">
            <ul className="flex flex-col md:flex-row items-center gap-4 text-center">
              {links.map((link, index) => (
                <li key={index}>
                  {link.href.startsWith("#") ? (
                    <FooterLink
                      href={link.href}
                      onClick={() => handleFooterNavigation(link.href)}
                      className="text-brand-white hover:text-brand-green transition-colors text-base"
                      label={link.label}
                    />
                  ) : (
                    <FooterLink
                      href={link.href}
                      label={link.label}
                      onClick={(e) => {
                        if (
                          !link.href.startsWith("http") &&
                          !link.href.startsWith("/")
                        ) {
                          e.preventDefault();
                          handleFooterNavigation(link.href);
                        }
                      }}
                    />
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

const SocialLink = ({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "w-12 h-12 text-brand-dark bg-brand-white rounded-full flex items-center justify-center hover:bg-brand-white/80 transition-colors"
      )}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
};

const FooterLink = ({
  href,
  label,
  onClick,
  className,
}: {
  href: string;
  label: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "text-brand-white hover:text-brand-green transition-colors text-base",
        className
      )}
      onClick={onClick}
    >
      {label}
    </Link>
  );
};
