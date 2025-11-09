"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, useHorizontalScroll } from "@workspace/ui";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSelectorQueryState, type ActiveTab } from "@/hooks/useSelectorQueryState";
import { getFlagUrl } from "@/utils/flags";

// ✅ שימוש בפונקציה מהשרת (simple-pricer)
import { calculateSimplePrice } from "../../../../../backend/packages/rules-engine-2/src/simple-pricer/simple-pricer";

type DealPrice = {
  finalPrice: number;
  currency: string;
  externalId?: string;
};

interface Destination {
  id: string;
  name: string;
  nameHebrew: string;
  countryIso: string;
  image: string;
}

// ✅ רשימת יעדים
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

// ✅ ימים "הגיוניים"
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

const DISCOUNT_USD = 2;

export function DestinationsDealsPage() {
  const { containerRef, contentRef, progressRef } = useHorizontalScroll({
    progressColor: "#535FC8",
    progressTrackColor: "rgba(83, 95, 200, 0.2)",
  });

  const { setQueryStates } = useSelectorQueryState();

  const [prices, setPrices] = useState<Record<string, DealPrice>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      const result: Record<string, DealPrice> = {};

      for (const dest of destinations) {
        const iso = dest.countryIso;
        const days = reasonableDaysByIso[iso] ?? 7;

        try {
          // ✅ pricing engine
          const pricing = await calculateSimplePrice(iso, days);

          const discounted = Math.max(pricing.finalPrice - DISCOUNT_USD, 1);

          result[iso] = {
            finalPrice: discounted,
            currency: "USD",
            externalId: String(pricing.externalId),
          };
        } catch (err) {
          console.error("Failed price for " + iso, err);
        }
      }

      if (!cancelled) setPrices(result);
    }

    fetchPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  const currencySymbol = (cur: string) =>
    cur === "USD" ? "$" : cur === "ILS" ? "₪" : cur;

  return (
    <section className="overflow-hidden py-4">
      <div className="container mx-auto px-4 max-w-[1440px]">
        {/* ✅ בלי כותרת */}

        {/* גלילה אופקית */}
        <div
          ref={containerRef}
          className="relative overflow-y-visible mx-auto mt-4"
          style={{ height: "304px", maxWidth: "100%" }}
        >
          <div
            ref={contentRef}
            className="flex gap-6 px-4 absolute top-0 left-0"
            style={{
              cursor: "grab",
              userSelect: "none",
              willChange: "transform",
              touchAction: "pan-y",
            }}
          >
            {destinations.map((dest) => (
              <div key={dest.id} className="flex-shrink-0" style={{ width: "256px" }}>
                <DestinationDealCard
                  destination={dest}
                  days={reasonableDaysByIso[dest.countryIso]}
                  price={prices[dest.countryIso]}
                  currencySymbol={currencySymbol}
                  onApply={() => handleCardClick(dest.countryIso, reasonableDaysByIso[dest.countryIso], setQueryStates)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* פס התקדמות למובייל */}
        <div className="relative mx-auto mt-6" style={{
          height: "4px",
          width: "200px",
          backgroundColor: "rgba(83, 95, 200, 0.2)",
          borderRadius: "2px"
        }}>
          <div ref={progressRef} className="absolute top-0 left-0 h-full" style={{
            width: "100%",
            backgroundColor: "#535FC8",
            borderRadius: "2px",
            transform: "scaleX(0)"
          }} />
        </div>
      </div>
    </section>
  );
}

function DestinationDealCard({
  destination,
  days,
  price,
  currencySymbol,
  onApply,
}: {
  destination: Destination;
  days: number;
  price?: DealPrice;
  currencySymbol: (c: string) => string;
  onApply: () => void;
}) {
  const handleClick = () => {
    onApply();
    // רגע להתעדכן ב־url state
    setTimeout(() => {
      triggerPurchaseFlow();
    }, 200);
  };

  return (
    <Card
      onClick={handleClick}
      className="relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group p-0"
      size={null}
    >
      <div className="relative h-64 md:h-72 w-full">
        <ImageWithFallback
          src={destination.image}
          fallbackSrc="/images/destinations/default.png"
          alt={destination.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center gap-3">
          <img
            src={getFlagUrl(destination.countryIso)}
            className="w-10 h-10 rounded-full border border-white shadow-md bg-white/80"
          />
          <div className="flex flex-col text-white">
            <span className="text-[18px] font-bold font-birzia">
              {destination.nameHebrew} • {days} ימים
            </span>
            {price ? (
              <span className="text-[13px] font-semibold">
                {Math.round(price.finalPrice)} {currencySymbol(price.currency)} (כולל הנחת ${DISCOUNT_USD})
              </span>
            ) : (
              <span className="inline-block h-4 w-28 bg-white/60 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * ✅ מדמה לחיצה על כפתור הרכישה ב-MainView
 */
function triggerPurchaseFlow() {
  const btn = document.querySelector<HTMLButtonElement>(
    '[aria-label="המשך לרכישת חבילת eSIM"]'
  );
  if (btn) {
    btn.click();
  }
}

/**
 * ✅ עדכון state של selector כדי שהרכישה תעבוד
 */
function handleCardClick(countryIso: string, days: number, setQueryStates: any) {
  setQueryStates({
    countryId: countryIso.toLowerCase(),
    activeTab: "countries",
    numOfDays: days,
  });
}
