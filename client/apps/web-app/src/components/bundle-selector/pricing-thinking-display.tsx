"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sparkles } from "lucide-react";

interface PricingThinkingDisplayProps {
  isCalculating: boolean;
  progress: number;
  countryName?: string;
  numOfDays?: number;
}

// Different message variations for more natural feel
const thinkingMessages = {
  start: [
    "מנתח את האפשרויות הזמינות",
    "בודק חבילות במאגר הנתונים",
    "מחפש את ההתאמה הטובה ביותר",
  ],
  bundleSearch: [
    "סורק {count} חבילות זמינות",
    "מוצא {count} אפשרויות רלוונטיות",
    "בודק {count} חבילות שונות",
  ],
  countrySpecific: [
    "מחפש חבילות ל{country}",
    "בודק מחירים עבור {country}",
    "סורק אפשרויות ב{country}",
  ],
  daysSpecific: [
    "מחשב מחיר ל-{days} ימים",
    "בודק חבילות של {days} ימים",
    "מתאים למשך של {days} ימים",
  ],
  discount: [
    "מחפש הנחות זמינות",
    "בודק אם יש מבצעים",
    "מחשב הנחת כמות",
    "מצאתי הנחה אפשרית",
  ],
  regional: [
    "בודק חבילות אזוריות",
    "משווה עם חבילות אזור",
    "בודק אם יש אפשרות זולה יותר באזור",
  ],
  finalizing: [
    "מסיים את החישוב",
    "מכין את המחיר הסופי",
    "כמעט מוכן",
    "עוד רגע קטן",
  ],
  complete: [
    "מצאתי את המחיר הטוב ביותר",
    "החישוב הושלם",
    "המחיר מוכן",
  ],
};

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (match, key) => String(values[key]) || match);
}

// Generate context-aware message based on progress
function generateThought(progressPercent: number, countryName?: string, numOfDays?: number) {
  let message = "";
  
  if (progressPercent < 10) {
    message = getRandomMessage(thinkingMessages.start);
  } else if (progressPercent < 25 && countryName) {
    message = formatMessage(
      getRandomMessage(thinkingMessages.countrySpecific),
      { country: countryName }
    );
  } else if (progressPercent < 40) {
    const bundleCount = Math.floor(Math.random() * 50) + 20;
    message = formatMessage(
      getRandomMessage(thinkingMessages.bundleSearch),
      { count: bundleCount }
    );
  } else if (progressPercent < 55 && numOfDays) {
    message = formatMessage(
      getRandomMessage(thinkingMessages.daysSpecific),
      { days: numOfDays }
    );
  } else if (progressPercent < 70) {
    message = getRandomMessage(thinkingMessages.discount);
  } else if (progressPercent < 85) {
    message = getRandomMessage(thinkingMessages.regional);
  } else if (progressPercent < 100) {
    message = getRandomMessage(thinkingMessages.finalizing);
  } else {
    message = getRandomMessage(thinkingMessages.complete);
  }

  return message;
}

export function PricingThinkingDisplay({
  isCalculating,
  progress,
  countryName,
  numOfDays,
}: PricingThinkingDisplayProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentThought, setCurrentThought] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const thoughtHistoryRef = useRef<string[]>([]);
  const currentlyTypingRef = useRef<boolean>(false);

  // Typing animation effect
  const typeText = (text: string, callback?: () => void) => {
    console.log("[DEBUG] typeText called with:", { 
      text, 
      textLength: text.length,
      textType: typeof text,
      isArray: Array.isArray(text),
      currentlyTyping: currentlyTypingRef.current 
    });
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Mark as currently typing to prevent interruption
    currentlyTypingRef.current = true;
    
    let index = 0;
    setCurrentThought("");
    setIsTyping(true);
    
    const type = () => {
      // Check if we should still be typing (component not unmounted/reset)
      if (!currentlyTypingRef.current) {
        console.log("[DEBUG] Typing stopped - currentlyTypingRef is false");
        return;
      }
      
      if (index < text.length) {
        const nextChar = text.substring(0, index + 1);
        console.log(`[DEBUG] Typing progress: ${index + 1}/${text.length}, current: "${nextChar}"`);
        setCurrentThought(nextChar);
        index++;
        typingTimeoutRef.current = setTimeout(type, 30 + Math.random() * 20);
      } else {
        console.log("[DEBUG] Typing complete");
        setIsTyping(false);
        currentlyTypingRef.current = false;
        if (callback) callback();
      }
    };
    
    type();
  };

  // Update thoughts based on progress
  useEffect(() => {
    console.log("[DEBUG] useEffect triggered:", { 
      isCalculating, 
      progress, 
      countryName, 
      numOfDays,
      currentlyTyping: currentlyTypingRef.current,
      thoughtHistory: thoughtHistoryRef.current 
    });
    
    if (!isCalculating) {
      console.log("[DEBUG] Not calculating, cleaning up");
      // Clean up everything when not calculating
      currentlyTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setDisplayText("");
      setCurrentThought("");
      setIsTyping(false);
      setShowDots(false);
      thoughtHistoryRef.current = [];
      return;
    }

    // Don't start new thoughts if currently typing
    if (currentlyTypingRef.current) {
      console.log("[DEBUG] Already typing, skipping");
      return;
    }

    // Generate new thought at certain progress intervals
    const progressThresholds = [0, 20, 40, 60, 80, 95];
    const threshold = progressThresholds.find(t => 
      Math.abs(progress - t) < 5 && 
      !thoughtHistoryRef.current.some(thought => thought.includes(generateThought(t, countryName, numOfDays)))
    );

    console.log("[DEBUG] Progress threshold check:", { progress, threshold });

    if (threshold !== undefined) {
      const newThought = generateThought(progress, countryName, numOfDays);
      console.log("[DEBUG] Generated new thought:", newThought);
      
      // Don't repeat similar thoughts
      if (!thoughtHistoryRef.current.includes(newThought)) {
        console.log("[DEBUG] Adding new thought to history");
        thoughtHistoryRef.current.push(newThought);
        
        // Add to display with ellipsis (only if we have previous display text)
        setDisplayText(prev => {
          const newText = prev ? prev + "... " : prev;
          console.log("[DEBUG] Setting display text:", { prev, newText });
          return newText;
        });
        
        console.log("[DEBUG] Starting typeText for:", newThought);
        typeText(newThought, () => {
          console.log("[DEBUG] typeText callback triggered");
          setDisplayText(prev => {
            const finalText = prev + newThought;
            console.log("[DEBUG] Final display text:", finalText);
            return finalText;
          });
          setCurrentThought("");
          setShowDots(true);
          
          setTimeout(() => setShowDots(false), 1000);
        });
      } else {
        console.log("[DEBUG] Thought already in history, skipping");
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [progress, isCalculating, countryName, numOfDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentlyTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!isCalculating && !displayText && !currentThought) {
    return null;
  }

  return (
    <div className="relative">
      {/* Main thinking container */}
      <div className="bg-gradient-to-br from-brand-purple/5 to-brand-purple/10 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-brand-purple/10">
        {/* Header with pulsing indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <Sparkles className="h-4 w-4 text-brand-purple" />
            {isCalculating && (
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="h-4 w-4 text-brand-purple opacity-75" />
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-brand-dark">
            מחשב מחיר מותאם אישית
          </span>
        </div>

        {/* Thinking display area */}
        <div className="min-h-[60px] relative">
          {/* Previous thoughts (faded) */}
          {displayText && (
            <p className="text-sm text-brand-dark/60 leading-relaxed mb-1">
              {displayText}
            </p>
          )}
          
          {/* Current thought being typed */}
          {currentThought && (
            <p className="text-sm text-brand-dark font-medium leading-relaxed">
              {currentThought}
              {isTyping && (
                <span className="inline-block w-0.5 h-4 bg-brand-purple ml-0.5 animate-pulse" />
              )}
            </p>
          )}
          
          {/* Thinking dots when pausing */}
          {showDots && !isTyping && (
            <span className="inline-flex gap-1 ml-1">
              <span className="inline-block w-1 h-1 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="inline-block w-1 h-1 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="inline-block w-1 h-1 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>

        {/* Subtle progress indicator at bottom */}
        <div className="mt-4 h-0.5 bg-brand-purple/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-purple/50 to-brand-purple transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Subtle breathing animation on container */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        
        .breathing {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}