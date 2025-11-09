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
    לשליחת הודעה
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.415 14.382C17.117 14.233 15.656 13.515 15.384 13.415C15.112 13.316 14.914 13.267 14.715 13.565C14.517 13.862 13.948 14.531 13.775 14.729C13.601 14.928 13.428 14.952 13.13 14.803C12.832 14.654 11.874 14.341 10.739 13.328C9.858 12.54 9.259 11.567 9.086 11.269C8.913 10.971 9.068 10.811 9.217 10.663C9.35 10.53 9.513 10.316 9.662 10.142C9.812 9.97 9.861 9.846 9.96 9.647C10.06 9.449 10.01 9.275 9.936 9.126C9.861 8.978 9.265 7.515 9.017 6.92C8.776 6.341 8.53 6.419 8.352 6.41L7.782 6.4C7.584 6.4 7.262 6.474 6.99 6.772C6.718 7.07 5.95 7.788 5.95 9.251C5.95 10.714 7.015 12.127 7.164 12.325C7.313 12.524 9.256 15.557 12.299 16.869C13.011 17.184 13.569 17.372 14.004 17.511C14.714 17.747 15.362 17.714 15.873 17.638C16.441 17.554 17.564 16.894 17.812 16.175C18.061 15.456 18.061 14.836 17.986 14.712C17.911 14.588 17.713 14.531 17.415 14.382ZM12.05 21.785H12.046C10.265 21.785 8.516 21.309 6.993 20.407L6.63 20.193L2.867 21.175L3.871 17.527L3.636 17.153C2.639 15.578 2.115 13.758 2.117 11.893C2.119 6.443 6.6 2 12.054 2C14.7 2.001 17.178 3.027 19.025 4.865C20.872 6.703 21.932 9.169 21.931 11.801C21.929 17.251 17.448 21.785 12.05 21.785ZM20.464 3.434C18.234 1.21 15.241 0.002 12.047 0C5.464 0 0.102 5.335 0.1 11.892C0.099 13.988 0.648 16.034 1.687 17.837L0 24L6.335 22.346C8.062 23.296 10.021 23.795 12.017 23.796H12.021C18.604 23.796 23.966 18.46 23.968 11.904C23.969 8.724 22.727 5.738 20.497 3.514L20.464 3.434Z"
        fill="currentColor"
      />
    </svg>
  </Button>

  {/* Instagram */}
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
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6.5 1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 20a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
  </Button>
</div>
      </div>
    </section>
  );
}
