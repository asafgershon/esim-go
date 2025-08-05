"use client";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { BackgroundSection } from "@/components/background-section";
import { CompatibilitySection } from "@/components/compatibility-section";
import { DestinationsGallery } from "@/components/destinations-gallery";
import { EsimSelector } from "@/components/esim-selector";
import { FeaturesSection } from "@/components/features-section";
import { Header } from "@/components/header";
import { HelpBanner } from "@/components/help-banner";
import { HeroSection } from "@/components/hero-section";
import { HomeWithState } from "@/components/home-with-state";
import { HowToSection } from "@/components/how-to-section";
import { LogoRounded } from "@/components/logo-rounded";
import { PromoBanner } from "@/components/promo-banner";
import { QASection } from "@/components/qa-section";
import { ReviewsSection } from "@/components/reviews-section";
import { WhySwitchSection } from "@/components/why-switch-section";
import { Footer } from "@workspace/ui";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Login Modal - wrapped in Suspense */}
      <Suspense fallback={null}>
        <HomeWithState />
      </Suspense>

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Navigation Header */}
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>

      {/* Hero Section */}
      <HeroSection />

      {/* eSIM Selector Section - Overlapping Hero */}
      <section id="esim-selector" className="relative -mt-[200px] z-20">
        <div className="container mx-auto px-4">
          <Suspense fallback={<div className="h-96" />}>
            <EsimSelector />
          </Suspense>
        </div>
      </section>

      {/* Destinations Gallery */}
      <DestinationsGallery />

      {/* Promo Banner */}
      <PromoBanner />

      {/* Features Section */}
      <FeaturesSection />

      {/* Background Section with eSIM Compatibility Check */}
      <BackgroundSection>
        <div className="flex flex-col md:flex-row-reverse">
          <LogoRounded />
          <CompatibilitySection />
        </div>
        {/* Customer Reviews */}
        <ReviewsSection />
      </BackgroundSection>

      {/* How To Section */}
      <HowToSection />

      {/* Why Switch Section */}
      <WhySwitchSection />

      {/* Q&A Section */}
      <QASection />

      {/* Help Banner */}
      <HelpBanner />

      {/* Footer */}
      <Footer />
    </div>
  );
}
