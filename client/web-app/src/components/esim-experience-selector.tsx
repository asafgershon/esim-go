"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SliderWithValue } from "@/components/ui/slider";
import { Combobox } from "@/components/ui/combobox";
import { EsimSkeleton } from "./esim-skeleton";
import { countries as countriesData } from "countries-list";
import { hebrewNames } from "./countries-hebrew";
import type { CountryISOCode } from "@/lib/types";

// Types
interface Country {
  id: string;
  name: string;
  nameHebrew: string;
  flag: string;
  tagline: string;
  basePrice: number;
}

interface Trip {
  id: string;
  name: string;
  nameHebrew: string;
  icon: string;
  countries: string[];
  description: string;
  countryCount: number;
  basePrice: number;
}

// Convert country code to flag emoji
const getFlagEmoji = (countryCode: string): string => {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
};

// Taglines for countries
const taglines: string[] = [
  'חיבור מושלם',
  'נתונים ללא סוף', 
  'חיבור רצוף',
  'בלי גבולות',
  'חופש מלא',
  'תמיד מחובר',
  'רשת אמינה',
  'כיסוי מלא',
  'מהירות גבוהה',
  'חיבור יציב'
];

// Transform countries-list data to our Country interface
const transformCountriesData = (): Country[] => {
  const entries = Object.entries(countriesData);
  
  return entries.map(([code, countryInfo], index) => ({
    id: code.toLowerCase(),
    name: countryInfo.name,
    nameHebrew: hebrewNames[code] || countryInfo.name,
    flag: getFlagEmoji(code),
    tagline: taglines[index % taglines.length],
    basePrice: 2.5 // Default base price, you can adjust this logic
  }))
  .sort((a, b) => a.nameHebrew.localeCompare(b.nameHebrew, 'he')); // Sort by Hebrew name
};

// Generate countries data
const countries: Country[] = transformCountriesData();

const trips: Trip[] = [
  {
    id: "south-america",
    name: "Great South America",
    nameHebrew: "דרום אמריקה הגדולה",
    icon: "🌍",
    countries: ["ארגנטינה", "ברזיל", "צ'ילה", "פרו"],
    description: "מסע בין תרבויות וטבע פראי",
    countryCount: 4,
    basePrice: 5.04,
  },
  {
    id: "africa-safari",
    name: "Real African Safari",
    nameHebrew: "ספארי אפריקאי אמיתי",
    icon: "🦁",
    countries: ["קניה", "טנזניה", "דרום אפריקה"],
    description: "הרפתקה בטבע הפראי",
    countryCount: 21,
    basePrice: 5.04,
  },
  {
    id: "europe-classic",
    name: "Classic Europe",
    nameHebrew: "קלאסיקת אירופה",
    icon: "🏰",
    countries: ["צרפת", "איטליה", "ספרד", "גרמניה"],
    description: "מורשת והיסטוריה עתיקה",
    countryCount: 35,
    basePrice: 2.5,
  },
  {
    id: "east-asia",
    name: "Traditional East Asia",
    nameHebrew: "מזרח אסיה מסורתי",
    icon: "🍜",
    countries: ["יפן", "דרום קוריאה", "תאילנד"],
    description: "תרבות מסורתית ומודרנית",
    countryCount: 17,
    basePrice: 3.0,
  },
  {
    id: "caribbean",
    name: "Caribbean Islands",
    nameHebrew: "איי הקריביים",
    icon: "🏖️",
    countries: ["22 יעדים", "חופש מוחלט"],
    description: "חופים טרופיים ומים צלולים",
    countryCount: 22,
    basePrice: 5.4,
  },
];

// Calculate volume discount
const getVolumeDiscount = (days: number): number => {
  if (days >= 21) return 0.8; // 20% discount
  if (days >= 14) return 0.85; // 15% discount
  if (days >= 10) return 0.9; // 10% discount
  if (days >= 7) return 0.95; // 5% discount
  return 1; // No discount
};

export function EsimExperienceSelector() {
  // URL state management
  const [numOfDays, setNumOfDays] = useQueryState('numOfDays', parseAsInteger.withDefault(7));
  const [countryId, setCountryId] = useQueryState('countryId', parseAsString);
  const [tripId, setTripId] = useQueryState('tripId', parseAsString);
  
  // Local state for UI
  const [activeTab, setActiveTab] = useState<"countries" | "trips">("countries");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading on component mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Create combobox options based on active tab
  const comboboxOptions = useMemo(() => {
    if (activeTab === "countries") {
      return countries.map((country) => ({
        value: `country-${country.id}`,
        label: country.nameHebrew,
        icon: country.flag,
        keywords: [country.nameHebrew, country.name], // Hebrew and English names
      }));
    } else {
      return trips.map((trip) => ({
        value: `trip-${trip.id}`,
        label: trip.nameHebrew,
        icon: trip.icon,
        keywords: [trip.nameHebrew, trip.name], // Hebrew and English names
      }));
    }
  }, [activeTab]);

  // Get selected destination details
  const selectedDestinationData = useMemo(() => {
    if (countryId) {
      return { type: "country" as const, data: countries.find((c) => c.id === countryId) };
    } else if (tripId) {
      return { type: "trip" as const, data: trips.find((t) => t.id === tripId) };
    }
    
    return null;
  }, [countryId, tripId]);

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!selectedDestinationData?.data) return null;
    
    const basePrice = selectedDestinationData.data.basePrice;
    const days = numOfDays;
    const volumeDiscount = getVolumeDiscount(days);
    const dailyPrice = basePrice * volumeDiscount;
    const totalPrice = dailyPrice * days;
    
    return {
      dailyPrice,
      totalPrice,
      hasDiscount: volumeDiscount < 1,
      days,
    };
  }, [selectedDestinationData, numOfDays]);

  const handleTabChange = (tab: "countries" | "trips") => {
    setActiveTab(tab);
    // Clear selection when switching tabs
    setCountryId(null);
    setTripId(null);
  };

  const handleDestinationChange = (value: string) => {
    if (!value) {
      setCountryId(null);
      setTripId(null);
      return;
    }
    
    const [type, id] = value.split("-");
    if (type === "country") {
      setCountryId(id as CountryISOCode);
      setTripId(null);
    } else if (type === "trip") {
      setTripId(id);
      setCountryId(null);
    }
  };

  const isReadyToPurchase = (countryId || tripId) && numOfDays >= 7;

  // Show loading skeleton initially
  if (isLoading) {
    return <EsimSkeleton />;
  }

  return (
    <div 
      className="w-full max-w-sm mx-auto bg-card rounded-2xl shadow-lg overflow-hidden" 
      dir="rtl"
      style={{ fontFamily: '"Segoe UI", "Tahoma", "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-muted to-secondary p-6 text-center">
        <div className="text-2xl mb-2">🌍</div>
        <h1 className="text-xl font-bold text-card-foreground mb-1">חבילות eSIM לטיולים</h1>
        <p className="text-sm text-muted-foreground">חיבור מושלם בכל מקום בעולם</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted p-1 m-4 rounded-xl">
        <button
          onClick={() => handleTabChange("countries")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200",
            activeTab === "countries"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          מדינות
        </button>
        <button
          onClick={() => handleTabChange("trips")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200",
            activeTab === "trips"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          טיולים
        </button>
      </div>

      {/* Destination Selection */}
      <div className="px-4 mb-6">
        <Combobox
          options={comboboxOptions}
          value={countryId ? `country-${countryId}` : tripId ? `trip-${tripId}` : ""}
          onValueChange={handleDestinationChange}
          placeholder={(countryId || tripId) ? "שנה יעד..." : "לאן נוסעים?"}
          emptyMessage="לא נמצאו תוצאות"
          className="border-border focus:border-ring focus:ring-ring/20 rtl"
        />
      </div>

      {/* Duration Selection - Always Visible */}
      <div className="px-4 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-card-foreground">כמה ימים?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="px-2">
              <SliderWithValue
                value={[numOfDays]}
                onValueChange={(value) => setNumOfDays(value[0])}
                max={30}
                min={1}
                className="w-full"
                dir="rtl"
              />
             
            </div>
          </div>
        </div>
      </div>

      {/* Selected Destination and Pricing */}
      {selectedDestinationData && (
        <div className="px-4 mb-6">
          <Card className="p-4 border-primary bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {selectedDestinationData.type === "country" 
                    ? (selectedDestinationData.data as Country)?.flag || ""
                    : (selectedDestinationData.data as Trip)?.icon || ""}
                </span>
                <div>
                                     <h3 className="font-medium text-card-foreground">
                     {selectedDestinationData.data?.nameHebrew}
                   </h3>
                   <p className="text-sm text-muted-foreground">
                     {selectedDestinationData.type === "country" 
                       ? (selectedDestinationData.data as Country)?.tagline
                       : (selectedDestinationData.data as Trip)?.description}
                   </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCountryId(null);
                  setTripId(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{pricing.days} ימים ללא הגבלה</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">${pricing.dailyPrice.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">ליום</span>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                {pricing.hasDiscount && (
                  <div className="text-sm text-primary font-medium">
                    יותר ימים = מחירים נמוכים יותר!
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">סה״כ: ${pricing.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Purchase Button */}
      <div className="p-4 border-t bg-muted">
        <Button
          className={cn(
            "w-full h-12 font-medium transition-all duration-200",
            isReadyToPurchase
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
          )}
          disabled={!isReadyToPurchase}
        >
          {isReadyToPurchase ? "קנה עכשיו" : "בחר יעד ומשך זמן"}
        </Button>
      </div>
    </div>
  );
} 