"use client";

export function PromoBanner() {
  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="
            bg-brand-dark 
            rounded-2xl md:rounded-3xl 
            py-4 md:py-5 
            px-6 md:px-8 
            text-center
          ">
            <p className="
              text-white 
              text-sm md:text-base lg:text-lg
              font-birzia
              leading-relaxed
            ">
              <span>אנחנו מאמינים שאינטרנט, גם בחו״ל, צריך להיות פשוט וזמין ללא הגבלה כדי שאתם</span>
              {" "}
              <span className="text-brand-green font-semibold">תוכלו להתעסק בלהנות.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}