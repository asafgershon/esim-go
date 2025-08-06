"use client";

import { Star } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable);
}

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
      className="w-full h-[180px] rounded-[30px] border border-solid border-[#fefefe] hover:bg-white/10 transition-all duration-300 flex justify-between p-5 gap-20"
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
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !containerRef.current ||
      !trackRef.current ||
      !contentRef.current ||
      !progressRef.current
    )
      return;

    const container = containerRef.current;
    const content = contentRef.current;

    // Calculate scroll bounds
    const updateBounds = () => {
      const containerWidth = container.offsetWidth;
      const contentWidth = content.scrollWidth;
      return Math.min(0, containerWidth - contentWidth - 32); // 32px for padding
    };

    let bounds = updateBounds();
    
    // Start from the rightmost position (RTL initial position)
    gsap.set(content, { x: bounds });
    
    // Initialize progress bar at 0% (empty at start)
    gsap.set(progressRef.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    // Create draggable (drag right to scroll left - RTL feel)
    const draggable = Draggable.create(content, {
      type: "x",
      bounds: { minX: bounds, maxX: 0 },
      inertia: true,
      edgeResistance: 0.85,
      onDrag: updateProgress,
      onThrowUpdate: updateProgress,
      cursor: "grab",
      activeCursor: "grabbing",
    })[0];

    // Update progress bar (fills as you scroll)
    function updateProgress() {
      const progress = Math.abs(draggable.x / bounds);
      gsap.set(progressRef.current, {
        scaleX: progress,
        transformOrigin: "left center",
      });
    }

    // Mouse wheel support (inverted for RTL feel)
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        const newX = draggable.x - e.deltaX; // Scroll left moves content right
        const clampedX = Math.max(bounds, Math.min(0, newX));
        gsap.to(content, {
          x: clampedX,
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            draggable.update();
            updateProgress();
          },
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    // Handle resize
    const handleResize = () => {
      bounds = updateBounds();
      draggable.applyBounds({ minX: bounds, maxX: 0 });
      if (draggable.x < bounds) {
        gsap.set(content, { x: bounds });
        draggable.update();
      }
      updateProgress();
    };

    window.addEventListener("resize", handleResize);

    // Touch support for mobile (drag left to right)
    let touchStartX = 0;
    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      startX = draggable.x;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX; // Swipe left to scroll right
      const newX = startX + diff;
      const clampedX = Math.max(bounds, Math.min(0, newX));
      gsap.set(content, { x: clampedX });
      draggable.update();
      updateProgress();
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Cleanup
    return () => {
      draggable.kill();
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden w-full"
      id="reviews"
      aria-label="ביקורות לקוחות"
    >
      <div className="container mx-auto px-4 w-full">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-brand-green mb-4">
            הלקוחות שלנו מספרים
          </h2>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ height: "200px" }}
        >
          <div
            ref={contentRef}
            className="flex gap-6 px-4 absolute top-0 left-0"
            style={{
              cursor: "grab",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0"
                style={{ width: "480px" }}
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Progress Track */}
        <div
          ref={trackRef}
          className="relative mx-auto mt-6"
          style={{
            height: "4px",
            width: "200px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "2px",
          }}
        >
          <div
            ref={progressRef}
            className="absolute top-0 left-0 h-full"
            style={{
              width: "100%",
              backgroundColor: "#00E095",
              borderRadius: "2px",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>
    </section>
  );
};
