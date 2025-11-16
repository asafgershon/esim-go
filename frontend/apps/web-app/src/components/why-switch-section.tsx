"use client";

import Image from "next/image";

export function WhySwitchSection({
  id,
  ariaLabel,
}: {
  id: string;
  ariaLabel: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className="pt-12 md:pt-20 pb-4" // רווח תחתון קטן כדי להצמיד ל־QASection
    >
      {/* 🔥 Full-Width Image */}
      <div className="w-full">
        <Image
          src="/images/logos/logo-green.png"
          alt="eSIM Card Illustration"
          width={1920}
          height={1080}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* 🔥 Text Content container */}
      <div className="container mx-auto px-4 mt-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-6 text-center md:text-right">
            למה כל כך מסובך
            <br />
            להתחבר לאינטרנט בחו״ל?
          </h2>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed text-center md:text-right">
            חבילות מגבילות, נפחי גלישה שלא מספיקים, טפסים, הטענות, אותיות קטנות –
            רוב הפתרונות הקיימים פשוט לא נבנו מתוך מחשבה על המשתמש.
          </p>

          <div className="text-lg md:text-xl text-center md:text-right">
            <h3 className="text-xl font-bold text-brand-dark">
              אנחנו החלטנו לשנות את זה.
            </h3>
            <p className="text-gray-600 leading-relaxed">
              הרי למי יש היום חבילה ״מוגבלת״ או כזאת שצריך ״להטעין״ אותה באמצע
              החודש... אז בטח שאין סיבה שתתעסקו עם זה בחופש שלכם.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
