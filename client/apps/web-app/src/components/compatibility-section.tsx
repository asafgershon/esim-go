"use client";

import { Button } from "@workspace/ui";

export function CompatibilitySection() {
  return (
    <>
      {/* Text container - Desktop */}
      <div className="hidden md:flex flex-col items-center mt-8 gap-4">
        {/* Highlight */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white" dir="rtl">
            כן, כנראה שהמכשיר שלך תומך..
          </h2>
        </div>

        {/* Text */}
        <div className="text-center max-w-2xl px-4">
          <p className="text-lg text-white/90" dir="rtl">
            רוב המכשירים בישראל תומכים ב־eSIM. לבדיקה ודאית לגבי המכשיר
            שברשותכם לחצו כאן ובדקו תוך שניות אם אתם מוכנים לגלישה.
          </p>
        </div>

        {/* Check Button */}
        <div className="mt-4">
          <Button
            variant="primary-brand"
            size="lg"
            className="bg-[#535FC8] hover:bg-[#535FC8]/90 text-white w-[220px] border border-[#0A232E] outline-none shadow-none"
          >
            לחצו לבדיקה
          </Button>
        </div>
      </div>

      {/* Text container - Mobile */}
      <div className="flex md:hidden flex-col items-center mt-6 gap-3">
        {/* Highlight */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white" dir="rtl">
            כן, כנראה שהמכשיר שלך תומך..
          </h2>
        </div>

        {/* Text */}
        <div className="text-center max-w-sm px-4">
          <p className="text-base text-white/90" dir="rtl">
            רוב המכשירים בישראל תומכים ב־eSIM. לבדיקה ודאית לגבי המכשיר
            שברשותכם לחצו כאן ובדקו תוך שניות אם אתם מוכנים לגלישה.
          </p>
        </div>

        {/* Check Button */}
        <div className="mt-3">
          <Button
            variant="primary-brand"
            size="lg"
            className="bg-[#535FC8] hover:bg-[#535FC8]/90 text-white w-[220px] border border-[#0A232E] outline-none shadow-none"
          >
            לחצו לבדיקה
          </Button>
        </div>
      </div>
    </>
  );
}