"use client";

import { Button, useMediaQuery } from "@workspace/ui";

export function HowToSection() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const steps = [
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

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-center">
                3 צעדים פשוטים
                <br />
                והחבילה שלך מחוברת
              </h2>

              <p className="text-lg text-gray-300 mb-10 leading-relaxed text-center">
                פחות מדקה וה־eSIM כבר אצלך בטלפון. אפשר להתקין את ה־eSIM כבר
                מהבית, והוא יתחיל לפעול אוטומטית לאחר הנחיתה ביעד.
              </p>

              {/* Steps */}
              <div className="space-y-6">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-center gap-4">
                    {/* Step number circle */}
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-green rounded-full flex items-center justify-center">
                      <span className="text-brand-dark font-bold text-lg">
                        {step.number}
                      </span>
                    </div>

                    {/* Step content */}
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
             {!isMobile && <div className="mt-10 flex justify-start">
                <Button
                  variant="primary-brand"
                  size="lg"
                  className="bg-[#535FC8] hover:bg-[#535FC8]/90 text-white w-[220px] border border-[#0A232E] outline-none"
                  onClick={() => {
                    const selector = document.getElementById("esim-selector");
                    if (selector) {
                      selector.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  לרכישת Esim
                </Button>
              </div>
              }
            </div>

            {/* Right side - Phone mockup */}
            <div className="relative flex justify-center md:justify-end">
              <div className="relative">
                {/* Phone frame */}
                <div className="relative w-[280px] md:w-[320px] h-[560px] md:h-[640px]">
                  {/* Phone border */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[30px] shadow-2xl">
                    {/* Screen area */}
                    <div className="absolute inset-[8px] bg-gray-900 rounded-[22px] overflow-hidden">
                      {/* Status bar */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-black/50 flex items-center justify-center">
                        <div className="w-20 h-6 bg-black rounded-full"></div>
                      </div>

                      {/* Screen content - you can add actual eSIM interface mockup here */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="w-24 h-24 bg-brand-green/20 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                          </div>
                          <p className="text-white text-lg font-semibold">
                            החבילה שלכם מוכנה לשימוש
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative gradient behind phone */}
                  <div className="absolute -z-10 inset-0 bg-gradient-to-br from-brand-green/30 to-brand-purple/30 blur-3xl transform scale-150"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
