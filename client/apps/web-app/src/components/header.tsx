"use client";

import { Navbar } from "@workspace/ui";
import { Button } from "@workspace/ui";
import { IconButton } from "@workspace/ui";
import { UserIcon } from "@workspace/ui";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";

const navigation = [
  { title: "Hiilo לחברות", href: "/" },
  { title: "שאלות ותשובות", href: "#faq" },
  { title: "מה זה ESIM?", href: "#what-is-esim" },
  { title: "עלינו", href: "#about" },
  { title: "ביקורות", href: "#reviews" },
];

export function Header() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [, setShowLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );

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

  const handleUserClick = () => {
    if (isAuthenticated) {
      router.push("/profile");
    } else {
      // Show the login modal
      setShowLogin(true);
    }
  };

  // Desktop actions (right side) 
  const desktopActions = (
    <>
      <div className="flex items-center gap-2">
        <IconButton 
          variant="primary-brand" 
          size="sm"
          onClick={handleUserClick}
        >
          <UserIcon />
        </IconButton>
        <Button 
          variant="primary-brand"
          size="sm" 
          className="px-6"
          onClick={() => {
            document.getElementById('esim-selector')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }}
        >
          לרכישת ESIM
        </Button>
      </div>
    </>
  );

  // Mobile action (center)
  const mobileAction = (
    <div className="flex items-center gap-2">
      <IconButton 
        variant="primary-brand" 
        size="sm"
        onClick={handleUserClick}
      >
        <UserIcon />
      </IconButton>
      <Button 
        variant="primary-brand"
        size="sm" 
        className="px-6 text-xs"
        onClick={() => {
          document.getElementById('esim-selector')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }}
      >
        לרכישת ESIM
      </Button>
    </div>
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