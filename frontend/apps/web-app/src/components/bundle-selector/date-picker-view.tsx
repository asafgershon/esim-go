"use client";

import { useBundleSelector } from "@/contexts/bundle-selector-context";
import {
  SelectorAction,
  SelectorButton,
  SelectorContent,
  SelectorHeader,
} from "@workspace/ui";
import { addDays, differenceInDays, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { XCircle } from "lucide-react";
import { IconButton } from "@workspace/ui";

export function DatePickerView() {
  // Get context values
  const {
    setCurrentView,
    setNumOfDays,
    startDate: contextStartDate,
    endDate: contextEndDate,
    setStartDate: setContextStartDate,
    setEndDate: setContextEndDate,
  } = useBundleSelector();

  // State for date inputs - initialize from context if available
  const [startDate, setStartDate] = useState<string>(
    contextStartDate ? format(contextStartDate, "yyyy-MM-dd") : ""
  );
  const [endDate, setEndDate] = useState<string>(
    contextEndDate ? format(contextEndDate, "yyyy-MM-dd") : ""
  );

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
    return differenceInDays(end, start) + 1;
  }, [startDate, endDate]);

  // Automatically update numOfDays and dates in context when dates change
  useEffect(() => {
    if (numberOfDays > 0 && numberOfDays <= 30) {
      setNumOfDays(numberOfDays);

      // Update dates in context
      if (startDate && endDate) {
        setContextStartDate(new Date(startDate));
        setContextEndDate(new Date(endDate));
      }
    }
  }, [
    numberOfDays,
    setNumOfDays,
    startDate,
    endDate,
    setContextStartDate,
    setContextEndDate,
  ]);

  // Handle start date change
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

  // Handle end date change
  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEndDate(e.target.value);
    },
    []
  );

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
        <IconButton
          onClick={handleBack}
          variant="ghost"
          className="w-10 h-10 absolute top-0 left-0 md:left-auto md:right-0 p-2 rounded-full"
          aria-label="חזור לבחירת ימים"
        >
          <XCircle className="w-6 h-6" />
        </IconButton>
        <h2 className="text-[18px] md:text-[30px] font-medium text-brand-dark text-center">
          בחר תאריכי נסיעה
        </h2>
      </SelectorHeader>

      <SelectorContent>
        <div className="space-y-6 px-4 py-2">
          {/* Date inputs for both mobile and desktop */}
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
                max={maxEndDate}
                disabled={!startDate}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg 
                         text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                         focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                dir="ltr"
              />
              {!startDate && (
                <p className="text-xs text-gray-500">בחר תאריך התחלה תחילה</p>
              )}
            </div>
          </div>

          {/* Show error if range is invalid */}
          {isInvalidRange && (
            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
              <div className="text-sm text-red-600">
                <p className="font-medium">מעל 30 יום</p>
                <p className="text-xs">נא לבחור טווח קצר יותר</p>
              </div>
            </div>
          )}
        </div>
      </SelectorContent>

      <SelectorAction className="mt-4">
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
