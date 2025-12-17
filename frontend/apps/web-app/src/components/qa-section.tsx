"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
} from "@workspace/ui";
import faqData from "@/data/faq.json";

export function QASection({
  id,
  ariaLabel,
  className,
}: {
  id: string;
  ariaLabel: string;
  className?: string;
}) {
  const faqs = faqData as { id: string; question: string; answer: string }[];

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "w-full max-w-3xl mx-auto px-5 flex flex-col items-center text-center mt-4",
        className
      )}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-10">
        שאלות ותשובות נפוצות
      </h2>

      <Accordion type="single" collapsible className="space-y-4 w-full">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="bg-brand-dark rounded-xl border-0 overflow-hidden relative"
          >
            <AccordionTrigger className="bg-brand-dark z-10 rounded-2xl px-6 py-5 gap-10 text-white font-medium hover:no-underline hover:bg-brand-dark/90 transition-colors mx-auto">
              <span className="text-lg">{faq.question}</span>
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-6 bg-brand-white leading-relaxed rounded-b-2xl">
              <div className="pt-2 text-base leading-7">{faq.answer}</div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
