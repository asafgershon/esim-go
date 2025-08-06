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
  { title: "Hiilo לחברות", href: "/", external: true },
  { title: "שאלות ותשובות", href: "#faq", external: false },
  { title: "מה זה ESIM?", href: "#what-is-esim", external: false },
  { title: "עלינו", href: "#about", external: false },
  { title: "ביקורות", href: "#reviews", external: false },
];

export function Header() {
  const { isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [, setShowLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );

  // Smooth scroll function with accessibility support
  const handleSmoothScroll = (href: string, external?: boolean) => {
    if (external) {
      router.push(href);
      return;
    }

    if (href.startsWith("#")) {
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // Calculate offset to account for header height
        const headerHeight = 64; // 16 * 4 = 64px (h-16)
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // Update URL without page reload
        window.history.pushState(null, "", href);

        // Set focus for accessibility
        targetElement.setAttribute("tabindex", "-1");
        targetElement.focus();

        // Remove tabindex after focus
        setTimeout(() => {
          targetElement.removeAttribute("tabindex");
        }, 100);
      }
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
      <IconButton variant="primary-brand" size="sm" onClick={handleUserClick}>
        <UserIcon />
      </IconButton>
      <Button
        variant="primary-brand"
        size="sm"
        className="px-6"
        onClick={() => {
          document.getElementById("esim-selector")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      >
        לרכישת ESIM
      </Button>
    </div>
  );

  // Mobile action (center) - With logout button only on mobile
  const mobileAction = (
    <div className="w-full">
      <div className="flex items-center gap-2 justify-center">
        <IconButton variant="primary-brand" size="sm" onClick={handleUserClick}>
          <UserIcon />
        </IconButton>
        <Button
          variant="primary-brand"
          size="sm"
          className="px-6 text-xs"
          onClick={() => {
            document.getElementById("esim-selector")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
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
