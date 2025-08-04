"use client";

import { Calendar, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import {
  Selector,
  SelectorCard,
  SelectorHeader,
  SelectorContent,
  SelectorAction,
  SelectorSection,
  SelectorLabel,
  SelectorButton,
} from "@workspace/ui";

export function EsimSelectorNew() {
  const [activeTab, setActiveTab] = useState<"countries" | "trips">("countries");
  const [daysValue, setDaysValue] = useState(7);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Main selector view
  const MainView = () => (
    <>
      <SelectorHeader>
        <h2 className="text-[30px] font-medium text-brand-dark">
          איזה כיף! לאן טסים? 🌏
        </h2>
      </SelectorHeader>

      <SelectorContent>
        {/* Tab Container */}
        <div className="bg-[#F1F5FA] rounded-2xl p-1">
          <div className="flex">
            <button
              onClick={() => setActiveTab("trips")}
              className={`
                flex-1 py-2 px-4 text-[18px] font-medium rounded-xl transition-all duration-200
                ${activeTab === "trips" 
                  ? "bg-brand-dark text-brand-white" 
                  : "text-brand-dark bg-transparent"
                }
              `}
            >
              טיולים
            </button>
            <button
              onClick={() => setActiveTab("countries")}
              className={`
                flex-1 py-2 px-4 text-[18px] font-medium rounded-xl transition-all duration-200
                ${activeTab === "countries" 
                  ? "bg-brand-dark text-brand-white" 
                  : "text-brand-dark bg-transparent"
                }
              `}
            >
              מדינות
            </button>
          </div>
        </div>

        {/* Destination Selection */}
        <SelectorSection>
          <SelectorLabel>לאן נוסעים?</SelectorLabel>
          <div className="relative">
            <div 
              className="
                bg-brand-white border border-[rgba(11,35,46,0.2)] rounded-lg 
                h-[34px] px-3 flex items-center cursor-pointer
                hover:border-brand-purple transition-colors relative
              "
            >
              <span className="text-brand-dark text-[12px] opacity-50 pr-6">לאן נוסעים?</span>
              <ChevronsUpDown className="w-4 h-4 text-brand-dark opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </SelectorSection>

        {/* Days Selection */}
        <SelectorSection>
          <div className="flex items-center gap-1 justify-start">
            <p className="text-[14px] text-brand-dark order-2">כמה ימים?</p>
            <Calendar className="w-3 h-3 text-brand-dark order-1" />
          </div>

          {/* Slider Container */}
          <div className="relative">
            <div className="bg-[rgba(11,35,46,0.05)] h-[8.644px] rounded-[50px] w-full" />
            
            <div 
              className="absolute top-0 right-0 bg-brand-dark h-[8.644px] rounded-[50px]"
              style={{ width: `${(daysValue / 30) * 100}%` }}
            />
            
            <div 
              className="absolute top-1/2 -translate-y-1/2"
              style={{ right: `calc(${(daysValue / 30) * 100}% - 19px)` }}
            >
              <div className="
                w-[38px] h-[38px] bg-brand-white rounded-full 
                border border-brand-dark shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
                flex items-center justify-center cursor-pointer
              ">
                <span className="text-[16px] font-bold text-brand-dark">{daysValue}</span>
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="30"
              value={daysValue}
              onChange={(e) => setDaysValue(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Date Selection Link */}
          <div className="text-right">
            <button 
              className="text-[12px] font-bold text-brand-dark hover:text-brand-purple transition-colors cursor-pointer"
              onClick={() => setShowDatePicker(true)}
            >
              לבחירת תאריכים מדויקים »
            </button>
          </div>
        </SelectorSection>
      </SelectorContent>

      <SelectorAction>
        <SelectorButton>
          לצפייה בחבילה המשתלמת ביותר
        </SelectorButton>
      </SelectorAction>
    </>
  );

  // Date picker view
  const DatePickerView = () => (
    <>
      <SelectorHeader className="mb-0 min-h-10">
        {/* Close button - positioned absolute to the card */}
        <button
          onClick={() => setShowDatePicker(false)}
          className="ml-2 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          style={{ top: '40px', right: '40px' }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="13" r="12.5" stroke="#0A232E"/>
            <path d="M9 9L17 17M17 9L9 17" stroke="#0A232E" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </SelectorHeader>

      <SelectorContent>
        {/* Title - right aligned */}
        <h2 className="text-[28px] font-medium text-brand-dark text-right">
          בחרו תאריך רלוונטי
        </h2>
        
        <div className="flex gap-8">
          {/* From Date */}
          <SelectorSection className="flex-1 gap-3">
            <div className="flex items-center gap-2 justify-start">
              <p className="text-[20px] text-brand-dark">ממתי?</p>
              <Calendar className="w-[17px] h-[17px] text-brand-dark" />
            </div>
            {/* PLACEHOLDER INPUT - Replace with actual date picker */}
            <div className="bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-[20px] h-[174px] flex items-center justify-center">
              <span className="text-gray-400">Date Picker Placeholder</span>
            </div>
          </SelectorSection>

          {/* To Date */}
          <SelectorSection className="flex-1 gap-3">
            <div className="flex items-center gap-2 justify-start">
              <p className="text-[20px] text-brand-dark">עד מתי?</p>
              <Calendar className="w-[17px] h-[17px] text-brand-dark" />
            </div>
            {/* PLACEHOLDER INPUT - Replace with actual date picker */}
            <div className="bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-[20px] h-[174px] flex items-center justify-center">
              <span className="text-gray-400">Date Picker Placeholder</span>
            </div>
          </SelectorSection>
        </div>
      </SelectorContent>

      <SelectorAction>
        <SelectorButton className="flex items-center justify-center gap-3">
          <span>לצפייה בחבילה המשתלמת ביותר</span>
          <span className="rotate-180">←</span>
        </SelectorButton>
      </SelectorAction>
    </>
  );

  return (
    <Selector>
      <SelectorCard>
        {showDatePicker ? <DatePickerView /> : <MainView />}
      </SelectorCard>
    </Selector>
  );
}