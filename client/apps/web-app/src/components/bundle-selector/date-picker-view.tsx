"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  SelectorHeader, 
  SelectorContent,
  SelectorAction, 
  SelectorSection,
  SelectorButton,
  Calendar 
} from "@workspace/ui";
import { CalendarIcon, CloseIcon } from "./icons";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import type { DateRange } from "react-day-picker";

export function DatePickerView() {
  // Get setCurrentView and setNumOfDays from context instead of props
  const { setCurrentView, setNumOfDays } = useBundleSelector();
  
  // State for date range selection
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [activeCalendar, setActiveCalendar] = useState<"from" | "to" | null>(null);

  // Validation: disable dates before today
  const today = new Date();
  const disabledDays = { before: today };

  // Calculate the number of days between selected dates
  const numberOfDays = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return 0;
    const diffTime = selectedRange.to.getTime() - selectedRange.from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  }, [selectedRange]);

  // Format dates for display
  const formatDate = useCallback((date: Date | undefined) => {
    if (!date) return null;
    return format(date, "d בMMM yyyy", { locale: he });
  }, []);

  // Handle date range selection
  const handleDateSelect = useCallback((range: DateRange | undefined) => {
    setSelectedRange(range);
  }, []);

  // Handle calendar click for mobile UX
  const handleCalendarClick = useCallback((type: "from" | "to") => {
    setActiveCalendar(type);
  }, []);

  // Clear active calendar when clicking outside
  const handleCalendarBlur = useCallback(() => {
    setTimeout(() => setActiveCalendar(null), 200);
  }, []);

  // Validate selection and proceed
  const handleConfirm = useCallback(() => {
    if (!selectedRange?.from || !selectedRange?.to) {
      // Show error - could integrate with toast system in the future
      alert("אנא בחר תאריך התחלה ותאריך סיום");
      return;
    }

    // Validate date range isn't too long (max 30 days for eSIM packages)
    if (numberOfDays > 30) {
      alert("מקסימום 30 ימים לחבילת eSIM");
      return;
    }

    // Validate from date is not after to date (should not happen with range picker, but good to validate)
    if (selectedRange.from > selectedRange.to) {
      alert("תאריך התחלה חייב להיות לפני תאריך הסיום");
      return;
    }

    // TODO: Pass selected dates to the bundle selector context
    // This would integrate with the existing numOfDays state and possibly 
    // add startDate/endDate to the context for precise date-based pricing
    console.log("Selected date range:", {
      from: selectedRange.from,
      to: selectedRange.to,
      numberOfDays,
    });

    // Update the number of days in the bundle selector to match the selected range
    // This ensures consistency between date picker and slider selection
    if (numberOfDays > 0) {
      setNumOfDays(numberOfDays);
    }

    setCurrentView('main');
  }, [selectedRange, numberOfDays, setCurrentView, setNumOfDays]);

  const isValidSelection = selectedRange?.from && selectedRange?.to;

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close calendar or go back to main view
      if (e.key === "Escape") {
        if (activeCalendar) {
          setActiveCalendar(null);
        } else {
          setCurrentView('main');
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCalendar, setCurrentView]);

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
        
        {/* Selected dates summary */}
        {isValidSelection && (
          <div className={`mb-4 p-3 rounded-lg border ${
            numberOfDays > 30 
              ? "bg-red-50 border-red-200" 
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className={`text-sm text-right ${
              numberOfDays > 30 ? "text-red-800" : "text-blue-800"
            }`}>
              <span className="font-medium">תאריכים נבחרו: </span>
              {formatDate(selectedRange.from)} - {formatDate(selectedRange.to)}
              <span className="block mt-1">
                <span className="font-medium">משך הטיול: </span>
                {numberOfDays} ימים
                {numberOfDays > 30 && (
                  <span className="block mt-1 text-red-600 text-xs">
                    ⚠️ חבילות eSIM זמינות עד 30 ימים בלבד
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* From Date */}
          <SelectorSection className="flex-1 gap-3">
            <div className="flex items-center gap-2 justify-start">
              <CalendarIcon className="w-[14px] h-[14px] md:w-[17px] md:h-[17px]" />
              <label className="text-[14px] md:text-[20px] text-brand-dark">
                ממתי?
              </label>
            </div>
            <div 
              className={`bg-brand-white border rounded-[15px] md:rounded-[20px] min-h-[174px] p-3 transition-colors ${
                activeCalendar === "from" 
                  ? "border-brand-purple ring-2 ring-brand-purple/20" 
                  : "border-[rgba(10,35,46,0.2)] hover:border-[rgba(10,35,46,0.3)]"
              }`}
              role="group"
              aria-label="בחר תאריך התחלה"
              onClick={() => handleCalendarClick("from")}
              onBlur={handleCalendarBlur}
              tabIndex={0}
            >
              {selectedRange?.from ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
                  <div className="text-[16px] md:text-[20px] font-medium text-brand-dark mb-2">
                    {formatDate(selectedRange.from)}
                  </div>
                  <div className="text-[12px] md:text-[14px] text-gray-500">
                    תאריך התחלה
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[150px]">
                  <span className="text-gray-400 text-[12px] md:text-[14px]">לחץ לבחירת תאריך התחלה</span>
                </div>
              )}
            </div>
          </SelectorSection>

          {/* To Date */}
          <SelectorSection className="flex-1 gap-3">
            <div className="flex items-center gap-2 justify-start">
              <CalendarIcon className="w-[14px] h-[14px] md:w-[17px] md:h-[17px]" />
              <label className="text-[14px] md:text-[20px] text-brand-dark">
                עד מתי?
              </label>
            </div>
            <div 
              className={`bg-brand-white border rounded-[15px] md:rounded-[20px] min-h-[174px] p-3 transition-colors ${
                activeCalendar === "to" 
                  ? "border-brand-purple ring-2 ring-brand-purple/20" 
                  : "border-[rgba(10,35,46,0.2)] hover:border-[rgba(10,35,46,0.3)]"
              }`}
              role="group"
              aria-label="בחר תאריך סיום"
              onClick={() => handleCalendarClick("to")}
              onBlur={handleCalendarBlur}
              tabIndex={0}
            >
              {selectedRange?.to ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
                  <div className="text-[16px] md:text-[20px] font-medium text-brand-dark mb-2">
                    {formatDate(selectedRange.to)}
                  </div>
                  <div className="text-[12px] md:text-[14px] text-gray-500">
                    תאריך הסיום
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[150px]">
                  <span className="text-gray-400 text-[12px] md:text-[14px]">לחץ לבחירת תאריך סיום</span>
                </div>
              )}
            </div>
          </SelectorSection>
        </div>

        {/* Calendar component - shown when a calendar is active */}
        {activeCalendar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 md:relative md:inset-auto md:bg-transparent md:flex-none md:p-0 md:z-auto md:mt-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-sm md:max-w-none">
              <div className="flex justify-between items-center mb-4 p-4 pb-2">
                <h3 className="text-[16px] md:text-[18px] font-medium text-brand-dark">
                  {activeCalendar === "from" ? "בחר תאריך התחלה" : "בחר תאריך הסיום"}
                </h3>
                <button
                  onClick={() => setActiveCalendar(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="סגור לוח שנה"
                >
                  <CloseIcon />
                </button>
              </div>
              
              <div className="flex justify-center p-4">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleDateSelect}
                  disabled={disabledDays}
                  numberOfMonths={1}
                  className="border-0"
                  dir="rtl"
                  locale={he}
                  showOutsideDays={false}
                  weekStartsOn={0} // Sunday
                  onDayClick={() => {
                    // Auto-close calendar after second date selection on mobile
                    if (selectedRange?.from && !selectedRange?.to) {
                      setTimeout(() => setActiveCalendar(null), 300);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </SelectorContent>

      <SelectorAction>
        <SelectorButton 
          className="flex items-center justify-center gap-3"
          onClick={handleConfirm}
          disabled={!isValidSelection}
          aria-label="אשר בחירת תאריכים"
        >
          <span>
            {isValidSelection 
              ? `לצפייה בחבילת ${numberOfDays} ימים` 
              : "בחר תאריכים להמשך"
            }
          </span>
          <span className="rotate-180" aria-hidden="true">←</span>
        </SelectorButton>
      </SelectorAction>
    </>
  );
}