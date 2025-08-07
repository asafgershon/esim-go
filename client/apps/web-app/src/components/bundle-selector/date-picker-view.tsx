"use client";

import { useBundleSelector } from "@/contexts/bundle-selector-context";
import {
  Calendar,
  SelectorAction,
  SelectorButton,
  SelectorContent,
  SelectorHeader,
} from "@workspace/ui";
import { addDays, differenceInDays, format } from "date-fns";
import { he } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { CloseIcon } from "./icons";

export function DatePickerView() {
  // Get setCurrentView and setNumOfDays from context
  const { setCurrentView, setNumOfDays } = useBundleSelector();

  // State for native date inputs (mobile)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // State for desktop calendar
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = format(new Date(), "yyyy-MM-dd");

  // Calculate max date (30 days from start date)
  const maxEndDate = useMemo(() => {
    if (isMobile) {
      if (!startDate) return "";
      return format(addDays(new Date(startDate), 30), "yyyy-MM-dd");
    } else {
      return addDays(new Date(), 365); // Desktop calendar max
    }
  }, [startDate, isMobile]);

  // Calculate the number of days between selected dates
  const numberOfDays = useMemo(() => {
    if (isMobile) {
      if (!startDate || !endDate) return 0;
      const start = new Date(startDate);
      const end = new Date(endDate);
      return differenceInDays(end, start) + 1;
    } else {
      if (!dateRange?.from || !dateRange?.to) return 0;
      return differenceInDays(dateRange.to, dateRange.from) + 1;
    }
  }, [startDate, endDate, dateRange, isMobile]);

  // Automatically update numOfDays in context when dates change
  useEffect(() => {
    if (numberOfDays > 0 && numberOfDays <= 30) {
      setNumOfDays(numberOfDays);
    }
  }, [numberOfDays, setNumOfDays]);

  // Format dates for display
  const formatDisplayDate = useCallback((dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "dd/MM/yyyy", { locale: he });
  }, []);

  // Handle start date change (mobile)
  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartDate = e.target.value;
      setStartDate(newStartDate);

      // If end date is before new start date, clear it
      if (endDate && new Date(endDate) < new Date(newStartDate)) {
        setEndDate("");
      }
    },
    [endDate]
  );

  // Handle end date change (mobile)
  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEndDate(e.target.value);
    },
    []
  );

  // Handle calendar date range change (desktop)
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setCurrentView("main");
  }, [setCurrentView]);

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (numberOfDays > 0 && numberOfDays <= 30) {
      setCurrentView("main");
    }
  }, [numberOfDays, setCurrentView]);

  // Check if selection is valid
  const isValidSelection = numberOfDays > 0 && numberOfDays <= 30;
  const isInvalidRange = numberOfDays > 30;

  return (
    <>
      <SelectorHeader className="mb-0 min-h-10 relative">
        {/* Close button */}
        <button
          onClick={handleBack}
          className="absolute top-0 left-0 md:left-auto md:right-0 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2"
          aria-label="חזור לבחירת ימים"
        >
          <CloseIcon />
        </button>
        <h2 className="text-[18px] md:text-[30px] font-medium text-brand-dark text-center">
          בחר תאריכי נסיעה
        </h2>
      </SelectorHeader>

      <SelectorContent>
        <div className="space-y-6 px-4 py-2">
          {isMobile ? (
            // Mobile: Native date pickers
            <div className="space-y-4">
              {/* Start Date Input */}
              <div className="space-y-2">
                <label
                  htmlFor="start-date"
                  className="text-sm font-medium text-gray-700 block"
                >
                  תאריך התחלה
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg 
                           text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                           focus:border-transparent"
                  dir="ltr"
                />
                {startDate && (
                  <p className="text-xs text-gray-600">
                    {formatDisplayDate(startDate)}
                  </p>
                )}
              </div>

              {/* End Date Input */}
              <div className="space-y-2">
                <label
                  htmlFor="end-date"
                  className="text-sm font-medium text-gray-700 block"
                >
                  תאריך סיום
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  min={startDate || today}
                  max={maxEndDate.toLocaleString()}
                  disabled={!startDate}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg 
                           text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                           focus:border-transparent
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  dir="ltr"
                />
                {endDate && (
                  <p className="text-xs text-gray-600">
                    {formatDisplayDate(endDate)}
                  </p>
                )}
                {!startDate && (
                  <p className="text-xs text-gray-500">בחר תאריך התחלה תחילה</p>
                )}
              </div>
            </div>
          ) : (
            // Desktop: Calendar component
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                locale={he}
                disabled={(date) => {
                  // Disable past dates
                  if (date < new Date(today)) return true;
                  // Disable dates more than 30 days from start
                  if (dateRange?.from) {
                    const maxDate = addDays(dateRange.from, 30);
                    return date > maxDate;
                  }
                  return false;
                }}
                className="rounded-md border"
              />
            </div>
          )}

          {/* Summary Section */}
          {((isMobile && startDate && endDate) || (!isMobile && dateRange?.from && dateRange?.to)) && (
            <div
              className={`p-4 rounded-lg border ${
                isInvalidRange
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    סה״כ ימי נסיעה
                  </p>
                  <p className="text-2xl font-bold">
                    {numberOfDays} {numberOfDays === 1 ? "יום" : "ימים"}
                  </p>
                  {!isMobile && dateRange?.from && dateRange?.to && (
                    <p className="text-sm text-gray-600">
                      {formatDisplayDate(dateRange.from)} - {formatDisplayDate(dateRange.to)}
                    </p>
                  )}
                </div>
                {isInvalidRange && (
                  <div className="text-sm text-red-600">
                    <p className="font-medium">מעל 30 יום</p>
                    <p className="text-xs">נא לבחור טווח קצר יותר</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-blue-500">💡</span>
              בחר תאריכי נסיעה עד 30 יום
            </p>
            {isMobile && startDate && !endDate && (
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                עכשיו בחר תאריך סיום
              </p>
            )}
            {!isMobile && dateRange?.from && !dateRange?.to && (
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                עכשיו בחר תאריך סיום בלוח השנה
              </p>
            )}
          </div>
        </div>
      </SelectorContent>

      <SelectorAction>
        <SelectorButton
          onClick={handleConfirm}
          disabled={!isValidSelection}
          className="w-full"
        >
          {isValidSelection
            ? `אישור - ${numberOfDays} ${numberOfDays === 1 ? "יום" : "ימים"}`
            : "בחר תאריכי נסיעה"}
        </SelectorButton>
      </SelectorAction>
    </>
  );
}
