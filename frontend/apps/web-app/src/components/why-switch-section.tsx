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
    <section id={id} aria-label={ariaLabel} className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 items-center">
            {/* SIM Card Graphic - appears second on mobile, first on desktop */}
            <div className="flex justify-center md:justify-start order-2 md:order-1">
              <Image
                src="/images/logos/logo-green.png"
                alt="eSIM Card Illustration"
                width={360}
                height={280}
                className="object-contain"
                priority
              />
            </div>

            {/* Text content - appears first on mobile, second on desktop */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-6 text-center md:text-right">
                למה כל כך מסובך
                <br />
                להתחבר לאינטרנט בחו״ל?
              </h2>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed text-center md:text-right">
                חבילות מגבילות, נפחי גלישה שלא מספיקים, טפסים, הטענות, אותיות
                קטנות - רוב הפתרונות הקיימים פשוט לא נבנו מתוך מחשבה על המשתמש.
              </p>

              <div className="text-lg md:text-xl text-center md:text-right">
                <h3 className="text-xl font-bold text-brand-dark">
                  אנחנו החלטנו לשנות את זה.
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  הרי למי יש היום חבילה ״מוגבלת״ או כזאת שצריך ״להטעין״ אותה
                  באמצע החודש..  אז בטח שאין סיבה שתתעסקו עם זה בחופש שלכם.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
