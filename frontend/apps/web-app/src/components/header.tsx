"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  Button,
  IconButton,
  Navbar,
  UserIcon,
  useScrollTo,
} from "@workspace/ui";
import type { SmoothScrollHandle } from "@workspace/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { RefObject } from "react";

const navigation = [
  { title: "Hiilo לחברות", href: "/", external: true },
  { title: "שאלות ותשובות", href: "#faq", external: false },
  { title: "?eSim מה זה", href: "#what-is-esim", external: false },
  { title: "עלינו", href: "/docs/about-hiilo.pdf", external: true },
  { title: "ביקורות", href: "#reviews", external: false },
];

interface HeaderProps {
  scrollContainerRef?: RefObject<SmoothScrollHandle | null>;
}

export function Header({ scrollContainerRef }: HeaderProps = {}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [, setShowLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );
  const { scrollTo } = useScrollTo({ scrollContainerRef });

  // Handle navigation
  const handleSmoothScroll = (href: string, external?: boolean) => {
    if (external) {
      router.push(href);
      return;
    }

    if (href.startsWith("#")) {
      scrollTo(href);
    }
  };

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

  // Desktop actions (right side) - No logout button on desktop
  const desktopActions = (
    <div className="flex items-center gap-2">
      <IconButton
        variant="brand-primary"
        size="default"
        onClick={handleUserClick}
      >
        <UserIcon />
      </IconButton>
      <Button
        variant="brand-secondary"
        size="default"
        emphasized
        onClick={() => scrollTo("#esim-selector")}
      >
        לרכישת ESIM
      </Button>
    </div>
  );

  // Mobile action (center) - With logout button only on mobile
  const mobileAction = (
    <div className="w-full">
      <div className="flex items-center gap-2 justify-center">
        <IconButton variant="brand-primary" size="default" onClick={handleUserClick}>
          <UserIcon />
        </IconButton>
        <Button
          variant="brand-secondary"
          emphasized
          size="default"
          onClick={() => scrollTo("#esim-selector")}
        >
          לרכישת ESIM
        </Button>
      </div>
    </div>
  );

  return (
    <Navbar
      logo={logo}
      items={navigation}
      actions={desktopActions}
      mobileActions={mobileAction}
      className="bg-white"
      onNavigate={handleSmoothScroll}
    />
  );
}
