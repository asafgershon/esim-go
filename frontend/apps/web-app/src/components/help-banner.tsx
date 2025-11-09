"use client";

import { Button, cn } from "@workspace/ui";

export const handleContactSupport = () => {
  const whatsappUrl = "https://wa.me/972XXXXXXXXX"; 
  window.open(whatsappUrl, "_blank");
};

export const handleInstagram = () => {
  const igUrl = "https://www.instagram.com/hiilo.world?igsh=ajJmMXowenI1ZjU3";
  window.open(igUrl, "_blank");
};

export function HelpBanner({
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
      className={cn(
        "rounded-[50px] max-w-3xl mx-auto flex flex-col items-center justify-center py-16 md:py-24 w-full px-4 relative z-10 bg-[url('/images/bgs/desktop-bottom.png')] bg-cover bg-center"
      )}
    >
      <div className="max-w-3xl text-center flex flex-col items-center justify-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          צריכים עזרה? דברו איתנו!
        </h2>

        <p className="text-lg md:text-xl text-white/90 mb-2">
          תחכמו לנו מכל מקום, בכל שעה - ונדאג
        </p>
        <p className="text-lg md:text-xl text-white/90 mb-2">
          שתישארו מחוברים.
        </p>
        <p className="text-lg md:text-xl text-[#2EE59D] font-medium mb-10">
          אתם, תתעסקו בלחופש.
        </p>

        {/* ✅ שני כפתורים זה ליד זה גם במובייל */}
        <div className="flex items-center gap-4 flex-row">
          
          {/* WhatsApp Button */}
          <Button
            size="lg"
            onClick={handleContactSupport}
            className="bg-brand-white text-brand-dark hover:bg-brand-white/90 font-semibold px-8 py-4 text-base rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            וואצאפ
            <svg
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path d="M17.415..." /> {/* אייקון וואצאפ המלא שנמצא בקוד שלך */}
            </svg>
          </Button>

          {/* Instagram Button */}
          <Button
            size="lg"
            onClick={handleInstagram}
            className="bg-brand-white text-brand-dark hover:bg-brand-white/90 font-semibold px-8 py-4 text-base rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            אינסטגרם
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M7 2C4.2 2 2 4.2 2 7v10..." /> {/* אייקון אינסטגרם SVG */}
            </svg>
          </Button>

        </div>
      </div>
    </section>
  );
}
