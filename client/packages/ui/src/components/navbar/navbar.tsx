"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "../sheet";

interface NavItem {
  title: string;
  href: string;
  external?: boolean;
}

interface NavbarProps {
  logo?: React.ReactNode;
  items?: NavItem[];
  actions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  className?: string;
  onNavigate?: (href: string, external?: boolean) => void;
}

export function Navbar({
  logo,
  items = [],
  actions,
  mobileActions,
  className,
  onNavigate,
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className={cn("h-16 bg-background border-b border-border", className)}>
      <div className="h-full container mx-auto px-4">
        {/* Mobile Layout */}
        <div className="flex md:hidden h-full items-center justify-between">
          {/* Burger Menu - Right */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative p-0 h-auto w-auto hover:bg-transparent text-brand-dark hover:text-brand-dark/80 cursor-pointer"
                aria-label="Toggle menu"
              >
                <MenuIcon isOpen={isOpen} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={cn(
                "w-[300px] absolute top-0 opacity-0 p-6",
                isOpen && "opacity-100"
              )}
            >
              {/* Mobile Navigation Items */}
              <nav className="flex flex-col gap-4 mt-8">
                {items.map((item) =>
                  onNavigate && !item.external && item.href.startsWith("#") ? (
                    <button
                      dir="rtl"
                      key={item.href}
                      onClick={() => {
                        onNavigate(item.href, item.external);
                        setIsOpen(false);
                      }}
                      className="text-lg font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-2 border-b border-border last:border-b-0 text-right w-full"
                      aria-label={`נווט לשל ${item.title}`}
                    >
                      {item.title}
                    </button>
                  ) : (
                    <Link
                      dir="rtl"
                      key={item.href}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      onClick={() => {
                        if (
                          onNavigate &&
                          !item.external &&
                          item.href.startsWith("#")
                        ) {
                          onNavigate(item.href, item.external);
                        }
                        setIsOpen(false);
                      }}
                      className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-b border-border last:border-b-0"
                    >
                      {item.title}
                    </Link>
                  )
                )}
              </nav>

              {/* Mobile Actions */}
              {(mobileActions || actions) && (
                <div className="mt-8 pt-4  border-border border-t">
                  {mobileActions || actions}
                </div>
              )}
            </SheetContent>
          </Sheet>
          {/* Mobile Actions - Center */}
          <div className="flex-1 flex justify-center">
            {mobileActions || actions}
          </div>

          {/* Logo - Left */}
          <div className="flex items-center">{logo}</div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex h-full items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center">{logo}</div>

          {/* Desktop Navigation - Center */}
          <NavigationMenu>
            <NavigationMenuList className="gap-6">
              {items.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    {onNavigate &&
                    !item.external &&
                    item.href.startsWith("#") ? (
                      <button
                        onClick={() => onNavigate(item.href, item.external)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                        aria-label={`נווט לשל ${item.title}`}
                      >
                        {item.title}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        onClick={() => {
                          if (
                            onNavigate &&
                            !item.external &&
                            item.href.startsWith("#")
                          ) {
                            onNavigate(item.href, item.external);
                          }
                        }}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                      >
                        {item.title}
                      </Link>
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Actions - Right */}
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      </div>
    </nav>
  );
}

// Animated Menu Icon Component
function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="21"
      height="15"
      viewBox="0 0 21 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative"
    >
      {/* Top bar - rotates to form X */}
      <rect
        y="0.582611"
        width="21"
        height="1.82609"
        rx="0.913043"
        fill="currentColor"
        style={{
          transformOrigin: "center",
          transform: isOpen ? "rotate(45deg) translateY(6px)" : "none",
          transition: "transform 0.3s ease-in-out",
        }}
      />

      {/* Middle bar - fades out */}
      <rect
        x="5.47852"
        y="6.60869"
        width="15.5217"
        height="1.82609"
        rx="0.913043"
        fill="currentColor"
        style={{
          opacity: isOpen ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      />

      {/* Bottom bar - rotates to form X */}
      <rect
        y="12.6348"
        width="21"
        height="1.82609"
        rx="0.913043"
        fill="currentColor"
        style={{
          transformOrigin: "center",
          transform: isOpen ? "rotate(-45deg) translateY(-6px)" : "none",
          transition: "transform 0.3s ease-in-out",
        }}
      />
    </svg>
  );
}
