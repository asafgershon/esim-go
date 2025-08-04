"use client";

import Image from "next/image";
import { Card } from "@workspace/ui";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo } from "react";
import { ImageWithFallback } from "./image-with-fallback";
import { useQuery } from "@apollo/client";
import { CALCULATE_DESTINATION_PRICES } from "@/lib/graphql/pricing";

// Lazy load the scrollbar component
const Scrollbars = dynamic(
  () => import("react-custom-scrollbars-2").then(mod => mod.Scrollbars),
  { 
    ssr: false,
    loading: () => (
      <div className="md:hidden overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-4">
          {/* Skeleton loader while scrollbar loads */}
          <div className="animate-pulse flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-64 h-72 bg-gray-200 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }
);

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
    image: "/images/destinations/rome.png",
    priceFrom: "החל מ- 15 ₪"
  },
  {
    id: "paris",
    name: "Paris",
    nameHebrew: "פריז",
    countryIso: "FR",
    image: "/images/destinations/paris.png",
    priceFrom: "החל מ- 18 ₪"
  },
  {
    id: "london",
    name: "London",
    nameHebrew: "לונדון",
    countryIso: "GB",
    image: "/images/destinations/london.png",
    priceFrom: "החל מ- 20 ₪"
  },
  {
    id: "tokyo",
    name: "Tokyo",
    nameHebrew: "טוקיו",
    countryIso: "JP",
    image: "/images/destinations/tokyo.png",
    priceFrom: "החל מ- 25 ₪"
  },
  {
    id: "new-york",
    name: "New York",
    nameHebrew: "ניו יורק",
    countryIso: "US",
    image: "/images/destinations/new-york.png",
    priceFrom: "החל מ- 22 ₪"
  },
  {
    id: "barcelona",
    name: "Barcelona",
    nameHebrew: "ברצלונה",
    countryIso: "ES",
    image: "/images/destinations/barcelona.png",
    priceFrom: "החל מ- 16 ₪"
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    nameHebrew: "אמסטרדם",
    countryIso: "NL",
    image: "/images/destinations/amsterdam.png",
    priceFrom: "החל מ- 19 ₪"
  },
  {
    id: "berlin",
    name: "Berlin",
    nameHebrew: "ברלין",
    countryIso: "DE",
    image: "/images/destinations/berlin.png",
    priceFrom: "החל מ- 17 ₪"
  },
];

export function DestinationsGallery() {
  useEffect(() => {
    // Add global styles to hide scrollbars
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .hide-scrollbar {
        -ms-overflow-style: none !important;  /* IE and Edge */
        scrollbar-width: none !important;  /* Firefox */
      }
      @keyframes shimmer {
        0% {
          background-position: -200px 0;
        }
        100% {
          background-position: calc(200px + 100%) 0;
        }
      }
      .skeleton-shimmer {
        background: linear-gradient(
          90deg,
          #d4d4d4 0%,
          #f0f0f0 20%,
          #ffffff 50%,
          #f0f0f0 80%,
          #d4d4d4 100%
        );
        background-size: 200px 100%;
        animation: shimmer 1.2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Prepare inputs for the pricing query - 1 day for each country
  const pricingInputs = useMemo(() => {
    return destinations.map(dest => ({
      countryId: dest.countryIso,
      numOfDays: 1
    }));
  }, []);

  // Execute the pricing query
  const { data, loading } = useQuery(CALCULATE_DESTINATION_PRICES, {
    variables: { inputs: pricingInputs },
    skip: pricingInputs.length === 0
  });

  // Map prices to destinations by country ISO
  const pricesByCountry = useMemo(() => {
    if (!data?.calculatePrices2) return {};
    
    const priceMap: Record<string, { finalPrice: number; currency: string }> = {};
    data.calculatePrices2.forEach((price: any) => {
      if (price.country?.iso) {
        priceMap[price.country.iso] = {
          finalPrice: price.finalPrice,
          currency: price.currency
        };
      }
    });
    return priceMap;
  }, [data]);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#F8FAFC]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-right mb-12 max-w-4xl mx-auto">
          <h2 className="font-birzia font-bold text-[2rem] leading-[2.125rem] tracking-[-0.01em] text-[#0A232E] mb-2">
            שירות זמין ב- <span className="text-[#535FC8]">+100</span>
          </h2>
          <h3 className="font-birzia font-bold text-[2rem] leading-[2.125rem] tracking-[-0.01em] text-[#0A232E] mb-6">
            מדינות ברחבי העולם
          </h3>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-birzia">
            &nbsp;בחרו את היעד הבא שלכם, רכשו חבילה
            <br className="hidden md:block" />
            &nbsp;לפי מספר הימים, וה-ESIM יופעל אוטומטית
            <br className="hidden md:block" />
            &nbsp;עם הנחיתה - בלי נפח, בלי הגבלות.
          </p>
        </div>

        {/* Desktop Grid - Show only first 8 countries */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {destinations.slice(0, 8).map((destination) => (
            <DestinationCard 
              key={destination.id} 
              destination={destination}
              loading={loading}
              price={pricesByCountry[destination.countryIso]}
            />
          ))}
        </div>

        {/* Mobile Horizontal Scroll with Custom Scrollbar */}
        <div className="md:hidden relative" style={{ height: '304px', overflow: 'hidden' }}>
          <Scrollbars
            style={{ width: '100%', height: '100%' }}
            autoHide
            autoHideTimeout={1000}
            autoHideDuration={200}
            renderView={props => (
              <div 
                {...props} 
                style={{
                  ...props.style,
                  overflowX: 'scroll',
                  overflowY: 'hidden',
                  marginBottom: '-20px',
                  paddingBottom: '20px'
                }}
                className="hide-scrollbar"
              />
            )}
            renderTrackHorizontal={props => (
              <div {...props} className="track-horizontal" style={{
                ...props.style,
                height: 6,
                bottom: 16,
                left: 16,
                right: 16,
                borderRadius: 3,
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }} />
            )}
            renderThumbHorizontal={props => (
              <div {...props} className="thumb-horizontal" style={{
                ...props.style,
                height: 6,
                backgroundColor: '#535FC8',
                borderRadius: 3,
                cursor: 'pointer'
              }} />
            )}
            renderTrackVertical={() => <div style={{ display: 'none' }} />}
            renderThumbVertical={() => <div style={{ display: 'none' }} />}
          >
            <div className="flex gap-4 px-4" style={{ width: `${destinations.length * 272}px`, paddingBottom: '28px' }}>
              {destinations.map((destination) => (
                <div key={destination.id} className="flex-shrink-0 w-64">
                  <DestinationCard 
                    destination={destination}
                    loading={loading}
                    price={pricesByCountry[destination.countryIso]}
                  />
                </div>
              ))}
            </div>
          </Scrollbars>
        </div>
      </div>
    </section>
  );
}

interface DestinationCardProps {
  destination: Destination;
  loading?: boolean;
  price?: { finalPrice: number; currency: string };
}

function DestinationCard({ destination, loading, price }: DestinationCardProps) {
  // Default fallback image for destinations
  const fallbackImage = "/images/destinations/default.png";
  
  const handleClick = () => {
    // Update URL with country ISO parameter
    const url = new URL(window.location.href);
    url.searchParams.set('country', destination.countryIso);
    window.history.pushState({}, '', url);
    
    // Scroll to the esim-selector section
    const selectorElement = document.getElementById('esim-selector');
    if (selectorElement) {
      selectorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Format the price text
  const getPriceText = () => {
    if (price) {
      // Format currency symbol
      const currencySymbol = price.currency === 'ILS' ? '₪' : 
                            price.currency === 'USD' ? '$' : 
                            price.currency === 'EUR' ? '€' : 
                            price.currency;
      
      return `החל מ- ${Math.round(price.finalPrice)} ${currencySymbol}`;
    }
    // Fallback to hardcoded price
    return destination.priceFrom;
  };
  
  return (
    <Card 
      onClick={handleClick}
      className="relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
      <div className="relative h-64 md:h-72">
        {/* Background Image with Fallback */}
        <ImageWithFallback
          src={destination.image}
          fallbackSrc={fallbackImage}
          alt={`${destination.name} destination`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h4 className="text-2xl font-bold mb-2 font-birzia">
            {destination.name}
          </h4>
          
          {/* Price Badge - Shows skeleton or actual price */}
          {loading ? (
            <div className="inline-block h-7 w-28 bg-gray-200 rounded-full skeleton-shimmer" />
          ) : (
            <div className="inline-flex items-center bg-white/90 backdrop-blur-sm text-[#0A232E] px-3 py-1 rounded-full text-sm font-semibold">
              {getPriceText()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}