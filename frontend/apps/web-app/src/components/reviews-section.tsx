"use client";

import { useRef, useEffect } from "react";

interface Review {
  id: string;
  countryCode: string;
  countryName: string;
  imageUrl: string;
}

interface ReviewCardProps {
  review: Review;
}

const getFlagUrl = (countryCode: string, size: number = 40): string => {
  return `https://flagcdn.com/w${size}/${countryCode.toLowerCase()}.png`;
};

const ReviewCard = ({ review }: ReviewCardProps) => {
  const destinationFlagUrl = getFlagUrl(review.countryCode, 40);

  return (
    <div className="relative w-full h-[360px] rounded-[30px] overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg">
      {/* תמונת רקע */}
      <img
        src={review.imageUrl}
        alt={`ביקורת מ${review.countryName}`}
        className="w-full h-full object-cover"
      />
      
      {/* דגל המדינה בפינה העליונה השמאלית */}
      {destinationFlagUrl && (
        <div className="absolute top-5 right-5">
          <img
            src={destinationFlagUrl}
            alt={`דגל ${review.countryName}`}
            className="w-[60px] h-auto object-cover rounded-lg shadow-xl"
            style={{ aspectRatio: "3 / 2" }}
          />
        </div>
      )}
    </div>
  );
};

const reviews: Review[] = [
  {
    id: "1",
    countryCode: "gr",
    countryName: "יוון",
    imageUrl: "/images/reviews/greece.png",
  },
  {
    id: "2",
    countryCode: "us",
    countryName: "ארצות הברית",
    imageUrl: "/images/reviews/usa.png",
  },
  {
    id: "3",
    countryCode: "np",
    countryName: "נפאל",
    imageUrl: "/images/reviews/nepal.png",
  },
  {
    id: "4",
    countryCode: "fr",
    countryName: "צרפת",
    imageUrl: "/images/reviews/france.png",
  },
  {
    id: "5",
    countryCode: "be",
    countryName: "בלגיה",
    imageUrl: "/images/reviews/belgium.png",
  },
  {
    id: "6",
    countryCode: "vn",
    countryName: "וייטנאם",
    imageUrl: "/images/reviews/vietnam.png",
  },
  {
    id: "7",
    countryCode: "gr",
    countryName: "יוון",
    imageUrl: "/images/reviews/greece2.png",
  },
  {
    id: "8",
    countryCode: "ch",
    countryName: "שוויץ",
    imageUrl: "/images/reviews/switzerland.png",
  },
  {
    id: "9",
    countryCode: "es",
    countryName: "ספרד",
    imageUrl: "/images/reviews/spain.png",
  },
  {
    id: "10",
    countryCode: "gr",
    countryName: "יוון",
    imageUrl: "/images/reviews/greece3.png",
  },
  {
    id: "11",
    countryCode: "kr",
    countryName: "קוריאה",
    imageUrl: "/images/reviews/korea.png",
  },
  {
    id: "12",
    countryCode: "za",
    countryName: "דרום אפריקה",
    imageUrl: "/images/reviews/south_africa.png",
  },
];

export const ReviewsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    const progress = progressRef.current;

    if (!container || !content || !progress) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      if (content) content.style.cursor = "grabbing";
    };

    const handleMouseUp = () => {
      isDragging = false;
      if (content) content.style.cursor = "grab";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    const updateProgress = () => {
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const scrolled = container.scrollLeft;
      const progressPercent = scrollWidth > 0 ? scrolled / scrollWidth : 0;
      progress.style.transform = `scaleX(${progressPercent})`;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("scroll", updateProgress);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("scroll", updateProgress);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden w-full max-w-[100vw] py-16"
      id="reviews"
      aria-label="ביקורות לקוחות"
    >
      <div className="container mx-auto px-4 w-full max-w-full">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-brand-green mb-4">
            הלקוחות שלנו משתפים
          </h2>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          ref={containerRef}
          className="relative overflow-x-auto overflow-y-hidden max-w-full scrollbar-hide"
          style={{ height: "420px" }}
        >
          <div
            ref={contentRef}
            className="flex gap-6 px-4"
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
                style={{ width: "300px" }}
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Progress Track */}
        <div
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
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
    </section>
  );
};
