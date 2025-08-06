"use client";

import { Button, useESIMDetection } from "@workspace/ui";
import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";

export function CompatibilitySection() {
  // Use the eSIM detection hook with manual start
  const { isSupported, loading, start } = useESIMDetection({
    autoStart: false,
    enableCanvasFingerprint: true,
    enableWebGLDetection: true,
    confidenceThreshold: 0.5
  });

  // Track if detection has been started
  const [hasStarted, setHasStarted] = useState(false);

  const handleDetection = () => {
    if (!loading) {
      setHasStarted(true);
      start();
    }
  };

  const getButtonState = () => {
    if (!hasStarted) {
      return {
        text: "לחצו לבדיקה",
        icon: null,
        variant: "brand-primary" as const,
        emphasized: true,
        className: ""
      };
    }
    
    if (loading) {
      return {
        text: "בודק...",
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        variant: "brand-primary" as const,
        emphasized: false,
        className: "opacity-70 cursor-not-allowed"
      };
    }
    
    if (isSupported) {
      return {
        text: "המכשיר תומך",
        icon: <Check className="w-5 h-5" />,
        variant: "brand-success" as const,
        emphasized: true,
        className: ""
      };
    }
    
    return {
      text: "המכשיר לא תומך",
      icon: <X className="w-5 h-5" />,
      variant: "destructive" as const,
      emphasized: false,
      className: ""
    };
  };

  const buttonState = getButtonState();

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
            variant={buttonState.variant}
            emphasized={buttonState.emphasized}
            className={`w-[220px] ${buttonState.className}`}
            onClick={handleDetection}
            disabled={loading}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{buttonState.text}</span>
              {buttonState.icon}
            </div>
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
            variant={buttonState.variant}
            emphasized={buttonState.emphasized}
            className={`w-[220px] ${buttonState.className}`}
            onClick={handleDetection}
            disabled={loading}
          >
            <div className="flex items-center justify-center gap-2">
              {buttonState.icon}
              <span>{buttonState.text}</span>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
}