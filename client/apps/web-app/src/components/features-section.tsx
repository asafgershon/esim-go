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
        <Image
          src={iconUrl}
          alt={text}
          fill
          className="object-contain"
        />
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
    text: "התקנה מהירה דרך ה-QR, בלי תלות בסים פיזי",
    highlight: "סרקו את קוד ה-QR והתחילו לגלוש תוך דקות",
    icon: "/images/illustrations/layers-stack.png",
  },
  {
    id: "instant-support",
    text: "תמיכה בקליק ובלחיצה כפתור",
    highlight: "צוות התמיכה שלנו זמין 24/7 לכל שאלה",
    icon: "/images/illustrations/paper-plane.png",
  },
  {
    id: "zero-commitment",
    text: " הקו הקיים, בלי להפריע לו.",
    highlight: "נשאר במכשיר לצד",
    icon: "/images/illustrations/hand-share.png",
  },
  {
    id: "works-everywhere",
    text: "הפעלה עצמאית",
    highlight: "מהבית לפני הטיסה",
    icon: "/images/illustrations/person-reading.png",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const titleVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const ctaVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.4,
    },
  },
};

export function FeaturesSection({ id, ariaLabel }: { id: string, ariaLabel: string }) {
  return (
    <section id={id} aria-label={ariaLabel} className="w-full px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={titleVariants}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4" dir="rtl">
            טכנולוגיית אי-סים <span className="text-primary">חדשה</span>
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            dir="rtl"
          >
            פיתחנו טכנולוגיה חכמה שמאפשרת לכם להתחבר לאינטרנט מכל מקום בעולם,
            בלי לחשוב על &ldquo;כמה ג&apos;יגה נשארו לי&rdquo; או &ldquo;מתי החבילה נגמרת&rdquo;.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto"
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
                transition: { duration: 0.2 }
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

        {/* CTA Section */}
        <motion.div 
          className="mt-12 flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={ctaVariants}
        >
          {/* Description - hidden on mobile, visible on desktop */}
          <div className="hidden md:block text-right order-1">
            <p className="text-[#0A232E] max-w-md" dir="rtl">
              <span className="font-bold text-[22px]">אתם טסים ל־8 ימים? תקבלו חבילה ל־8 ימים.</span>
              <span className="font-normal text-base md:text-lg"> בלי לבחור נפח גלישה, בלי להטעין, בלי לחדש.</span>
              <span className="text-[#535FC8] font-bold text-base md:text-lg"> שירות פשוט בגובה העיניים.</span>
            </p>
          </div>

          {/* Button Container */}
          <div className="flex items-center order-2">
            <Button 
              variant="brand-primary"
              emphasized
              className="w-[220px]"
              onClick={() => {
                const selector = document.getElementById('esim-selector');
                if (selector) {
                  selector.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              לרכישת Esim
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}