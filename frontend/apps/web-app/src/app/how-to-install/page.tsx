"use client";

import { Header } from "@/components/header";
import { Footer, SmoothScrollHandle } from "@workspace/ui";
import { useRef } from "react";
import { useScrollTo } from "@workspace/ui";

export default function HowToInstallPage() {
  const scrollContainerRef = useRef<SmoothScrollHandle>(null);
  const { scrollTo } = useScrollTo({ scrollContainerRef });

  const handleFooterNavigation = (href: string) => {
    if (href.startsWith("#")) scrollTo(href);
    else window.location.href = href;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Header */}
      <Header scrollContainerRef={scrollContainerRef} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        {/* 1. Add eSIM */}
        <section>
          <h2 className="text-3xl font-bold mb-4">1. הוספת eSIM</h2>
          <p className="text-lg mb-6 leading-relaxed">
            בשלב זה תוסיפו קו נתונים חדש לטלפון באמצעות קוד ה־QR שקיבלתם.
            אם המצלמה לא מזהה את הקוד — ניתן להפעיל את ה־eSIM עם קוד ידני.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <img src="/images/esim/1_1.png" className="rounded-xl border" />
            <img src="/images/esim/1_2.png" className="rounded-xl border" />
            <img src="/images/esim/1_3.png" className="rounded-xl border" />
          </div>
        </section>

        {/* 2. Activate eSIM */}
        <section>
          <h2 className="text-3xl font-bold mb-4">2. הפעלת eSIM</h2>
          <p className="text-lg mb-6 leading-relaxed">
            כעת המכשיר יבקש לתת שם לתוכנית הנתונים. מומלץ לבחור שם כמו "Hiilo eSIM".
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <img src="/images/esim/2_1.png" className="rounded-xl border" />
            <img src="/images/esim/2_2.png" className="rounded-xl border" />
            <img src="/images/esim/2_3.png" className="rounded-xl border" />
          </div>
        </section>

        {/* 3. Default Lines */}
        <section>
          <h2 className="text-3xl font-bold mb-4">3. בחירת קווים כברירת מחדל</h2>
          <p className="text-lg mb-6 leading-relaxed">
            השאירו את השיחות וה־SMS על הקו הראשי, ובחרו את ה־eSIM עבור גלישה בלבד.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <img src="/images/esim/3_1.png" className="rounded-xl border" />
            <img src="/images/esim/3_2.png" className="rounded-xl border" />
            <img src="/images/esim/3_3.png" className="rounded-xl border" />
          </div>
        </section>

        {/* 4. Data Roaming */}
        <section>
          <h2 className="text-3xl font-bold mb-4">4. הפעלת נדידת נתונים</h2>
          <p className="text-lg mb-6 leading-relaxed">
            הפעילו Data Roaming על ה־eSIM החדש — וכבו אותו בקו הישראלי.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <img src="/images/esim/4_1.png" className="rounded-xl border" />
            <img src="/images/esim/4_2.png" className="rounded-xl border" />
          </div>
        </section>

        {/* 5. Internet is Live */}
        <section>
          <h2 className="text-3xl font-bold mb-4">התחברות לאינטרנט</h2>
          <p className="text-lg leading-relaxed">
            לאחר ההתקנה, המכשיר יתחבר אוטומטית. במקרים מסוימים זה עשוי לקחת עד 15 דקות —
            תלוי במפעיל המקומי. ברגע שתראו LTE / 5G — אתם מחוברים ויכולים להתחיל להשתמש.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer onNavigate={handleFooterNavigation} />
    </div>
  );
}
