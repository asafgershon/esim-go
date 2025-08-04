"use client";

import { Card } from "@workspace/ui";
import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";

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
              <div key={i} className="flex-shrink-0 w-80 h-48 bg-gray-700 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
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
    <Card className="min-w-[320px] md:min-w-[380px] p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
      {/* Header with country and rating */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{review.flag}</span>
          <div>
            <p className="text-white font-semibold">{review.countryName}</p>
            <p className="text-gray-400 text-sm">{review.tripType}</p>
          </div>
        </div>
      </div>

      {/* Rating stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < review.rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Review text */}
      <p className="text-gray-300 mb-4 leading-relaxed text-sm">
        "{review.text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-green to-brand-purple"></div>
        <p className="text-white font-medium">{review.author}</p>
      </div>
    </Card>
  );
};

export const ReviewsSection = () => {

  const reviews: Review[] = [
    {
      id: "1",
      countryCode: "BR",
      countryName: "ברזיל",
      flag: "🇧🇷",
      rating: 5,
      text: "נסעתי לברזיל לחודש, ה-eSIM עבד מושלם בכל מקום - מריו ועד לאמזונס. התקנה פשוטה ומהירות מעולה!",
      author: "שירה כהן",
      tripType: "טיול נחלי"
    },
    {
      id: "2",
      countryCode: "US",
      countryName: "ארצות הברית",
      flag: "🇺🇸",
      rating: 5,
      text: "חסכתי המון כסף בטיול המשפחתי לארה״ב. הילדים היו מחוברים כל הזמן והכל עבד חלק",
      author: "דוד לוי",
      tripType: "טיול משפחתי"
    },
    {
      id: "3",
      countryCode: "TH",
      countryName: "תאילנד",
      flag: "🇹🇭",
      rating: 5,
      text: "החבילה לתאילנד הייתה מושלמת! גלישה מהירה בכל האיים, ווייז עבד מצוין וחסכתי המון על מוניות",
      author: "מיכל ברק",
      tripType: "טיול תרמילאים"
    },
    {
      id: "4",
      countryCode: "FR",
      countryName: "צרפת",
      flag: "🇫🇷",
      rating: 5,
      text: "טיול רומנטי בפריז עם אינטרנט מהיר בכל מקום. התמיכה בעברית עזרה מאוד!",
      author: "יעל אברהם",
      tripType: "ירח דבש"
    },
    {
      id: "5",
      countryCode: "JP",
      countryName: "יפן",
      flag: "🇯🇵",
      rating: 5,
      text: "טכנולוגיה ברמה הכי גבוהה! עבד מצוין בטוקיו ובכל הכפרים המרוחקים",
      author: "רון שפירא",
      tripType: "טיול עסקים"
    },
    {
      id: "6",
      countryCode: "AU",
      countryName: "אוסטרליה",
      flag: "🇦🇺",
      rating: 5,
      text: "3 שבועות באוסטרליה עם גלישה ללא הגבלה. מושלם לשיתוף תמונות מהחופים המדהימים!",
      author: "נועה כהן",
      tripType: "טיול אקסטרים"
    }
  ];

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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-brand-dark to-brand-dark relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-brand-green mb-4">
            הלקוחות שלנו מספרים
          </h2>
          <p className="text-xl text-gray-400">
            אלפי ישראלים כבר נהנים מהשירות שלנו ברחבי העולם
          </p>
        </div>

        {/* Desktop Grid - Show only first 6 reviews */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.slice(0, 6).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Mobile Horizontal Scroll with Custom Scrollbar */}
        <div className="md:hidden relative" style={{ height: '240px', overflow: 'hidden' }}>
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }} />
            )}
            renderThumbHorizontal={props => (
              <div {...props} className="thumb-horizontal" style={{
                ...props.style,
                height: 6,
                backgroundColor: '#00E095',
                borderRadius: 3,
                cursor: 'pointer'
              }} />
            )}
            renderTrackVertical={() => <div style={{ display: 'none' }} />}
            renderThumbVertical={() => <div style={{ display: 'none' }} />}
          >
            <div className="flex gap-4 px-4" style={{ width: `${reviews.length * 352}px`, paddingBottom: '28px' }}>
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