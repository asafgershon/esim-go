"use client";

import { useBundleSelector } from "@/contexts/bundle-selector-context";
import {
  SelectorAction,
  SelectorButton,
  SelectorContent,
  SelectorHeader
} from "@workspace/ui";
import { addDays, differenceInDays, format } from "date-fns";
import { he } from "date-fns/locale";
import { useCallback, useMemo, useState, useEffect } from "react";
import { CalendarIcon, CloseIcon } from "./icons";

export function DatePickerView() {
  // Get setCurrentView and setNumOfDays from context
  const { setCurrentView, setNumOfDays } = useBundleSelector();
  
  // State for native date inputs
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
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
  
  // Format dates for display
  const formatDisplayDate = useCallback((dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "d בMMM yyyy", { locale: he });
  }, []);
  
  // Handle start date change
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, clear it
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate("");
    }
  }, [endDate]);
  
  // Handle end date change
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  }, []);
  
  // Handle back navigation
  const handleBack = useCallback(() => {
    setCurrentView('main');
  }, [setCurrentView]);
  
  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (numberOfDays > 0 && numberOfDays <= 30) {
      // numOfDays is already updated via useEffect, just navigate back
      setCurrentView('main');
    }
  }, [numberOfDays, setCurrentView]);
  
  // Check if selection is valid
  const isValidSelection = startDate && endDate && numberOfDays > 0 && numberOfDays <= 30;
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
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  min={today}
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg 
                           text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                           focus:border-transparent appearance-none
                           [&::-webkit-calendar-picker-indicator]:opacity-0
                           [&::-webkit-calendar-picker-indicator]:absolute
                           [&::-webkit-calendar-picker-indicator]:inset-0
                           [&::-webkit-calendar-picker-indicator]:w-full
                           [&::-webkit-calendar-picker-indicator]:h-full
                           [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  dir="ltr"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                {startDate && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
                    {formatDisplayDate(startDate)}
                  </div>
                )}
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
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  min={startDate || today}
                  max={maxEndDate}
                  disabled={!startDate}
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg 
                           text-base focus:outline-none focus:ring-2 focus:ring-primary-500 
                           focus:border-transparent appearance-none
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                           [&::-webkit-calendar-picker-indicator]:opacity-0
                           [&::-webkit-calendar-picker-indicator]:absolute
                           [&::-webkit-calendar-picker-indicator]:inset-0
                           [&::-webkit-calendar-picker-indicator]:w-full
                           [&::-webkit-calendar-picker-indicator]:h-full
                           [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  dir="ltr"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                {endDate && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
                    {formatDisplayDate(endDate)}
                  </div>
                )}
              </div>
              {!startDate && (
                <p className="text-xs text-gray-500">
                  בחר תאריך התחלה תחילה
                </p>
              )}
            </div>
          </div>
          
          {/* Summary Section */}
          {startDate && endDate && (
            <div className={`p-4 rounded-lg border ${
              isInvalidRange 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    סה״כ ימי נסיעה
                  </p>
                  <p className="text-2xl font-bold">
                    {numberOfDays} {numberOfDays === 1 ? 'יום' : 'ימים'}
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
            ? `אישור - ${numberOfDays} ${numberOfDays === 1 ? 'יום' : 'ימים'}`
            : 'בחר תאריכי נסיעה'
          }
        </SelectorButton>
      </SelectorAction>
    </>
  );
}