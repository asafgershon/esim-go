"use client";

import { Button } from "@workspace/ui";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

export function HelpBanner(): JSX.Element {
  const handleContactSupport = () => {
    // This could open a chat widget, redirect to WhatsApp, or open a support form
    // For now, we'll use a WhatsApp link
    const whatsappUrl = "https://wa.me/972XXXXXXXXX"; // Replace with actual WhatsApp number
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {/* Desktop Background */}
        <div className="hidden md:block">
          <Image
            src="/images/bgs/desktop-mid.png"
            alt=""
            fill
            className="object-cover"
            priority={false}
          />
        </div>
        
        {/* Mobile Background */}
        <div className="block md:hidden">
          <Image
            src="/images/bgs/mobile-mid.png"
            alt=""
            fill
            className="object-cover"
            priority={false}
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[brand-purple]/90 to-[brand-green]/90"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            צריכים עזרה? דברו איתנו
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            התמון לכל נפח, בכל שעה - ותיהנו
            משירות מקצועי שישאיר אתכם
            שלווים בחופשות שלכם
          </p>
          
          <Button
            size="lg"
            onClick={handleContactSupport}
            className="bg-white text-[brand-dark] hover:bg-white/90 font-bold px-8 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            <MessageCircle className="ml-3 h-6 w-6" />
            פתיחת הצ׳אט
          </Button>
          
          <p className="mt-6 text-white/80 text-sm">
            זמינים 24/7 לכל שאלה ועזרה
          </p>
        </div>
      </div>
    </section>
  );
}