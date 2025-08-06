"use client";

import { Card } from "@workspace/ui";
import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";

// Lazy load the scrollbar component
const Scrollbars = dynamic(
  () => import("react-custom-scrollbars-2").then((mod) => mod.Scrollbars),
  {
    ssr: false,
    loading: () => (
      <div className="md:hidden overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-4">
          {/* Skeleton loader while scrollbar loads */}
          <div className="animate-pulse flex gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-80 h-48 bg-gray-700 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

interface Review {
  id: string;
  countryCode: string;
  countryName: string;
  flag: string;
  rating: number;
  text: string;
  author: string;
  tripType: string;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="relative w-[678px] h-[247px] min-w-[320px] md:min-w-[678px] md:h-[247px]">
      {/* Main card background with border */}
      <div 
        className="absolute inset-0 rounded-[30px] border border-solid border-[#fefefe]"
        style={{ backgroundColor: 'rgba(254,254,254,0.08)' }}
      />
      
      {/* Country flag */}
      <div className="absolute left-[27px] top-[27px] w-[67px] h-[50px] rounded-lg overflow-hidden">
        <span className="text-[40px] leading-[50px] block w-full h-full flex items-center justify-center">
          {review.flag}
        </span>
      </div>

      {/* Star rating - positioned at bottom left */}
      <div className="absolute bottom-[41px] left-[78px] flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-[16.64px] w-[16.64px] ${
              i < review.rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Review title */}
      <div 
        className="absolute top-[64px] right-[27px] text-right text-[#fefefe] text-[24px] leading-[22px] font-medium"
        style={{ fontFamily: 'Birzia, sans-serif' }}
      >
        {review.tripType}
      </div>

      {/* Review text */}
      <div 
        className="absolute top-[96px] right-[27px] text-right text-[#fefefe] text-[18px] leading-[22px] font-light max-w-[374px]"
        style={{ fontFamily: 'Birzia, sans-serif' }}
      >
        &ldquo;{review.text}&rdquo;
      </div>

      {/* Author name */}
      <div 
        className="absolute bottom-[41px] right-[27px] text-center text-[#fefefe] text-[18px] leading-[22px] font-medium"
        style={{ fontFamily: 'Birzia, sans-serif' }}
      >
        {review.author}
      </div>

      {/* Author avatar - positioned at bottom right */}
      <div className="absolute bottom-[40px] right-[72px] w-[21px] h-[21px]">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-green to-brand-purple"></div>
      </div>
    </div>
  );
};

const reviews: Review[] = [
  {
    id: "1",
    countryCode: "BR",
    countryName: "ברזיל",
    flag: "🇧🇷",
    rating: 5,
    text: "נחתתי באמסטרדם וכבר הייתי מחוברת! אף פעם לא הרגשתי כל כך חופשיה בטיול. התמיכה בעברית באמצע הלילה? פשוט מושלם!",
    author: "שרה כ.",
    tripType: "שירות נהדר, ממליצה בחום!",
  },
  {
    id: "2",
    countryCode: "US",
    countryName: "ארצות הברית",
    flag: "🇺🇸",
    rating: 5,
    text: "חסכתי המון כסף בטיול המשפחתי לארה״ב. הילדים היו מחוברים כל הזמן והכל עבד חלק",
    author: "דוד לוי",
    tripType: "טיול משפחתי",
  },
  {
    id: "3",
    countryCode: "TH",
    countryName: "תאילנד",
    flag: "🇹🇭",
    rating: 5,
    text: "החבילה לתאילנד הייתה מושלמת! גלישה מהירה בכל האיים, ווייז עבד מצוין וחסכתי המון על מוניות",
    author: "מיכל ברק",
    tripType: "טיול תרמילאים",
  },
  {
    id: "4",
    countryCode: "FR",
    countryName: "צרפת",
    flag: "🇫🇷",
    rating: 5,
    text: "טיול רומנטי בפריז עם אינטרנט מהיר בכל מקום. התמיכה בעברית עזרה מאוד!",
    author: "יעל אברהם",
    tripType: "ירח דבש",
  },
  {
    id: "5",
    countryCode: "JP",
    countryName: "יפן",
    flag: "🇯🇵",
    rating: 5,
    text: "טכנולוגיה ברמה הכי גבוהה! עבד מצוין בטוקיו ובכל הכפרים המרוחקים",
    author: "רון שפירא",
    tripType: "טיול עסקים",
  },
  {
    id: "6",
    countryCode: "AU",
    countryName: "אוסטרליה",
    flag: "🇦🇺",
    rating: 5,
    text: "3 שבועות באוסטרליה עם גלישה ללא הגבלה. מושלם לשיתוף תמונות מהחופים המדהימים!",
    author: "נועה כהן",
    tripType: "טיול אקסטרים",
  },
];

export const ReviewsSection = () => {
  useEffect(() => {
    // Add global styles to hide scrollbars
    const style = document.createElement("style");
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
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-brand-green mb-4">
            הלקוחות שלנו מספרים
          </h2>
        </div>

        {/* Desktop Grid - Show only first 6 reviews */}
        <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1400px] mx-auto">
          {reviews.slice(0, 4).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Mobile Horizontal Scroll with Custom Scrollbar */}
        <div
          className="md:hidden relative"
          style={{ height: "280px", overflow: "hidden" }}
        >
          <Scrollbars
            style={{ width: "100%", height: "100%" }}
            autoHide
            autoHideTimeout={1000}
            autoHideDuration={200}
            renderView={(props) => (
              <div
                {...props}
                style={{
                  ...props.style,
                  overflowX: "scroll",
                  overflowY: "hidden",
                  marginBottom: "-20px",
                  paddingBottom: "20px",
                }}
                className="hide-scrollbar"
              />
            )}
            renderTrackHorizontal={(props) => (
              <div
                {...props}
                className="track-horizontal"
                style={{
                  ...props.style,
                  height: 6,
                  bottom: 16,
                  left: 16,
                  right: 16,
                  borderRadius: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              />
            )}
            renderThumbHorizontal={(props) => (
              <div
                {...props}
                className="thumb-horizontal"
                style={{
                  ...props.style,
                  height: 6,
                  backgroundColor: "#00E095",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              />
            )}
            renderTrackVertical={() => <div style={{ display: "none" }} />}
            renderThumbVertical={() => <div style={{ display: "none" }} />}
          >
            <div
              className="flex gap-4 px-4"
              style={{
                width: `${reviews.length * 352}px`,
                paddingBottom: "28px",
              }}
            >
              {reviews.map((review) => (
                <div key={review.id} className="flex-shrink-0 w-80">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </Scrollbars>
        </div>
      </div>
    </section>
  );
};
