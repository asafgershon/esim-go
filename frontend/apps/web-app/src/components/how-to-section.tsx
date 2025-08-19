"use client";

import { Button, useIsMobile } from "@workspace/ui";

interface Step {
  number: number;
  title: string;
}

interface StepItemProps {
  step: Step;
}

interface CTAButtonProps {
  scrollToElementId: string;
  label: string;
}

interface PhoneMockupProps {
  message: string;
}

interface TextContentProps {
  title: React.ReactNode;
  description: string;
  steps: Step[];
  isMobile: boolean;
}

const STEPS_DATA: Step[] = [
  {
    number: 1,
    title: "רוכשים",
  },
  {
    number: 2,
    title: "מתקינים בלחיצה",
  },
  {
    number: 3,
    title: "גולשים",
  },
];

function StepItem({ step }: StepItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-brand-green border-brand-dark border-1 rounded-full flex items-center justify-center">
        <span className="text-brand-dark font-bold text-lg">{step.number}</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">{step.title}</h3>
      </div>
    </div>
  );
}

function CTAButton({ scrollToElementId, label }: CTAButtonProps) {
  const handleClick = () => {
    const element = document.getElementById(scrollToElementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="mt-10 flex justify-start">
      <Button
        variant="brand-primary"
        emphasized
        className="w-[220px]"
        onClick={handleClick}
      >
        {label}
      </Button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-12 h-12 text-brand-green"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function PhoneMockup({ message }: PhoneMockupProps) {
  return (
    <div className="relative flex justify-center md:justify-end">
      <div className="relative">
        <div className="relative w-[200px] md:w-[320px] h-[400px] md:h-[640px]">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[30px] shadow-2xl">
            <div className="absolute inset-[8px] bg-gray-900 rounded-[22px] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-12 bg-black/50 flex items-center justify-center">
                <div className="w-20 h-6 bg-black rounded-full" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-brand-green/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <CheckIcon />
                  </div>
                  <p className="text-white text-lg font-semibold">{message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextContent({
  title,
  description,
  steps,
  isMobile,
}: TextContentProps) {
  return (
    <div className="text-white">
      <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-center">
        {title}
      </h2>

      <p className="text-lg text-gray-300 mb-10 leading-relaxed text-center">
        {description}
      </p>

      <div className="space-y-6">
        {steps.map((step) => (
          <StepItem key={step.number} step={step} />
        ))}
      </div>

      {!isMobile && (
        <CTAButton scrollToElementId="esim-selector" label="לרכישת Esim" />
      )}
    </div>
  );
}

export function HowToSection({
  id,
  ariaLabel,
}: {
  id: string;
  ariaLabel: string;
}) {
  const isMobile = useIsMobile();

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className="w-full relative overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <TextContent
              title={
                <>
                  3 צעדים פשוטים
                  <br />
                  והחבילה שלך מחוברת
                </>
              }
              description="פחות מדקה וה־eSIM כבר אצלך בטלפון. אפשר להתקין את ה־eSIM כבר מהבית, והוא יתחיל לפעול אוטומטית לאחר הנחיתה ביעד."
              steps={STEPS_DATA}
              isMobile={isMobile}
            />
            <PhoneMockup message="החבילה שלכם מוכנה לשימוש" />
          </div>
        </div>
      </div>
    </section>
  );
}
