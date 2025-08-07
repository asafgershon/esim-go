"use client";

import { useBundleSelector } from "@/contexts/bundle-selector-context";
import {
  SelectorAction,
  SelectorButton,
  SelectorContent,
  SelectorHeader,
} from "@workspace/ui";
import { addDays, differenceInDays, format, parse, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon } from "./icons";

export function DatePickerView() {
  // Get setCurrentView and setNumOfDays from context
  const { setCurrentView, setNumOfDays } = useBundleSelector();

  // State for native date inputs
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // State for text inputs (dd/mm/yyyy format)
  const [startDateText, setStartDateText] = useState<string>("");
  const [endDateText, setEndDateText] = useState<string>("");

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = format(new Date(), "yyyy-MM-dd");

  // Calculate max date (30 days from start date)
  const maxEndDate = useMemo(() => {
    if (!startDate) return "";
    return format(addDays(new Date(startDate), 30), "yyyy-MM-dd");
  }, [startDate]);

  // Calculate the number of days between selected dates
  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return differenceInDays(end, start) + 1; // +1 to include both days
  }, [startDate, endDate]);

  // Automatically update numOfDays in context when dates change
  useEffect(() => {
    if (numberOfDays > 0 && numberOfDays <= 30) {
      setNumOfDays(numberOfDays);
    }
  }, [numberOfDays, setNumOfDays]);

  // Format dates for display in Israeli locale (dd/mm/yyyy)
  const formatDisplayDate = useCallback((dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: he });
  }, []);

  // Parse dd/mm/yyyy text input to Date
  const parseTextDate = useCallback((text: string): Date | null => {
    // Remove any non-numeric characters except /
    const cleanedText = text.replace(/[^\d/]/g, "");
    
    // Try to parse the date in dd/MM/yyyy format
    const parsedDate = parse(cleanedText, "dd/MM/yyyy", new Date(), { locale: he });
    
    // Check if the parsed date is valid and not in the past
    if (isValid(parsedDate) && parsedDate >= new Date(today)) {
      return parsedDate;
    }
    
    return null;
  }, [today]);

  // Handle text input change for dates
  const handleTextDateChange = useCallback((
    text: string,
    type: "start" | "end"
  ) => {
    // Allow typing while user is entering the date
    if (type === "start") {
      setStartDateText(text);
    } else {
      setEndDateText(text);
    }
    
    // Try to parse when input looks complete (dd/mm/yyyy = 10 chars)
    if (text.length === 10) {
      const parsedDate = parseTextDate(text);
      if (parsedDate) {
        const formattedDate = format(parsedDate, "yyyy-MM-dd");
        if (type === "start") {
          setStartDate(formattedDate);
          // If end date is before new start date, clear it
          if (endDate && new Date(endDate) < parsedDate) {
            setEndDate("");
            setEndDateText("");
          }
        } else {
          // Check if end date is within valid range
          const startDateObj = new Date(startDate);
          const maxEnd = addDays(startDateObj, 30);
          if (parsedDate <= maxEnd && parsedDate >= startDateObj) {
            setEndDate(formattedDate);
          }
        }
      }
    }
  }, [parseTextDate, startDate, endDate, today]);

  // Handle start date change from native picker
  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartDate = e.target.value;
      setStartDate(newStartDate);
      
      // Update text input to match
      if (newStartDate) {
        setStartDateText(formatDisplayDate(newStartDate));
      } else {
        setStartDateText("");
      }

      // If end date is before new start date, clear it
      if (endDate && new Date(endDate) < new Date(newStartDate)) {
        setEndDate("");
        setEndDateText("");
      }
    },
    [endDate, formatDisplayDate]
  );

  // Handle end date change from native picker
  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEndDate = e.target.value;
      setEndDate(newEndDate);
      
      // Update text input to match
      if (newEndDate) {
        setEndDateText(formatDisplayDate(newEndDate));
      } else {
        setEndDateText("");
      }
    },
    [formatDisplayDate]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    setCurrentView("main");
  }, [setCurrentView]);

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (numberOfDays > 0 && numberOfDays <= 30) {
      // numOfDays is already updated via useEffect, just navigate back
      setCurrentView("main");
    }
  }, [numberOfDays, setCurrentView]);

  // Check if selection is valid
  const isValidSelection =
    startDate && endDate && numberOfDays > 0 && numberOfDays <= 30;
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
          {/* Native Date Inputs Section */}
          <div className="space-y-4">
            {/* Start Date Input */}
            <div className="space-y-2">
              <label
                htmlFor="start-date"
                className="text-sm font-medium text-gray-700 block"
              >
                תאריך התחלה
              </label>
              <div className="relative">
                {/* Text input for dd/mm/yyyy format */}
                <input
                  id="start-date-text"
                  type="text"
                  value={startDateText}
                  onChange={(e) => handleTextDateChange(e.target.value, "start")}
                  placeholder="יום/חודש/שנה"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg 
                           text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                           focus:border-transparent"
                  dir="ltr"
                />
                {/* Calendar icon button with native date picker */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6">
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    min={today}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    dir="ltr"
                  />
                  <div className="text-gray-400 pointer-events-none">
                    📅
                  </div>
                </div>
              </div>
            </div>

            {/* End Date Input */}
            <div className="space-y-2">
              <label
                htmlFor="end-date"
                className="text-sm font-medium text-gray-700 block"
              >
                תאריך סיום
              </label>
              <div className="relative">
                {/* Text input for dd/mm/yyyy format */}
                <input
                  id="end-date-text"
                  type="text"
                  value={endDateText}
                  onChange={(e) => handleTextDateChange(e.target.value, "end")}
                  placeholder="יום/חודש/שנה"
                  maxLength={10}
                  disabled={!startDate}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg 
                           text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                           focus:border-transparent
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  dir="ltr"
                />
                {/* Calendar icon button with native date picker */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6">
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    min={startDate || today}
                    max={maxEndDate}
                    disabled={!startDate}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                    dir="ltr"
                  />
                  <div className="text-gray-400 pointer-events-none">
                    📅
                  </div>
                </div>
              </div>
              {!startDate && (
                <p className="text-xs text-gray-500">בחר תאריך התחלה תחילה</p>
              )}
            </div>
          </div>

          {/* Summary Section */}
          {startDate && endDate && (
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
            {startDate && !endDate && (
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                עכשיו בחר תאריך סיום
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
