"use client";

import Image from "next/image";
import { useMemo } from "react";

export function HeroSection({
  id,
  ariaLabel,
}: {
  id: string;
  ariaLabel: string;
}) {
  // Randomize between image 1 and 2
  const heroImage = useMemo(() => {
    const randomNum = Math.floor(Math.random() * 2) + 1;
    return `/images/hero/${randomNum}.png`;
  }, []);

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className="relative overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Hero background"
          fill
          className="object-cover"
          priority
          quality={100}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
        />
      </div>

      <div className="container mx-auto px-4 pt-12 md:pt-20 pb-[200px] relative z-10">
        <div className="text-center max-w-6xl mx-auto font-birzia">
          <h1 className="font-bold mb-6">
            <span className="text-2xl md:text-5xl block mb-2">
              <span className="text-brand-purple">טסים בראש שקט</span>
              <span className="text-brand-dark"> לכל העולם,</span>
            </span>
            <span className="text-5xl md:text-6xl lg:text-7xl text-brand-dark block">
              חבילות גלישה ללא הגבלה.
            </span>
          </h1>
          <p className="text-md md:text-2xl text-brand-dark mb-8 max-w-4xl mx-auto leading-relaxed">
            <span className="font-medium">
              רוכשים חבילת אינטרנט לפי מספר הימים שאתם טסים
            </span>
            <span className="font-light">
              {" "}
              ולא מתעסקים יותר עם נפח גלישה, הטענות או חידושים. החבילה שלכם
              פועלת אוטומטית מרגע הנחיתה - וללא הגבלה.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
