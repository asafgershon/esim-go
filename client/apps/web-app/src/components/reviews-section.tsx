"use client";

import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";

// Lazy load the scrollbar component
const Scrollbars = dynamic(
  () => import("react-custom-scrollbars-2").then((mod) => mod.Scrollbars),
  {
    ssr: false,
    loading: () => (
      <div className="md:hidden overflow-x-auto">
        <div className="flex gap-4 min-w-max px-4">
          {/* Skeleton loader while scrollbar loads */}
          <div className="animate-pulse flex gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 bg-gray-700 rounded-[30px]"
                style={{ width: "320px", height: "116px" }}
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
    <div
      className="w-full max-w-[480px] h-[180px] rounded-[30px] border border-solid border-[#fefefe] hover:bg-white/10 transition-all duration-300 flex justify-between p-5 gap-20"
      style={{ backgroundColor: "rgba(254,254,254,0.08)" }}
    >
      {/* Right section with text */}
      <div className="flex flex-col justify-between flex-1">
        {/* Top: Title and review text */}
        <div className="space-y-2">
          <h3
            className="text-right text-[#fefefe] text-lg font-medium"
            style={{ fontFamily: "Birzia, sans-serif" }}
          >
            {review.tripType}
          </h3>
          <p
            className="text-right text-[#fefefe] text-sm font-light leading-relaxed line-clamp-3"
            style={{ fontFamily: "Birzia, sans-serif" }}
          >
            &ldquo;{review.text}&rdquo;
          </p>
        </div>

        {/* Bottom: Author name and avatar */}
        <div className="flex items-center justify-start gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-green to-brand-purple"></div>
          <span className="text-[#fefefe] text-sm font-medium">
            {review.author}
          </span>
        </div>
      </div>

      {/* Left section with flag and stars */}
      <div className="flex flex-col justify-between flex-shrink-0">
        {/* Country flag */}
        <span className="text-[32px] self-end">{review.flag}</span>

        {/* Star rating */}
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-brand-white text-brand-white"
                  : "text-gray-600"
              }`}
            />
          ))}
        </div>
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
    <section className="py-16 md:py-24 relative overflow-hidden w-full" id="reviews" aria-label="ביקורות לקוחות">
      <div className="container mx-auto px-4 w-full">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-brand-green mb-4">
            הלקוחות שלנו מספרים
          </h2>
        </div>

        {/* Horizontal Scroll with Custom Scrollbar - Both Desktop and Mobile */}
        <div
          className="relative"
          style={{ height: "200px", overflow: "hidden" }}
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
              className="flex gap-6 px-4"
              style={{
                paddingBottom: "28px",
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0"
                >
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
