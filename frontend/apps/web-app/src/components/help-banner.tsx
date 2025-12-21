"use client";

import { Button, cn } from "@workspace/ui";

export const handleContactSupport = () => {
  const whatsappUrl = "https://wa.me/972559965794"; 
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
    "relative rounded-[50px] max-w-3xl mx-auto overflow-hidden",
    "flex flex-col items-center justify-center",
    "py-16 md:py-24 w-full px-4"
  )}
>
  {/* 🔥 Background Image */}
<div
  className="
    absolute inset-0
    bg-[url('/images/logos/logo-green.png')]
    bg-no-repeat bg-center
    bg-cover
    opacity-10
  "
/>

  {/* ✅ Content */}
  <div className="relative z-10 max-w-3xl text-center flex flex-col items-center justify-center">
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
      צריכים עזרה? דברו איתנו!
    </h2>

    <p className="text-lg md:text-xl text-white/90 mb-2">
      תכתבו לנו מכל מקום, בכל שעה ונדאג
    </p>
    <p className="text-lg md:text-xl text-white/90 mb-2">
      שתישארו מחוברים.
    </p>
    <p className="text-lg md:text-xl text-brand-green font-medium mb-10">
      אתם, תתעסקו בלחופש.
    </p>

    {/* Buttons */}
    <div className="flex items-center gap-4 flex-row">
      {/* WhatsApp */}
      <Button
        size="lg"
        onClick={handleContactSupport}
        className="
          bg-white text-brand-dark
          hover:bg-white/90
          font-semibold px-8 py-4
          rounded-full shadow-xl
          hover:shadow-2xl hover:scale-105 transition-all
          inline-flex items-center gap-2
        "
      >
        לשליחת הודעה
        {/* icon */}
      </Button>

      {/* Instagram */}
      <Button
        size="lg"
        onClick={handleInstagram}
        className="
          bg-white text-brand-dark
          hover:bg-white/90
          font-semibold px-8 py-4
          rounded-full shadow-xl
          hover:shadow-2xl hover:scale-105 transition-all
          inline-flex items-center gap-2
        "
      >
        אינסטגרם
        {/* icon */}
      </Button>
    </div>
  </div>
</section>
  );
}
