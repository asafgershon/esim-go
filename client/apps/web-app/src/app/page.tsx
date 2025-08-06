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
  // Smooth scroll function for footer navigation
  const handleFooterNavigation = (href: string) => {
    if (href.startsWith('#')) {
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Calculate offset to account for header height
        const headerHeight = 64; // 16 * 4 = 64px (h-16)
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without page reload
        window.history.pushState(null, '', href);
        
        // Set focus for accessibility
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
        
        // Remove tabindex after focus
        setTimeout(() => {
          targetElement.removeAttribute('tabindex');
        }, 100);
      }
    } else {
      // Handle external navigation
      window.location.href = href;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Skip Navigation Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            const headerHeight = 64;
            const elementPosition = mainContent.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            mainContent.focus();
          }
        }}
      >
        דלג לתוכן הראשי
      </a>
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

      {/* Main Content */}
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section id="home" aria-label="עמוד בית">
          <HeroSection />
        </section>

        {/* eSIM Selector Section - Overlapping Hero */}
        <section id="esim-selector" className="relative -mt-[200px] z-20" aria-label="בחירת חבילת eSIM">
          <div className="container mx-auto px-4">
            <Suspense fallback={<div className="h-96" />}>
              <EsimSelector />
            </Suspense>
          </div>
        </section>

        {/* Destinations Gallery */}
        <section id="destinations" aria-label="גלריית יעדים">
          <DestinationsGallery />
        </section>

        {/* Promo Banner */}
        <PromoBanner />

        {/* Features Section */}
        <section id="features" aria-label="תכונות ויתרונות">
          <FeaturesSection />
        </section>

        {/* Background Section with eSIM Compatibility Check */}
        <BackgroundSection>
          <section id="what-is-esim" className="flex flex-col md:flex-row-reverse" aria-label="מה זה eSIM ותאימות">
            <LogoRounded className="self-end" />
            <CompatibilitySection />
          </section>
          {/* Customer Reviews */}
          <section id="reviews" aria-label="ביקורות לקוחות">
            <ReviewsSection />
          </section>
        </BackgroundSection>

        {/* How To Section */}
        <section id="how-to" aria-label="איך זה עובד">
          <HowToSection />
        </section>

        {/* Why Switch Section */}
        <section id="about" aria-label="עלינו ולמה לבחור בנו">
          <WhySwitchSection />
        </section>

        {/* Q&A Section */}
        <section id="faq" aria-label="שאלות ותשובות נפוצות">
          <QASection />
        </section>

        {/* Help Banner */}
        <section id="contact" aria-label="צור קשר ועזרה">
          <HelpBanner />
        </section>
      </main>

      {/* Footer */}
      <Footer onNavigate={handleFooterNavigation} />
    </div>
  );
}
