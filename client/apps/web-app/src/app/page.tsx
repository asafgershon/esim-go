"use client";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { BackgroundSection } from "@/components/background-section";
import { CompatibilitySection } from "@/components/compatibility-section";
import { DestinationsGallery } from "@/components/destinations-gallery";
import { EsimSelector } from "@/components/esim-selector";
import { FeaturesSection } from "@/components/features-section";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { HowToSection } from "@/components/how-to-section";
import { LoginModalWrapper } from "@/components/login-modal-wrapper";
import { LogoRounded } from "@/components/logo-rounded";
import { PromoBanner } from "@/components/promo-banner";
import { ReviewsSection } from "@/components/reviews-section";
import { Button, Card } from "@workspace/ui";
import {
  ArrowLeft,
  Check,
  Shield
} from "lucide-react";
import Link from "next/link";
import { parseAsBoolean, useQueryState } from "nuqs";

export default function Home() {
  const [showLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );

  // Handle successful login - just navigate directly
  const handleLoginSuccess = () => {
    // Use the most direct navigation method
    window.location.href = "/profile";
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Login Modal - now with callback */}
      {showLogin && <LoginModalWrapper onLoginSuccess={handleLoginSuccess} />}

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Navigation Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* eSIM Selector Section - Overlapping Hero */}
      <section id="esim-selector" className="relative -mt-[200px] z-20">
        <div className="container mx-auto px-4">
          <EsimSelector />
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
        <>
          <LogoRounded />
          <CompatibilitySection />
        </>
        {/* Customer Reviews */}
        <ReviewsSection />
      </BackgroundSection>

      {/* How To Section */}
      <HowToSection />

      {/* Unique Value Proposition */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[brand-light-blue]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[brand-dark] mb-6">
                  שקט נפשי אמיתי בחו״ל
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  עם Hiilo, אתם לא צריכים לחשוב על האינטרנט בכלל. גלישה ללא
                  הגבלה ביום, איפוס אוטומטי בחצות, ואפליקציות חיוניות תמיד
                  זמינות - גם כשנגמר הנפח.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[brand-green]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[brand-dark] mb-1">
                        גלישה יומית ללא הגבלה
                      </h4>
                      <p className="text-sm text-gray-600">
                        1GB מתחדש כל יום בחצות
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[brand-green]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[brand-dark] mb-1">
                        אפליקציות חיוניות תמיד זמינות
                      </h4>
                      <p className="text-sm text-gray-600">
                        WhatsApp, Waze ו-Google תמיד עובדים
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[brand-green]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[brand-dark] mb-1">
                        התקנה פשוטה
                      </h4>
                      <p className="text-sm text-gray-600">
                        תוך 2 דקות אתם מוכנים לטיסה
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="mt-8 bg-gradient-to-r from-[brand-green] to-[brand-green] hover:from-[brand-green] hover:to-[brand-green] text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  בחרו חבילה עכשיו
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </div>

              <div className="relative">
                <Card className="bg-gradient-to-br from-[brand-green] to-[brand-green] p-8 rounded-3xl text-white border-0 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="h-10 w-10" />
                    <h3 className="text-2xl font-bold">הבטחת שירות</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <span>החזר כספי מלא עד 24 שעות</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <span>תמיכה 24/7 בעברית</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <span>אחריות על איכות החיבור</span>
                    </div>
                  </div>
                </Card>

                {/* Decorative Element */}
                <div className="absolute -z-10 -top-4 -left-4 w-full h-full bg-gradient-to-br from-[brand-green]/20 to-[brand-purple]/20 rounded-3xl blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-[brand-dark] via-[brand-dark] to-[brand-dark] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[brand-green]/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[brand-purple]/30 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              מוכנים להתחיל?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-10">
              הצטרפו לאלפי ישראלים שכבר נהנים מחופש הגלישה בחו״ל
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-[brand-green] to-[brand-green] hover:from-[brand-green] hover:to-[brand-green] text-white font-bold px-12 py-8 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              קנו eSIM עכשיו
              <ArrowLeft className="mr-3 h-6 w-6" />
            </Button>

            <p className="mt-6 text-gray-400">
              ✓ ללא התחייבות ✓ החזר כספי מלא ✓ תמיכה 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[brand-dark] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-3xl font-bold">
                <span className="text-[brand-green]">Hiii</span>
                <span className="text-white">lo</span>
              </span>
              <p className="text-gray-400 mt-2">חופש הגלישה שלכם בחו״ל</p>
            </div>

            <div className="flex gap-8 text-sm">
              <Link
                href="/terms"
                className="hover:text-[brand-green] transition-colors"
              >
                תנאי שימוש
              </Link>
              <Link
                href="/privacy"
                className="hover:text-[brand-green] transition-colors"
              >
                מדיניות פרטיות
              </Link>
              <Link
                href="/contact"
                className="hover:text-[brand-green] transition-colors"
              >
                צור קשר
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2024 Hiilo. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
