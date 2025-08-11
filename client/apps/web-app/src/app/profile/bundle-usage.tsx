"use client";

import { useState } from 'react';
import { Wifi, Calendar, TrendingUp, RotateCcw } from 'lucide-react';
import { Card } from '@workspace/ui';
import { Button } from '@workspace/ui';
import { ActivationMethodSelector } from '@/components/esim/ActivationMethodSelector';
import { InstallationLinks } from '@/__generated__/graphql';

interface BundleUsageProps {
  planName?: string;
  totalDays?: number;
  currentDay?: number;
  totalDataUsed?: string;
  dailyThreshold?: string;
  installationLinks?: InstallationLinks;
  qrCode?: string | null;
  iccid?: string;
}

const BundleUsage: React.FC<BundleUsageProps> = ({
  planName = "Europe 30-Day Unlimited",
  totalDays = 30,
  currentDay = 12,
  totalDataUsed = "45.2 GB",
  dailyThreshold = "2 GB",
  installationLinks,
  qrCode,
  iccid = "8910300001234567890"
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  // Mock daily usage data
  const dailyUsage = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    if (day <= currentDay) {
      // Past days - actual usage
      const usage = Math.random() * 3; // 0-3 GB
      return {
        day,
        usage,
        isThrottled: usage > 2,
        isToday: day === currentDay,
        isPast: day < currentDay
      };
    }
    // Future days
    return {
      day,
      usage: 0,
      isThrottled: false,
      isToday: false,
      isPast: false
    };
  });

  const [selectedDay, setSelectedDay] = useState(currentDay);

  // Calculate the circumference for the progress ring
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (currentDay / totalDays) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Create segments for daily breakdown
  const segmentAngle = 360 / totalDays;
  
  interface DayData {
    day: number;
    usage: number;
    isThrottled: boolean;
    isToday: boolean;
    isPast: boolean;
  }
  
  const DaySegment = ({ day, index, data }: { day: number; index: number; data: DayData }) => {
    const angle = (index * segmentAngle) - 90; // Start from top
    const x1 = 100 + 75 * Math.cos((angle * Math.PI) / 180);
    const y1 = 100 + 75 * Math.sin((angle * Math.PI) / 180);
    const x2 = 100 + 90 * Math.cos((angle * Math.PI) / 180);
    const y2 = 100 + 90 * Math.sin((angle * Math.PI) / 180);
    
    let strokeColor = "#e5e7eb"; // Default gray
    let strokeWidth = 2;
    
    if (data.isPast) {
      strokeColor = data.isThrottled ? "#f59e0b" : "#10b981"; // Amber for throttled, green for normal
      strokeWidth = 3;
    } else if (data.isToday) {
      strokeColor = "#3b82f6"; // Blue for today
      strokeWidth = 4;
    }
    
    return (
      <g key={day}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setSelectedDay(day)}
        />
        {data.isToday && (
          <circle
            cx={x2}
            cy={y2}
            r="4"
            fill="#3b82f6"
            className="animate-pulse"
          />
        )}
      </g>
    );
  };

  const selectedDayData = dailyUsage[selectedDay - 1];

  // Mock installation links if not provided
  const mockInstallationLinks: InstallationLinks = installationLinks || {
    qrCodeData: `LPA:1${"$"}esim-go.com${"$"}8910300001234567890`,
    manual: {
      smDpAddress: "esim-go.com",
      activationCode: "1234-5678-9012",
      confirmationCode: "ABC123"
    }
  };

  return (
    <div className="w-full">
      <div 
        className="relative w-full" 
        style={{ 
          perspective: '1000px'
        }}
      >
        <div
          className="relative w-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front of card - Usage */}
          <Card 
            className="p-6 w-full overflow-auto" 
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              visibility: isFlipped ? 'hidden' : 'visible'
            }}
          >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Wifi className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">חבילה פעילה</h3>
            <p className="text-sm text-gray-500">{planName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{totalDataUsed}</div>
          <div className="text-sm text-gray-500">סה״כ שימוש</div>
        </div>
      </div>

      {/* Circular Progress with Daily Segments */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width="200" height="200" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#f3f4f6"
            strokeWidth="8"
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
          
          {/* Daily segments */}
          {dailyUsage.map((data, index) => (
            <DaySegment
              key={data.day}
              day={data.day}
              index={index}
              data={data}
            />
          ))}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900">
            {currentDay}
          </div>
          <div className="text-sm text-gray-500">
            מתוך {totalDays} ימים
          </div>
          <div className="text-xs text-gray-400 mt-1">
            נתונים ללא הגבלה
          </div>
        </div>
      </div>

      {/* Daily Details */}
      <div className="space-y-4">
        {/* Selected Day Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="font-medium">
                יום {selectedDay}
                {selectedDayData.isToday && " (היום)"}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {selectedDayData.usage.toFixed(1)} GB שימוש
            </div>
          </div>
          
          {/* Daily usage bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                selectedDayData.isThrottled 
                  ? 'bg-amber-500' 
                  : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min((selectedDayData.usage / 3) * 100, 100)}%` 
              }}
            />
            {/* Threshold marker */}
            <div 
              className="absolute top-0 w-0.5 h-full bg-red-400"
              style={{ left: '66.67%' }} // 2GB threshold at 2/3 of 3GB scale
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 GB</span>
            <span className="text-red-500">סף: {dailyThreshold}</span>
            <span>3+ GB</span>
          </div>
          
          {selectedDayData.isThrottled && (
            <div className="flex items-center gap-1 mt-2 text-amber-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">מהירות מופחתת לאחר חריגה מהסף</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">מהירות רגילה</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-gray-600">מהירות מופחתת</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-3 h-3" />
            <span>צפייה בפרטי eSIM</span>
          </Button>
        </div>
      </div>
    </Card>

        {/* Back of card - eSIM Activation Methods */}
        <div 
          className="w-full absolute top-0 left-0 overflow-auto" 
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            visibility: isFlipped ? 'visible' : 'hidden'
          }}
        >
          <div className="relative">
            {/* Back button overlay */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFlipped(false)}
              className="absolute top-4 left-4 z-10 h-8 w-8 bg-white/80 backdrop-blur hover:bg-white/90"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {/* ActivationMethodSelector component */}
            <ActivationMethodSelector
              installationLinks={mockInstallationLinks}
              qrCode={qrCode}
              iccid={iccid}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BundleUsage;