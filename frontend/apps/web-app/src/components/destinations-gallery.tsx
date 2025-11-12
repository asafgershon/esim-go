"use client";

import {
  useSelectorQueryState,
  type ActiveTab,
} from "@/hooks/useSelectorQueryState";
import { CALCULATE_DESTINATION_PRICES } from "@/lib/graphql/pricing";
import { useQuery } from "@apollo/client";
import { Card, useHorizontalScroll } from "@workspace/ui";
import { useMemo } from "react";
import { ImageWithFallback } from "./image-with-fallback";
import { PromoBanner } from "./promo-banner";

// ✅ מספר ימים "הגיוניים" לכל יעד
const reasonableDaysByIso: Record<string, number> = {
  IT: 5,
  US: 10,
  GR: 7,
  TH: 14,
  AE: 5,
  BR: 12,
  CA: 10,
  CN: 10,
};

interface Destination {
  id: string;
  name: string;
  nameHebrew: string;
  countryIso: string;
  image: string;
}

const destinations: Destination[] = [
  { id: "rome", name: "Rome", nameHebrew: "רומא", countryIso: "IT", image: "/images/destinations/italy.webp" },
  { id: "usa", name: "USA", nameHebrew: "ארצות הברית", countryIso: "US", image: "/images/destinations/america.webp" },
  { id: "greece", name: "Greece", nameHebrew: "יוון", countryIso: "GR", image: "/images/destinations/greec.webp" },
  { id: "thailand", name: "Thailand", nameHebrew: "תאילנד", countryIso: "TH", image: "/images/destinations/thailand.webp" },
  { id: "dubai", name: "Dubai", nameHebrew: "דובאי", countryIso: "AE", image: "/images/destinations/dubai.webp" },
  { id: "brazil", name: "Brazil", nameHebrew: "ברזיל", countryIso: "BR", image: "/images/destinations/brazil.webp" },
  { id: "canada", name: "Canada", nameHebrew: "קנדה", countryIso: "CA", image: "/images/destinations/canada.webp" },
  { id: "china", name: "China", nameHebrew: "סין", countryIso: "CN", image: "/images/destinations/china.webp" },
];

export function DestinationsGallery({
  id,
  ariaLabel,
  speed,
}: {
  id: string;
  ariaLabel: string;
  speed?: string;
}) {
  const { setQueryStates } = useSelectorQueryState();

  const { containerRef, contentRef, progressRef } = useHorizontalScroll({
    progressColor: "#535FC8",
    progressTrackColor: "rgba(83, 95, 200, 0.2)",
  });

  // Execute dummy query (kept for structure compatibility)
  const pricingInputs = useMemo(() => {
    return destinations.map((dest) => ({
      countryId: dest.countryIso,
      numOfDays: 1,
    }));
  }, []);

  useQuery(CALCULATE_DESTINATION_PRICES, {
    variables: { inputs: pricingInputs },
    skip: true, // ❌ לא מבצעים קריאת מחיר
  });

  return (
    <section
      data-speed={speed}
      id={id}
      aria-label={ariaLabel}
      className="overflow-hidden"
    >
      <div className="container mx-auto px-4 max-w-[1440px] md:pt-4">
        {/* ✅ Header בעיצוב שביקשת */}
        <div className="text-right mb-12 max-w-4xl mx-auto">
          <h2 className="font-birzia font-bold text-[2rem] leading-[2.125rem] tracking-[-0.01em] text-[#0A232E] mb-4">
            הטכנולוגיה שלנו מאפשרת גלישה ללא הגבלה, במחירים המשתלמים ביותר,
            במעל <span className="text-[#535FC8]">150 </span>מדינות!
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-birzia mb-2">
            המערכת של Hiilo סורקת בזמן אמת את כל המחירים אצל הספקים במדינות השונות,
            ומביאה לכם רק את חבילת ה-ESIM המשתלמת ביותר – ללא הגבלת נפח גלישה!
          </p>

          {/* ✅ תוספת של טקסט ההנחה */}
          <p className="text-[#535FC8] font-birzia font-semibold text-lg mt-3">
            🌍 10% הנחה ליעדים נבחרים השבוע!
          </p>
        </div>

        {/* ✅ קרוסלת יעדים */}
        <div
          ref={containerRef}
          className="relative overflow-y-visible mx-auto mt-10"
          style={{ height: "304px", maxWidth: "100%", position: "relative" }}
        >
          <div
            ref={contentRef}
            className="flex gap-6 px-4 absolute top-0 left-0"
            style={{
              cursor: "grab",
              userSelect: "none",
              WebkitUserSelect: "none",
              willChange: "transform",
              touchAction: "pan-y",
              overflowX: "visible",
            }}
          >
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="flex-shrink-0"
                style={{ width: "256px" }}
              >
                <DestinationCard
                  destination={destination}
                  onSelect={setQueryStates}
                />
              </div>
            ))}
          </div>
        </div>

        {/* פס התקדמות מובייל */}
        <div
          className="relative mx-auto mt-6"
          style={{
            height: "4px",
            width: "200px",
            backgroundColor: "rgba(83, 95, 200, 0.2)",
            borderRadius: "2px",
          }}
        >
          <div
            ref={progressRef}
            className="absolute top-0 left-0 h-full"
            style={{
              width: "100%",
              backgroundColor: "#535FC8",
              borderRadius: "2px",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>

      <PromoBanner />
    </section>
  );
}

interface DestinationCardProps {
  destination: Destination;
  onSelect: (values: {
    countryId: string;
    activeTab: ActiveTab;
    numOfDays: number;
  }) => void;
}

function DestinationCard({ destination, onSelect }: DestinationCardProps) {
  const fallbackImage = "/images/destinations/default.png";

  const days = reasonableDaysByIso[destination.countryIso] || 7;
  const couponCode = `${destination.name.toLowerCase()}${days}`;

  const handleClick = () => {
    onSelect({
      countryId: destination.countryIso.toLowerCase(),
      activeTab: "countries",
      numOfDays: days,
    });

    const selectorElement = document.getElementById("esim-selector");
    if (selectorElement) {
      selectorElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Card
      onClick={handleClick}
      className="relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group p-0"
      size={null}
    >
      <div className="relative h-64 md:h-72 w-full">
        {/* תמונה */}
        <ImageWithFallback
          src={destination.image}
          fallbackSrc={fallbackImage}
          alt={`${destination.name} destination`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* שכבת כהות */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* שם המדינה + קוד קופון */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h4 className="text-2xl font-bold mb-2 font-birzia">
            {destination.nameHebrew}
          </h4>

          <div className="inline-flex items-center bg-white/90 backdrop-blur-sm text-[#0A232E] px-3 py-1 rounded-full text-sm font-semibold">
            קוד קופון: {couponCode}
          </div>
        </div>
      </div>
    </Card>
  );
}
