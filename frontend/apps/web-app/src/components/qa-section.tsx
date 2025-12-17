"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
} from "@workspace/ui";
import faqData from "@/data/faq.json"; // ודא שב-tsconfig.json מוגדר resolveJsonModule: true

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export function QASection({
  id,
  ariaLabel,
  className,
}: {
  id: string;
  ariaLabel: string;
  className?: string;
}) {
  const faqs = faqData as FAQ[];

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "w-full px-5 mt-4 flex flex-col items-center text-center",
        className
      )}
    >
      {/* כותרת */}
      <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-10">
        שאלות ותשובות נפוצות
      </h2>

      {/* אקורדיון עם רוחב קבוע וממורכז */}
      <Accordion
        type="single"
        collapsible
        className="space-y-4 w-full max-w-xl mx-auto"
      >
        {faqs.map(({ id: faqId, question, answer }) => (
          <AccordionItem
            key={faqId}
            value={faqId}
            className="bg-brand-dark rounded-xl border-0 overflow-hidden"
          >
            <AccordionTrigger
              className="inline-flex justify-center items-center gap-4 bg-brand-dark
                         text-white font-medium px-6 py-5 rounded-2xl
                         hover:bg-brand-dark/90 transition-colors"
            >
              <span className="text-lg">{question}</span>
            </AccordionTrigger>

            <AccordionContent className="bg-brand-white px-6 pb-6 leading-relaxed rounded-b-2xl">
              <p className="pt-2 text-base leading-7">{answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
