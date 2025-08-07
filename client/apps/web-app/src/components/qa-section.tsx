"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
} from "@workspace/ui";
import { default as faqData } from "@/data/faq.json";

interface FAQItem {
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
  const faqs: FAQItem[] = faqData;

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "md:w-3xl max-w-5xl mx-auto bg-white flex flex-col items-center justify-center",
        className
      )}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-[brand-dark] text-center mb-12">
        שאלות ותשובות נפוצות
      </h2>

      <Accordion type="single" collapsible className="space-y-4">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="bg-[brand-dark] rounded-xl border-0 overflow-hidden relative"
          >
            <AccordionTrigger className="bg-brand-dark z-10 rounded-2xl px-6 py-5 gap-10 text-white font-medium text-right hover:no-underline hover:bg-brand-dark/90 transition-colors">
              <span className="text-lg">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 bg-brand-white leading-relaxed rounded-b-2xl after:content-[''] after:absolute after:top-[40px] after:left-0 after:w-full after:h-10 after:bg-brand-white">
              <div className="pt-2 text-base leading-7">{faq.answer}</div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
