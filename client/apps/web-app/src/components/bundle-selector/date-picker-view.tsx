"use client";

import { 
  SelectorHeader, 
  SelectorContent,
  SelectorAction, 
  SelectorSection,
  SelectorButton 
} from "@workspace/ui";
import { CalendarIcon, CloseIcon } from "./icons";

interface DatePickerViewProps {
  setCurrentView: (view: "main" | "datePicker") => void;
}

export function DatePickerView({ setCurrentView }: DatePickerViewProps) {
  return (
    <>
      <SelectorHeader className="mb-0 min-h-10 relative">
        {/* Close button */}
        <button
          onClick={() => setCurrentView('main')}
          className="absolute top-0 left-0 md:left-auto md:right-0 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2"
          aria-label="חזור לבחירת ימים"
        >
          <CloseIcon />
        </button>
      </SelectorHeader>

      <SelectorContent>
        {/* Title */}
        <h2 className="text-[20px] md:text-[28px] font-medium text-brand-dark text-right">
          בחרו תאריך רלוונטי
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* From Date */}
          <SelectorSection className="flex-1 gap-3">
            <div className="flex items-center gap-2 justify-start">
              <CalendarIcon className="w-[14px] h-[14px] md:w-[17px] md:h-[17px]" />
              <label htmlFor="from-date" className="text-[14px] md:text-[20px] text-brand-dark">
                ממתי?
              </label>
            </div>
            {/* PLACEHOLDER INPUT - Replace with actual date picker */}
            <div 
              id="from-date"
              className="bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-[15px] md:rounded-[20px] h-[120px] md:h-[174px] flex items-center justify-center"
              role="group"
              aria-label="בחר תאריך התחלה"
            >
              <span className="text-gray-400 text-[12px] md:text-[14px]">Date Picker Placeholder</span>
            </div>
          </SelectorSection>

          {/* To Date */}
          <SelectorSection className="flex-1 gap-3">
            <div className="flex items-center gap-2 justify-start">
              <CalendarIcon className="w-[14px] h-[14px] md:w-[17px] md:h-[17px]" />
              <label htmlFor="to-date" className="text-[14px] md:text-[20px] text-brand-dark">
                עד מתי?
              </label>
            </div>
            {/* PLACEHOLDER INPUT - Replace with actual date picker */}
            <div 
              id="to-date"
              className="bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-[15px] md:rounded-[20px] h-[120px] md:h-[174px] flex items-center justify-center"
              role="group"
              aria-label="בחר תאריך סיום"
            >
              <span className="text-gray-400 text-[12px] md:text-[14px]">Date Picker Placeholder</span>
            </div>
          </SelectorSection>
        </div>
      </SelectorContent>

      <SelectorAction>
        <SelectorButton 
          className="flex items-center justify-center gap-3"
          onClick={() => {
            // TODO: Handle date selection
            setCurrentView('main');
          }}
          aria-label="אשר בחירת תאריכים"
        >
          <span>לצפייה בחבילה המשתלמת ביותר</span>
          <span className="rotate-180" aria-hidden="true">←</span>
        </SelectorButton>
      </SelectorAction>
    </>
  );
}