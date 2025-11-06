"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@workspace/ui";

interface FeatureCardProps {
  text: string;
  highlight: string;
  iconUrl: string;
}

function FeatureCard({ text, highlight, iconUrl }: FeatureCardProps) {
  return (
    <div className="bg-[#0A232E] rounded-[20px] p-6 h-[200px] flex flex-col md:flex-row items-center justify-center text-white gap-4">
      <div className="w-20 h-20 relative flex-shrink-0">
        <Image src={iconUrl} alt={text} fill className="object-contain" />
      </div>
      <div className="text-center md:text-right">
        <p className="text-sm leading-tight" dir="rtl">
          <span className="font-medium">{highlight}</span>
          {text && (
            <>
              {" "}
              <span className="font-light">{text}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

interface FeatureData {
  id: string;
  text: string;
  highlight: string;
  icon: string;
}

const features: FeatureData[] = [
  {
    id: "data-transfer",
    text: "התקנה מהירה באמצעות QR, ללא צורך בסים פיזי",
    highlight: "סרקו את קוד ה-QR והתחילו לגלוש תוך דקות ספורות",
    icon: "/images/illustrations/layers-stack.png",
  },
  {
    id: "instant-support",
    text: "תמיכה זמינה 24/7",
    highlight: "צוות התמיכה שלנו זמין לכל שאלה ובקשה",
    icon: "/images/illustrations/paper-plane.png",
  },
  {
    id: "zero-commitment",
    text: "שומרים על הקו הקיים",
    highlight: "ה-eSIM נשאר פעיל במכשיר לצד הקו הראשי שלך",
    icon: "/images/illustrations/hand-share.png",
  },
  {
    id: "works-everywhere",
    text: "הפעלה עצמאית ונוחה",
    highlight: "מתקינים את ה-ESIM בלחיצת כפתור כבר בארץ, והוא יעבוד אוטומטית בנחיתה",
    icon: "/images/illustrations/person-reading.png",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export function FeaturesSection({
  id,
  ariaLabel,
}: {
  id: string;
  ariaLabel: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className="w-full flex flex-col gap-12 px-4"
    >
      {/* ✅ השארנו רק את הקוביות */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            variants={cardVariants}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
          >
            <FeatureCard
              text={feature.text}
              highlight={feature.highlight}
              iconUrl={feature.icon}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
