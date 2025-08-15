import { useMemo, useState, useCallback } from "react";

interface TypingSequenceContext {
  countryName?: string;
  numOfDays?: number;
  totalBundles?: number;
  isCalculating: boolean;
}

type AnimationPhase = "idle" | "typing" | "complete";

// Helper function to randomly select from options
function randomChoice<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function generateContextualMessages(context: {
  totalBundles?: number;
  countryName?: string;
  numOfDays?: number;
}) {
  const { totalBundles, countryName, numOfDays } = context;
  const messages: string[] = [];

  // Scanning bundles - with variations
  if (totalBundles && totalBundles > 0) {
    const bundleMessage = randomChoice([
      `סורק ${totalBundles.toLocaleString("he-IL")} חבילות במאגר הנתונים`,
      `בודק ${totalBundles.toLocaleString("he-IL")} אפשרויות זמינות`,
      `מנתח ${totalBundles.toLocaleString("he-IL")} חבילות שונות`,
      `עובר על ${totalBundles.toLocaleString("he-IL")} חבילות במערכת`
    ]);
    messages.push(bundleMessage);
  } else {
    messages.push(randomChoice([
      "מחפש חבילות זמינות",
      "סורק את מאגר החבילות",
      "בודק אפשרויות זמינות"
    ]));
  }

  // Country-specific search - with variations
  if (countryName) {
    const countryMessage = randomChoice([
      `מחפש את החבילה הטובה ביותר ל${countryName}`,
      `בודק אפשרויות מיוחדות ל${countryName}`,
      `מתאים חבילות ל${countryName}`,
      `סורק מחירים עבור ${countryName}`
    ]);
    messages.push(countryMessage);
  }

  // Days calculation - with variations
  if (numOfDays) {
    const daysMessage = randomChoice([
      `מחשב מחיר אופטימלי ל-${numOfDays} ימים`,
      `מתאים חבילה ל-${numOfDays} ימי שימוש`,
      `בודק את האפשרות הטובה ביותר ל-${numOfDays} ימים`,
      `מחשב עלות ל-${numOfDays} ימים`
    ]);
    messages.push(daysMessage);

    // Add context-aware message for longer trips
    if (numOfDays >= 7) {
      messages.push(randomChoice([
        "בודק הנחות לתקופות ארוכות",
        "מחפש מבצעים לטיולים ארוכים",
        "בודק אם יש הנחת כמות",
        "מחשב הנחות לתקופה ממושכת"
      ]));
    }
  }

  // Final comparison step - with variations
  messages.push(randomChoice([
    "משווה מחירים ומבצעים זמינים",
    "בודק את כל האפשרויות הקיימות",
    "מחפש את המחיר הטוב ביותר",
    "מנתח את כל ההצעות הזמינות"
  ]));

  return messages;
}

function buildSequanceWithoutAppending(
  messages: string[],
  setPhase: (phase: AnimationPhase) => void
): Array<string | number | (() => void)> {
  const sequence: Array<string | number | (() => void)> = [];
  sequence.push(() => setPhase("typing"));
  messages.forEach((message, index) => {
    sequence.push(message);

    if (index === messages.length - 1) {
      sequence.push(1000);
      sequence.push(() => setPhase("complete"));
    } else {
      sequence.push(500);
    }
  });

  return sequence;
}

export function useTypingSequence({
  countryName,
  numOfDays,
  totalBundles,
  isCalculating,
}: Omit<TypingSequenceContext, "progress">) {
  const [phase, setPhase] = useState<AnimationPhase>("idle");

  const sequence = useMemo(() => {
    if (!isCalculating) {
      return [];
    }

    // Generate context-aware, deterministic messages
    const messages = generateContextualMessages({
      countryName,
      numOfDays,
      totalBundles,
    });

    // Build TypeAnimation sequence with callbacks
    return buildSequanceWithoutAppending(messages, setPhase);
  }, [countryName, numOfDays, totalBundles, isCalculating]);

  // Reset phase when calculation stops
  const resetPhase = useCallback(() => {
    setPhase("idle");
  }, []);

  return {
    sequence,
    phase,
    resetPhase,
  };
}
