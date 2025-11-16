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

interface Destination {
  id: string;
  name: string;
  nameHebrew: string;
  countryIso: string;
  image: string;
  priceFrom: string;
}

const destinations: Destination[] = [
  {
    id: "rome",
    name: "Rome",
    nameHebrew: "רומא",
    countryIso: "IT",
    image: "/images/destinations/italy.webp",
    priceFrom: "החל מ- $5",
  },
  {
    id: "usa",
    name: "USA",
    nameHebrew: "ארצות הברית",
    countryIso: "US",
    image: "/images/destinations/america.webp",
    priceFrom: "החל מ- $7",
  },
  {
    id: "greece",
    name: "Greece",
    nameHebrew: "יוון",
    countryIso: "GR",
    image: "/images/destinations/greec.webp",
    priceFrom: "החל מ- $6",
  },
  {
    id: "thailand",
    name: "Thailand",
    nameHebrew: "תאילנד",
    countryIso: "TH",
    image: "/images/destinations/thailand.webp",
    priceFrom: "החל מ- $8",
  },
  {
    id: "dubai",
    name: "Dubai",
    nameHebrew: "דובאי",
    countryIso: "AE",
    image: "/images/destinations/dubai.webp",
    priceFrom: "החל מ- $6",
  },
  {
    id: "brazil",
    name: "Brazil",
    nameHebrew: "ברזיל",
    countryIso: "BR",
    image: "/images/destinations/brazil.webp",
    priceFrom: "החל מ- $5",
  },
  {
    id: "canada",
    name: "Canada",
    nameHebrew: "קנדה",
    countryIso: "CA",
    image: "/images/destinations/canada.webp",
    priceFrom: "החל מ- $6",
  },
  {
    id: "china",
    name: "China",
    nameHebrew: "סין",
    countryIso: "CN",
    image: "/images/destinations/china.webp",
    priceFrom: "החל מ- $5",
  },
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
  // URL state management for bundle selector navigation
  const { setQueryStates } = useSelectorQueryState();

  // GSAP horizontal scroll hook for mobile
  const { containerRef, contentRef, progressRef } = useHorizontalScroll({
    progressColor: "#535FC8",
    progressTrackColor: "rgba(83, 95, 200, 0.2)",
  });

  // Prepare inputs for the pricing query - 1 day for each country
  const pricingInputs = useMemo(() => {
    return destinations.map((dest) => ({
      countryId: dest.countryIso,
      numOfDays: 1,
    }));
  }, []);

  // Execute the pricing query
  const { data, loading } = useQuery(CALCULATE_DESTINATION_PRICES, {
    variables: { inputs: pricingInputs },
    skip: pricingInputs.length === 0,
  });

  // Map prices to destinations by country ISO
  const pricesByCountry = useMemo(() => {
    if (!data?.calculatePrices) return {};

    const priceMap: Record<string, { finalPrice: number; currency: string }> =
      {};
    data.calculatePrices.forEach(
      (price: {
        country?: { iso?: string };
        finalPrice: number;
        currency: string;
      }) => {
        if (price.country?.iso) {
          priceMap[price.country.iso] = {
            finalPrice: price.finalPrice,
            currency: price.currency,
          };
        }
      }
    );
    return priceMap;
  }, [data]);

  return (
    <section
      data-speed={speed}
      id={id}
      aria-label={ariaLabel}
      className="overflow-hidden"
    >
      <div className="container mx-auto px-4 max-w-[1440px]">
        {/* Header */}
        <div className="text-right mb-12 max-w-4xl mx-auto">
          <h2 className="font-birzia font-bold text-[2rem] leading-[2.125rem] tracking-[-0.01em] text-[#0A232E] mb-6">
            גלישה חופשית וזמינה במעל <span className="text-[#535FC8]">150</span> מדינות
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-birzia">
            &nbsp;בחרו את היעד הבא שלכם, רכשו חבילה
            <br className="hidden md:block" />
            &nbsp;לפי מספר הימים, וה-ESIM יופעל אוטומטית
            <br className="hidden md:block" />
            &nbsp;עם הנחיתה - בלי נפח, בלי הגבלות.
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-y-visible mx-auto mt-10"
          style={{ 
            height: "304px",
            maxWidth: "100%",
            position: "relative"
          }}
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
              overflowX: "visible"
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
                  loading={loading}
                  price={pricesByCountry[destination.countryIso]}
                  onSelect={setQueryStates}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress Track for Mobile */}
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
      {/* Promo Banner */}
      <PromoBanner />
    </section>
  );
}

interface DestinationCardProps {
  destination: Destination;
  loading?: boolean;
  price?: { finalPrice: number; currency: string };
  onSelect: (values: { countryId: string; activeTab: ActiveTab }) => void;
}

function DestinationCard({
  destination,
  loading,
  price,
  onSelect,
}: DestinationCardProps) {
  const fallbackImage = "/images/destinations/default.png";

  const days = (() => {
    const reasonable: Record<string, number> = {
      IT: 5,
      US: 10,
      GR: 7,
      TH: 14,
      AE: 5,
      BR: 12,
      CA: 10,
      CN: 10,
    };
    return reasonable[destination.countryIso] ?? 7;
  })();

  const couponCode = `${destination.countryIso.toLowerCase()}${days}`;

  const handleClick = () => {
    onSelect({
      countryId: destination.countryIso.toLowerCase(),
      activeTab: "countries",
    });

    const selectorElement = document.getElementById("esim-selector");
    if (selectorElement) {
      selectorElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <Card
      onClick={handleClick}
      className="relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group p-0"
      size={null}
    >
      <div className="relative h-64 md:h-72 w-full">
        
        {/* Background Image */}
        <ImageWithFallback
          src={destination.image}
          fallbackSrc={fallbackImage}
          alt={`${destination.name} destination`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Top-right DAYS badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 text-[#0A232E] px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            {days} ימים
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col gap-2">

          {/* Country Name */}
          <h4 className="text-2xl font-bold font-birzia">
            {destination.nameHebrew}
          </h4>

          {/* Coupon badge INSTEAD OF price */}
          <div className="inline-flex w-fit items-center bg-white/90 backdrop-blur-sm text-[#0A232E] px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
            קוד קופון: {couponCode}
          </div>

        </div>
      </div>
    </Card>
  );
}

