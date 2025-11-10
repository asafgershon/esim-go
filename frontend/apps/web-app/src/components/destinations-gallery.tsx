"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, useHorizontalScroll } from "@workspace/ui";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSelectorQueryState, type ActiveTab } from "@/hooks/useSelectorQueryState";
import { getFlagUrl } from "@/utils/flags";

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

// ✅ יעדים – ללא priceFrom, כי כבר לא צריך חזקות
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

// ✅ ימים "הגיוניים" לכל יעד
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

// ✅ הנחה (כמו שביקשת)
const DISCOUNT_USD = 2;

export function DestinationsGallery({ id, ariaLabel, speed }: { id: string; ariaLabel: string; speed?: string }) {
  const { containerRef, contentRef, progressRef } = useHorizontalScroll({
    progressColor: "#535FC8",
    progressTrackColor: "rgba(83, 95, 200, 0.2)",
  });

  const { setQueryStates } = useSelectorQueryState();

  const [prices, setPrices] = useState<Record<string, DealPrice>>({});

  useEffect(() => {
  let cancelled = false;

  // ✅ 1. לבדוק אם יש cache תקף
  const cacheRaw = localStorage.getItem("hiilo-destination-prices");
  if (cacheRaw) {
    try {
      const cache = JSON.parse(cacheRaw);
      const week = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (now - cache.timestamp < week && cache.prices) {
        console.log("✅ Using cached destination prices");
        setPrices(cache.prices);
        return; // לא מושכים מהשרת
      }
    } catch (err) {
      console.error("Failed to parse cache", err);
    }
  }

  // ✅ 2. אם אין cache — למשוך פעם אחת בלבד לכל היעדים
  async function fetchPrices() {
    console.log("🌍 Fetching destination prices from server...");
    const result: Record<string, DealPrice> = {};

    const backendUrl =
      process.env.NEXT_PUBLIC_API_ENDPOINT || "https://api.hiiloworld.com";

    // ✅ קריאה במקביל לכל היעדים
    await Promise.all(
      destinations.map(async (dest) => {
        const iso = dest.countryIso;
        const days = reasonableDaysByIso[iso];

        try {
          const res = await fetch(
            `${backendUrl}/api/calculate-price?countryId=${iso}&numOfDays=${days}`
          );

          if (!res.ok) throw new Error("API failed");

          const pricing = await res.json();

          const discounted = Math.max(pricing.finalPrice - DISCOUNT_USD, 1);

          result[iso] = {
            finalPrice: discounted,
            currency: pricing.currency || "USD",
            externalId: String(pricing.externalId || iso),
          };
        } catch (err) {
          console.error("⚠️ Failed price for " + iso, err);
        }
      })
    );

    if (!cancelled) {
      setPrices(result);

      // ✅ 3. לשמור לזיכרון עם timestamp
      localStorage.setItem(
        "hiilo-destination-prices",
        JSON.stringify({
          timestamp: Date.now(),
          prices: result,
        })
      );

      console.log("✅ Cached destination prices");
    }
  }

  fetchPrices();

  return () => {
    cancelled = true;
  };
}, []);


  const currencySymbol = (cur: string) =>
    cur === "USD" ? "$" : cur === "ILS" ? "₪" : cur;

  return (
    <section
      data-speed={speed}
      id={id}
      aria-label={ariaLabel}
      className="overflow-hidden"
    >
      <div className="container mx-auto px-4 max-w-[1440px] md:pt-4">
        <div className="text-right mb-12 max-w-4xl mx-auto">
          <h2 className="font-birzia font-bold text-[2rem] leading-[2.125rem] tracking-[-0.01em] text-[#0A232E] mb-4">
            הטכנולוגיה שלנו מאפשרת גלישה ללא הגבלה, במחירים המשתלמים ביותר,
            במעל <span className="text-[#535FC8]">150 </span>מדינות!
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-birzia">
            המערכת של Hiilo סורקת בזמן אמת את כל המחירים אצל הספקים במדינות השונות,
            ומביאה לכם את רק את חבילת ה-ESIM המשתלמת ביותר ללא הגבלת נפח גלישה!
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-y-visible mx-auto mt-10"
          style={{ height: "304px", maxWidth: "100%" }}
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
              <div key={destination.id} className="flex-shrink-0" style={{ width: "256px" }}>
                <DestinationCard
                  destination={destination}
                  days={reasonableDaysByIso[destination.countryIso]}
                  price={prices[destination.countryIso]}
                  currencySymbol={currencySymbol}
                  onApply={() => handleCardClick(destination.countryIso, reasonableDaysByIso[destination.countryIso], setQueryStates)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ✅ פס התקדמות מובייל */}
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
    </section>
  );
}

function DestinationCard({
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
    setTimeout(() => {
      triggerPurchaseFlow();
    }, 150);
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
          alt={`${destination.name} destination`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col text-white">
          <h4 className="text-2xl font-bold mb-2 font-birzia">
            {destination.nameHebrew}
          </h4>
          {price ? (
            <div className="inline-flex items-center bg-white/90 backdrop-blur-sm text-[#0A232E] px-3 py-1 rounded-full text-sm font-semibold">
              {days} ימים – {Math.round(price.finalPrice)} {currencySymbol(price.currency)} (כולל הנחת ${DISCOUNT_USD})
            </div>
          ) : (
            <div className="inline-block h-7 w-28 bg-gray-200 rounded-full skeleton-shimmer" />
          )}
        </div>
      </div>
    </Card>
  );
}

// ✅ ממשיך את הזרימה כבקשה
function triggerPurchaseFlow() {
  const btn = document.querySelector<HTMLButtonElement>(
    '[aria-label="המשך לרכישת חבילת eSIM"]'
  );
  if (btn) btn.click();
}

// ✅ עדכון state של selector
function handleCardClick(
  countryIso: string,
  days: number,
  setQueryStates: any
) {
  setQueryStates({
    countryId: countryIso.toLowerCase(),
    activeTab: "countries",
    numOfDays: days,
  });
}
