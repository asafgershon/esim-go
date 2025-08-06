"use client";

import { Suspense, lazy, useState, useMemo } from "react";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import type { Destination } from "@/contexts/bundle-selector-context";
import { useCountries } from "@/hooks/useCountries";
import { useTrips } from "@/hooks/useTrips";
import {
  ComboboxOption,
  FuzzyCombobox,
  SelectorLabel,
  SelectorSection,
} from "@workspace/ui";
import { ChevronsUpDownIcon } from "./icons";
import { 
  DESTINATION_PLACEHOLDER, 
  SEARCH_PLACEHOLDER, 
  NO_RESULTS_MESSAGE 
} from "./destination-selector.constants";

const MobileDestinationDrawer = lazy(
  () => import("./mobile-destination-drawer")
);

export function DestinationSelector() {
  const {
    countryId,
    tripId,
    activeTab,
    isMobile,
    handleDestinationChange,
  } = useBundleSelector();
  
  // Local state for mobile sheet
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  
  // Shared button styles for consistent appearance across mobile and desktop
  const sharedButtonStyles = "w-full bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-lg md:rounded-[15px] h-[34px] md:h-[60px] px-3 flex items-center cursor-pointer hover:border-brand-purple transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 text-[12px] md:text-[18px]";
  
  // FuzzyCombobox button styles using CSS selector targeting
  const comboboxClassName = "[&>button]:bg-brand-white [&>button]:border [&>button]:border-[rgba(10,35,46,0.2)] [&>button]:rounded-lg [&>button]:md:rounded-[15px] [&>button]:h-[34px] [&>button]:md:h-[60px] [&>button]:px-3 [&>button]:flex [&>button]:items-center [&>button]:cursor-pointer [&>button]:hover:border-brand-purple [&>button]:transition-colors [&>button:focus]:outline-none [&>button:focus]:ring-2 [&>button:focus]:ring-brand-purple [&>button:focus]:ring-offset-2 [&>button]:text-[12px] [&>button]:md:text-[18px]";
  
  // Fetch countries and trips data from GraphQL
  const { countries = [] } = useCountries();
  const { trips = [] } = useTrips();

  // Compute destination from current selection
  const destination: Destination | null = useMemo(() => {
    if (countryId) {
      const country = countries.find((c) => c.id === countryId);
      if (country) {
        return {
          id: country.iso.toLowerCase(), // ISO code for countries
          name: country.nameHebrew || country.name || "",
          icon: country.flag || "",
        };
      }
    } else if (tripId) {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        return {
          id: trip.id, // Region ID for trips
          name: trip.nameHebrew || trip.name || "",
          icon: trip.icon || "",
        };
      }
    }
    return null;
  }, [countryId, tripId, countries, trips]);

  // Create combobox options based on active tab
  const comboboxOptions: ComboboxOption[] = useMemo(() => {
    if (activeTab === "countries") {
      return countries.map((country) => ({
        value: `country-${country.id}`,
        label: country.nameHebrew || country.name || "",
        icon: country.flag || undefined,
        keywords: [country.nameHebrew, country.name].filter(
          Boolean
        ) as string[], // Hebrew and English names
      }));
    } else {
      return trips.map((trip) => ({
        value: `trip-${trip.id}`,
        label: trip.nameHebrew || trip.name || "",
        icon: trip.icon,
        keywords: [trip.nameHebrew, trip.name].filter(Boolean) as string[], // Hebrew and English names
      }));
    }
  }, [activeTab, countries, trips]);

  const getDestinationValue = () => {
    if (countryId) return `country-${countryId}`;
    if (tripId) return `trip-${tripId}`;
    return "";
  };

  const currentValue = getDestinationValue();

  return (
    <SelectorSection
      role="tabpanel"
      id={`${activeTab}-panel`}
      aria-labelledby={`${activeTab}-tab`}
    >
      <SelectorLabel>לאן נוסעים?</SelectorLabel>
      {isMobile ? (
        <div className="relative">
          <button
            id="destination-select"
            aria-label="בחר יעד"
            aria-expanded={showMobileSheet}
            aria-haspopup="dialog"
            onClick={(e) => {
              e.preventDefault();
              setShowMobileSheet(true);
            }}
            className={`${sharedButtonStyles} relative`}
          >
            <span className="text-brand-dark text-[12px] md:text-[18px] leading-[26px] opacity-50">
              {destination?.name || DESTINATION_PLACEHOLDER}
            </span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronsUpDownIcon />
            </div>
          </button>

          <Suspense fallback={<div>...</div>}>
            {showMobileSheet && (
              <MobileDestinationDrawer
                options={comboboxOptions}
                value={currentValue}
                onValueChange={(v) => {
                  handleDestinationChange(v);
                  setShowMobileSheet(false);
                }}
                onClose={() => setShowMobileSheet(false)}
                isOpen={showMobileSheet}
              />
            )}
          </Suspense>
        </div>
      ) : (
        <div className="relative">
          <FuzzyCombobox
            options={comboboxOptions}
            value={currentValue}
            onValueChange={handleDestinationChange}
            placeholder={DESTINATION_PLACEHOLDER}
            searchPlaceholder={SEARCH_PLACEHOLDER}
            emptyMessage={NO_RESULTS_MESSAGE}
            className={comboboxClassName}
          />
        </div>
      )}
    </SelectorSection>
  );
}