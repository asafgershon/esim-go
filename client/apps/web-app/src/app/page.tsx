"use client";

import { EsimExperienceSelector } from "@/components/esim-experience-selector";
import { EsimSkeleton } from "@/components/esim-skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { EnhancedLoginModal } from "@/components/enhanced-login-modal";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card } from "@workspace/ui";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  ArrowUp,
  Check,
  Globe,
  LogOut,
  Shield,
  Smartphone,
  User as UserIcon,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  console.log(
    "isAuthenticated",
    isAuthenticated,
    "isLoading",
    isLoading,
    "user",
    user
  );
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-primary font-extrabold">Hiii</span>
              <span className="text-foreground font-medium">lo</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoading ? null : isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Avatar className="cursor-pointer">
                    {/* If you have a user image, use <AvatarImage src={user.imageUrl} /> */}
                    <AvatarFallback>
                      <UserIcon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <span className="text-sm font-medium text-foreground font-hebrew">
                  אזור אישי
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={signOut}
                  title="Logout"
                  className="ml-1"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <EnhancedLoginModal redirectTo="/profile" />
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with eSIM Selector */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 tracking-tight font-hebrew">
            חיבור אינסופי ושקט נפשי
            <span className="block text-primary mt-2">
              אינטרנט ללא הגבלה בחו״ל
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-hebrew">
            נגמר לכם ה-1GB היומי? אל דאגה, בחצות הוא מתאפס!
            <br />
            <strong className="text-foreground">
              ועד אז תקבלו מאיתנו אינטרנט חינם
            </strong>{" "}
            ל-WhatsApp, Waze, Google News
          </p>
        </div>

        {/* eSIM Selector - Centered */}
        <div id="esim-selector" className="flex justify-center mb-16">
          <Suspense fallback={<EsimSkeleton />}>
            <EsimExperienceSelector />
          </Suspense>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          {/* Trust Indicators */}
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground mb-4">
              מבוסס על 700+ רשתות סלולר ברחבי העולם
            </p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-muted-foreground">
                Verizon
              </div>
              <div className="text-2xl font-bold text-muted-foreground">
                Orange
              </div>
              <div className="text-2xl font-bold text-muted-foreground">
                Vodafone
              </div>
              <div className="text-2xl font-bold text-muted-foreground">
                T-Mobile
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="p-8 text-center border-0 shadow-lg bg-card">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">חיבור ללא הפסקה</h3>
              <p className="text-muted-foreground leading-relaxed">
                נגמר ה-1GB? אל דאגה! בחצות הוא מתאפס + אינטרנט חינם לאפליקציות
                חיוניות
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg bg-card">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-6">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                מותאם בדיוק לצרכים שלך
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                חבילה רק לזמן הטיול – חסכוני ומדויק, בלי התחייבויות מיותרות
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg bg-card">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">פשוט ונטול דאגות</h3>
              <p className="text-muted-foreground leading-relaxed">
                שגר ושכח – הכל אוטומטי מהרכישה ועד החזרה, בלי הטענות או שדרוגים
              </p>
            </Card>
          </div>

          {/* Value Propositions */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                הגעתם ליעד? אתם כבר מחוברים!
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                שמתם לב שהאינטרנט נגמר באמצע הדרך? שכחתם להטעין? אל דאגה! עם
                Hiiilo אתם מקבלים גישה חינמית לאפליקציות החיוניות - WhatsApp,
                Waze, Google News וכל מה שחשוב לכם.
              </p>
              <p className="text-foreground font-semibold mb-4">
                <strong>אינטרנט שלא נגמר אף פעם.</strong> כי החופש האמיתי זה לא
                לחשוב על האינטרנט בכלל.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>איפוס יומי אוטומטי בחצות</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>אינטרנט חינם לאפליקציות חיוניות</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>פעיל ב-190+ מדינות</span>
                </div>
              </div>
            </div>
            <Card className="bg-primary rounded-2xl p-8 text-primary-foreground border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8" />
                <h3 className="text-2xl font-bold">תמיכה 24/7 בעברית</h3>
              </div>
              <p className="text-primary-foreground/90 leading-relaxed">
                יש בעיה? אנחנו כאן! תמיכה מלאה בעברית ואנגלית, 24 שעות ביממה. כי
                כשאתם רחוק מהבית, אנחנו הבית שלכם באינטרנט.
              </p>
            </Card>
          </div>

          {/* Testimonials */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">
              לא רוצים לספר, אבל... הלקוחות שלנו מאוהבים 💌
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-0 shadow-lg bg-card">
                <div className="text-primary mb-4 text-xl">★★★★★</div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &quot;נחתתי באמסטרדם וכבר הייתי מחוברת! אף פעם לא הרגשתי כל כך
                  חופשיה בטיול. התמיכה בעברית באמצע הלילה? פשוט מושלם!&quot;
                </p>
                <p className="font-bold text-foreground">— שרה כ.</p>
              </Card>

              <Card className="p-8 border-0 shadow-lg bg-card">
                <div className="text-primary mb-4 text-xl">★★★★★</div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &quot;הילדים שלי הכירו דרך בברלין עם Waze למרות שהאינטרנט
                  נגמר. בחצות הכל התאפס אוטומטי. זה פשוט גאוני!&quot;
                </p>
                <p className="font-bold text-foreground">— אבי מ.</p>
              </Card>

              <Card className="p-8 border-0 shadow-lg bg-card">
                <div className="text-primary mb-4 text-xl">★★★★★</div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &quot;שגר ושכח באמת! הזמנתי, נסעתי, נהניתי. בלי הטענות, בלי
                  קומבינות. השירות הכי נקי שפגשתי.&quot;
                </p>
                <p className="font-bold text-foreground">— דני ל.</p>
              </Card>
            </div>
          </div>

          {/* Final CTA */}
          <Card className="bg-card border-0 shadow-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-card-foreground mb-6">
              אל תפספסו את החופש האמיתי! 🚀
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              הזמינו עכשיו וטיילו בראש שקט - מדיניות החזרה הטובה ביותר, בלי
              התחייבויות
            </p>
            <Button
              size="lg"
              className="px-8 py-3 text-lg flex items-center justify-center"
              onClick={() => {
                document.getElementById("esim-selector")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              יאללה, בואו נתחיל!
              <ArrowUp className="mr-2 h-5 w-5" />
            </Button>
          </Card>
        </div>
      </main>


      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 Hiiilo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
