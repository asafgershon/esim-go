"use client";

import { Button, cn, useESIMDetection } from "@workspace/ui";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

export function CompatibilitySection({
  id,
  ariaLabel,
  className,
}: {
  id: string;
  className?: string;
  ariaLabel: string;
}) {
  // Use the eSIM detection hook with manual start
  const { isSupported, loading, start, deviceInfo } = useESIMDetection({
    autoStart: false,
    enableCanvasFingerprint: false,
    enableWebGLDetection: true,
    confidenceThreshold: 0.5,
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
        className: "",
        deviceName: null,
      };
    }

    if (loading) {
      return {
        text: "בודק...",
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        variant: "brand-primary" as const,
        emphasized: false,
        className: "opacity-70 cursor-not-allowed",
        deviceName: null,
      };
    }

    const rawDeviceName = hasStarted && deviceInfo ? deviceInfo.deviceName : null;
    const deviceName = rawDeviceName === "" ? null : rawDeviceName;

    if (isSupported) {
      return {
        text: deviceName ? `${deviceName} תומך` : "המכשיר תומך",
        icon: <Check className="w-5 h-5" />,
        variant: "brand-success" as const,
        emphasized: true,
        className: "",
        deviceName,
      };
    }

    return {
      text: deviceName ? `${deviceName} לא תומך` : "המכשיר לא תומך",
      icon: <X className="w-5 h-5" />,
      variant: "destructive" as const,
      emphasized: false,
      className: "",
      deviceName,
    };
  };

  const buttonState = getButtonState();

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "relative isolate z-10 flex flex-col md:flex-row-reverse w-full",
        className
      )}
    >
      {/* Text container - Desktop */}
      <div className="hidden md:flex flex-col items-center mt-8 gap-4 w-full">
        {/* Highlight */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white" dir="rtl">
            כן, כנראה שהמכשיר שלך תומך..
          </h2>
        </div>

        {/* Text */}
        <div className="text-center max-w-2xl px-4">
          <p className="text-lg text-white/90" dir="rtl">
            רוב המכשירים בישראל תומכים ב־eSIM. לבדיקה ודאית לגבי המכשיר שברשותכם
            לחצו כאן ובדקו תוך שניות אם אתם מוכנים לגלישה.
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
          {/* Device info */}
          {buttonState.deviceName && hasStarted && !loading && (
            <div className="mt-2 text-center">
              <p className="text-sm text-white/70" dir="rtl">
                מכשיר זוהה: {buttonState.deviceName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Text container - Mobile */}
      <div className="flex md:hidden flex-col items-center mt-6 gap-3 w-full px-6 relative z-30">
        {/* Highlight */}
        <div className="text-center relative z-30 rounded-lg p-4 w-full">
          <h2 className="text-2xl font-bold text-white" dir="rtl">
            כן, כנראה שהמכשיר שלך תומך..
          </h2>
        </div>

        {/* Text */}
        <div className="text-center max-w-sm px-4 relative z-30">
          <p className="text-base text-white/90" dir="rtl">
            רוב המכשירים בישראל תומכים ב־eSIM. לבדיקה ודאית לגבי המכשיר שברשותכם
            לחצו כאן ובדקו תוך שניות אם אתם מוכנים לגלישה.
          </p>
        </div>

        {/* Check Button */}
        <div className="mt-3 relative z-30">
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
          {/* Device info */}
          {buttonState.deviceName && hasStarted && !loading && (
            <div className="mt-2 text-center">
              <p className="text-sm text-white/70" dir="rtl">
                מכשיר זוהה: {buttonState.deviceName}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
