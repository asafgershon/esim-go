"use client";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { BackgroundSection } from "@/components/background-section";
import { CompatibilitySection } from "@/components/compatibility-section";
import { DestinationsGallery } from "@/components/destinations-gallery";
import BundleSelector from "@/components/bundle-selector";
import { FeaturesSection } from "@/components/features-section";
import { Header } from "@/components/header";
import { HelpBanner } from "@/components/help-banner";
import { HeroSection } from "@/components/hero-section";
import { LoginModal } from "@/components/home-with-state";
import { HowToSection } from "@/components/how-to-section";
import { LogoRounded } from "@/components/logo-rounded";
import { PromoBanner } from "@/components/promo-banner";
import { QASection } from "@/components/qa-section";
import { ReviewsSection } from "@/components/reviews-section";
import { WhySwitchSection } from "@/components/why-switch-section";
import {
  Footer,
  useScrollTo,
  SmoothScrollContainer,
  type SmoothScrollHandle,
  cn,
} from "@workspace/ui";
import { Suspense, useRef } from "react";

const maxContentWidth = "max-w-7xl";
export default function Home() {
  const scrollContainerRef = useRef<SmoothScrollHandle>(null);
  const { scrollTo } = useScrollTo({ scrollContainerRef });

  // Handle footer navigation
  const handleFooterNavigation = (href: string) => {
    if (href.startsWith("#")) {
      scrollTo(href);
    } else {
      // Handle external navigation
      window.location.href = href;
    }
  };

  return (
    <SmoothScrollContainer
      ref={scrollContainerRef}
      speed={1}
      smooth={1.5}
      effects={true}
      fixedHeader={true}
      headerHeight={64}
    >
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Login Modal - wrapped in Suspense */}
        <Suspense fallback={null}>
          <LoginModal />
        </Suspense>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Navigation Header */}
        <Suspense fallback={<div className="h-16" />}>
          <Header scrollContainerRef={scrollContainerRef} />
        </Suspense>

        {/* Main Content */}
        <main
          id="main-content"
          className="flex flex-col gap-20 mb-[96px]"
          tabIndex={-1}
        >
          {/* Hero Section */}
          <HeroSection id="home" ariaLabel="עמוד בית" />

          {/* eSIM Selector Section - Overlapping Hero */}
          <Suspense fallback={<BundleSelector.Skeleton />}>
            <BundleSelector
              className={cn(maxContentWidth, "lg:max-w-[800px]")}
              id="esim-selector"
              ariaLabel="בחירת חבילת eSIM"
              speed="0.95"
            />
          </Suspense>

          {/* Destinations Gallery */}
          <Suspense fallback={<div className="h-16" />}>
            <DestinationsGallery
              speed="0.98"
              id="destinations"
              ariaLabel="גלריית יעדים"
            />
          </Suspense>

          {/* Promo Banner */}
          <PromoBanner />

          {/* Features Section */}
          <FeaturesSection id="features" ariaLabel="תכונות ויתרונות" />

          {/* Background Section with eSIM Compatibility Check */}
          <BackgroundSection>
            <section aria-label="מה זה eSIM ותאימות">
              <LogoRounded className="self-end" />
              <CompatibilitySection
                id="what-is-esim"
                ariaLabel="מה זה eSIM ותאימות"
              />
            </section>
            {/* Customer Reviews */}
            <ReviewsSection />

            {/* How To Section */}
            <HowToSection id="how-to" ariaLabel="כיצד להתקין את ה־eSIM" />
          </BackgroundSection>

          {/* Why Switch Section */}
          <WhySwitchSection id="about" ariaLabel="עלינו ולמה לבחור בנו" />

          {/* Q&A Section */}
          <QASection
            id="faq"
            ariaLabel="שאלות ותשובות נפוצות"
            className="mb-20 sm:mx-10"
          />

          {/* Help Banner */}
          <HelpBanner id="contact" ariaLabel="צור קשר ועזרה" />
        </main>

        {/* Footer */}
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    </SmoothScrollContainer>
  );
}
