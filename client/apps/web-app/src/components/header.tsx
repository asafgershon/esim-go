"use client";

import { Navbar } from "@workspace/ui";
import { Button } from "@workspace/ui";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

const navigation = [
  { title: "Hiilo לחברות", href: "/" },
  { title: "שאלות ותשובות", href: "#faq" },
  { title: "מה זה ESIM?", href: "#what-is-esim" },
  { title: "עלינו", href: "#about" },
  { title: "ביקורות", href: "#reviews" },
];

export function Header() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const logo = (
    <Link href="/" className="flex items-center">
      <Image 
        src="/images/logos/logo-header.svg" 
        alt="Hiilo" 
        width={60} 
        height={20}
        className="h-5 w-auto"
        priority
      />
    </Link>
  );

  // Desktop actions (right side)
  const desktopActions = (
    <>
      {isLoading ? null : isAuthenticated && user ? (
        <Link href="/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            אזור אישי
          </Button>
        </Link>
      ) : (
        <Link href="/register">
          <Button 
            size="sm" 
            className="bg-brand-green hover:bg-brand-green/90 text-white rounded-full px-6"
          >
            כניסה לeSIM
          </Button>
        </Link>
      )}
    </>
  );

  // Mobile action (center)
  const mobileAction = (
    <Link href="/register">
      <Button 
        size="sm" 
        className="bg-brand-green hover:bg-brand-green/90 text-white rounded-full px-6 text-xs"
      >
        כניסה לeSIM
      </Button>
    </Link>
  );

  return (
    <Navbar
      logo={logo}
      items={navigation}
      actions={desktopActions}
      mobileActions={mobileAction}
      className="bg-white"
    />
  );
}