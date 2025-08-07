"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui";
import { default as faqData } from "@/data/faq.json";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export function QASection({ id, ariaLabel }: { id: string, ariaLabel: string }) {
  const faqs: FAQItem[] = faqData;

  return (
    <section id={id} aria-label={ariaLabel} className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[brand-dark] text-center mb-12">
            שאלות ותשובות נפוצות
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                
                className="bg-[brand-dark] rounded-xl border-0 overflow-hidden"
              >
                <AccordionTrigger className="bg-brand-dark rounded-2xl px-6 py-5 text-white font-medium text-right hover:no-underline hover:bg-brand-dark/90 transition-colors">
                  <span className="text-lg">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 bg-brand-white leading-relaxed">
                  <div className="pt-2 text-base leading-7">{faq.answer}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
