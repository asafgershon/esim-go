"use client";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { EsimSelectorNew } from "@/components/esim-selector-new";
import { LoginModalWrapper } from "@/components/login-modal-wrapper";
import { Button, Card } from "@workspace/ui";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  ArrowLeft,
  Check,
  Globe,
  Headphones,
  MapPin,
  Shield,
  Smartphone,
  Wifi,
  Zap,
  Clock,
  CreditCard,
  Download,
  ScanLine
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useQueryState(
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
      {showLogin && (
        <LoginModalWrapper onLoginSuccess={handleLoginSuccess} />
      )}
      
      {/* Announcement Banner */}
      <AnnouncementBanner />
      
      {/* Navigation Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* eSIM Selector Section - Overlapping Hero */}
      <section id="esim-selector" className="relative -mt-[200px] z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <EsimSelectorNew />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-6">
            נתמך על ידי 700+ רשתות סלולר ברחבי העולם
          </p>
          <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap opacity-60">
            <span className="text-xl md:text-2xl font-semibold text-gray-400">Verizon</span>
            <span className="text-xl md:text-2xl font-semibold text-gray-400">Orange</span>
            <span className="text-xl md:text-2xl font-semibold text-gray-400">Vodafone</span>
            <span className="text-xl md:text-2xl font-semibold text-gray-400">T-Mobile</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[brand-light-blue]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Benefit 1 */}
            <Card className="p-8 text-center border-0 shadow-xl bg-white rounded-2xl hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-br from-[brand-green]/20 to-[brand-green]/10 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Globe className="h-10 w-10 text-[brand-green]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[brand-dark]">עד 50 יעדים במנוי אחד</h3>
              <p className="text-gray-600 leading-relaxed">
                חבילה אחת לכל היעדים שלכם - פשוט, נוח וחסכוני
              </p>
            </Card>

            {/* Benefit 2 */}
            <Card className="p-8 text-center border-0 shadow-xl bg-white rounded-2xl hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-br from-[brand-purple]/20 to-[brand-purple]/10 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-10 w-10 text-[brand-purple]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[brand-dark]">חסכו בעלויות נדידה</h3>
              <p className="text-gray-600 leading-relaxed">
                עד 90% חיסכון לעומת חבילות נדידה רגילות
              </p>
            </Card>

            {/* Benefit 3 */}
            <Card className="p-8 text-center border-0 shadow-xl bg-white rounded-2xl hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-br from-[brand-green]/20 to-[brand-green]/10 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Headphones className="h-10 w-10 text-[brand-green]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[brand-dark]">תמיכה 24/7</h3>
              <p className="text-gray-600 leading-relaxed">
                צוות תמיכה ישראלי זמין בכל שעה ובכל מקום
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section - Dark Theme */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-[brand-dark] to-[brand-dark] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[brand-green]/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[brand-purple]/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              נתונים שמדברים בעד עצמם
            </h2>
            <p className="text-xl text-gray-300">
              אלפי ישראלים כבר נהנים מחופש הגלישה שלנו
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-[brand-green] mb-2">100K+</div>
              <p className="text-lg text-gray-300">חבילות נמכרו</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-[brand-green] mb-2">4.9/5</div>
              <p className="text-lg text-gray-300">דירוג ממוצע</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-[brand-green] mb-2">190+</div>
              <p className="text-lg text-gray-300">מדינות זמינות</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-[brand-dark] mb-4">
              איך זה עובד?
            </h2>
            <p className="text-xl text-gray-600">
              4 צעדים פשוטים לחיבור מושלם
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <Card className="p-6 border-2 border-gray-100 hover:border-[brand-green] transition-colors rounded-2xl">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[brand-green] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="mb-4">
                  <MapPin className="h-8 w-8 text-[brand-green]" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-[brand-dark]">בחרו יעד</h4>
                <p className="text-sm text-gray-600">
                  בחרו את המדינה או האזור לטיול שלכם
                </p>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <Card className="p-6 border-2 border-gray-100 hover:border-[brand-green] transition-colors rounded-2xl">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[brand-green] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="mb-4">
                  <CreditCard className="h-8 w-8 text-[brand-green]" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-[brand-dark]">רכשו חבילה</h4>
                <p className="text-sm text-gray-600">
                  תשלום מאובטח ומהיר בכרטיס אשראי
                </p>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <Card className="p-6 border-2 border-gray-100 hover:border-[brand-green] transition-colors rounded-2xl">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[brand-green] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="mb-4">
                  <Download className="h-8 w-8 text-[brand-green]" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-[brand-dark]">התקינו</h4>
                <p className="text-sm text-gray-600">
                  סרקו QR או התקינו ישירות במכשיר
                </p>
              </Card>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <Card className="p-6 border-2 border-gray-100 hover:border-[brand-green] transition-colors rounded-2xl">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[brand-green] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div className="mb-4">
                  <Wifi className="h-8 w-8 text-[brand-green]" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-[brand-dark]">גלשו</h4>
                <p className="text-sm text-gray-600">
                  נחתתם? אתם מחוברים אוטומטית!
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

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
                  עם Hiilo, אתם לא צריכים לחשוב על האינטרנט בכלל. 
                  גלישה ללא הגבלה ביום, איפוס אוטומטי בחצות, 
                  ואפליקציות חיוניות תמיד זמינות - גם כשנגמר הנפח.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[brand-green]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[brand-dark] mb-1">גלישה יומית ללא הגבלה</h4>
                      <p className="text-sm text-gray-600">1GB מתחדש כל יום בחצות</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[brand-green]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[brand-dark] mb-1">אפליקציות חיוניות תמיד זמינות</h4>
                      <p className="text-sm text-gray-600">WhatsApp, Waze ו-Google תמיד עובדים</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[brand-green]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[brand-dark] mb-1">התקנה פשוטה</h4>
                      <p className="text-sm text-gray-600">תוך 2 דקות אתם מוכנים לטיסה</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="mt-8 bg-gradient-to-r from-[brand-green] to-[brand-green] hover:from-[brand-green] hover:to-[brand-green] text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-[brand-dark] mb-4">
              לקוחות מרוצים מספרים
            </h2>
            <p className="text-xl text-gray-600">
              אלפי ישראלים כבר נהנים מהשירות שלנו
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl bg-gradient-to-b from-white to-gray-50">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-2xl text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "הייתי בטיול של 3 שבועות באירופה. ה-eSIM עבד מושלם בכל מדינה. 
                החיסכון היה משמעותי והשירות מעולה!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[brand-green] to-[brand-purple] rounded-full"></div>
                <div>
                  <p className="font-bold text-[brand-dark]">יעל כהן</p>
                  <p className="text-sm text-gray-500">טיול באירופה</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 2 */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl bg-gradient-to-b from-white to-gray-50">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-2xl text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "התקנה פשוטה ומהירה. תוך 2 דקות הייתי מחובר. 
                התמיכה בעברית עזרה לי מאוד כשהיתה לי שאלה."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[brand-purple] to-[brand-green] rounded-full"></div>
                <div>
                  <p className="font-bold text-[brand-dark]">דוד לוי</p>
                  <p className="text-sm text-gray-500">טיול בארה״ב</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 3 */}
            <Card className="p-8 border-0 shadow-xl rounded-2xl bg-gradient-to-b from-white to-gray-50">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-2xl text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "סוף סוף פתרון שעובד! אין יותר חיפוש אחר WiFi או דאגה מחשבונות מנופחים. 
                ממליצה בחום!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[brand-green] to-[brand-green] rounded-full"></div>
                <div>
                  <p className="font-bold text-[brand-dark]">מיכל ברק</p>
                  <p className="text-sm text-gray-500">טיול בתאילנד</p>
                </div>
              </div>
            </Card>
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <Link href="/terms" className="hover:text-[brand-green] transition-colors">
                תנאי שימוש
              </Link>
              <Link href="/privacy" className="hover:text-[brand-green] transition-colors">
                מדיניות פרטיות
              </Link>
              <Link href="/contact" className="hover:text-[brand-green] transition-colors">
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