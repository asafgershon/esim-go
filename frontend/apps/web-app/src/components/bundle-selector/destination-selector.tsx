"use client";

import { Suspense, lazy, useState, useMemo, useEffect } from "react";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import type { Destination } from "@/contexts/bundle-selector-context";
import { useCountries } from "@/hooks/useCountries";
import { useTrips } from "@/hooks/useTrips";
import {
  cn,
  ComboboxOption,
  FuzzyCombobox,
  SelectorLabel,
  SelectorSection,
  useIsMobile,
  useScrollSmootherLock,
} from "@workspace/ui";
import { ChevronsUpDownIcon } from "lucide-react";
import {
  DESTINATION_PLACEHOLDER,
  SEARCH_PLACEHOLDER,
  NO_RESULTS_MESSAGE,
} from "./destination-selector.constants";
import { getFlagUrl } from "@/utils/flags";

const MobileDestinationDrawer = lazy(() => import("./mobile-destination-drawer"));

export function DestinationSelector() {
  const {
    countryId,
    tripId,
    activeTab,
    handleDestinationChange,
    shouldFocusDestinationSelector,
    setShouldFocusDestinationSelector,
  } = useBundleSelector();

  const isMobile = useIsMobile({ tablet: true });
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // ✅ נועל רק בגלילה של דסקטופ
  useScrollSmootherLock({
    autoLock: !isMobile && comboboxOpen,
    preserveScrollPosition: false,
    preventTouchMove: false,
  });

  const sharedButtonStyles =
    "w-full bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-lg md:rounded-[15px] h-[34px] md:h-[60px] px-3 flex items-center cursor-pointer hover:border-brand-purple transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 text-[12px] md:text-[18px]";

  const comboboxClassName =
    "[&>button]:bg-brand-white [&>button]:border [&>button]:border-[rgba(10,35,46,0.2)] [&>button]:rounded-lg [&>button]:md:rounded-[15px] [&>button]:h-[34px] [&>button]:md:h-[60px] [&>button]:px-3 [&>button]:flex [&>button]:items-center [&>button]:cursor-pointer [&>button]:hover:border-brand-purple [&>button]:transition-colors [&>button:focus]:outline-none [&>button:focus]:ring-2 [&>button:focus]:ring-brand-purple [&>button:focus]:ring-offset-2 [&>button]:text-[12px] [&>button]:md:text-[18px]";

  const { countries = [] } = useCountries();
  const { trips = [] } = useTrips();

  const destination: Destination | null = useMemo(() => {
    if (countryId) {
      const country = countries.find((c) => c.id === countryId);
      if (country) {
        return {
          id: country.iso.toLowerCase(),
          name: country.nameHebrew || country.name || "",
          icon: getFlagUrl(country.iso),
        };
      }
    } else if (tripId) {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        return {
          id: trip.id,
          name: trip.nameHebrew || trip.name || "",
          icon: trip.icon || "",
        };
      }
    }
    return null;
  }, [countryId, tripId, countries, trips]);

  const comboboxOptions: ComboboxOption[] = useMemo(() => {
    const base =
      activeTab === "countries"
        ? countries.map((country) => ({
            value: `country-${country.id}`,
            label: country.nameHebrew || country.name || "",
            icon: getFlagUrl(country.iso),
            keywords: [country.nameHebrew, country.name].filter(Boolean) as string[],
          }))
        : trips.map((trip) => ({
            value: `trip-${trip.id}`,
            label: trip.nameHebrew || trip.name || "",
            icon: trip.icon,
            keywords: [trip.nameHebrew, trip.name].filter(Boolean) as string[],
          }));
    return base;
  }, [activeTab, countries, trips]);

  const getDestinationValue = () => {
    if (countryId) return `country-${countryId}`;
    if (tripId) return `trip-${tripId}`;
    return "";
  };

  const currentValue = getDestinationValue();

  // ✅ פתרון 2: אם פותחים חיפוש מחדש — מאפסים את הבחירה הקודמת לפני הצגה
  useEffect(() => {
    if (shouldFocusDestinationSelector) {
      if (isMobile) {
        handleDestinationChange("");
        setShowMobileSheet(true);
      } else {
        handleDestinationChange("");
        setComboboxOpen(true);
      }
      setShouldFocusDestinationSelector(false);
    }
  }, [shouldFocusDestinationSelector, isMobile, setShouldFocusDestinationSelector, handleDestinationChange]);

  return (
    <SelectorSection role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
      <SelectorLabel>{DESTINATION_PLACEHOLDER}</SelectorLabel>
      {isMobile ? (
        <div className="relative">
          <button
            id="destination-select"
            aria-label="בחר יעד"
            aria-expanded={showMobileSheet}
            aria-haspopup="dialog"
            onClick={(e) => {
              e.preventDefault();
              {/* handleDestinationChange(""); // איפוס לפני פתיחה -- הושבת כדי לשמור על הבחירה בפתיחה חוזרת */}
              setShowMobileSheet(true);
            }}
            className={`${sharedButtonStyles} relative`}
          >
            <ChevronsUpDownIcon
              size={isMobile ? 16 : 20}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                showMobileSheet && "rotate-180",
                "opacity-30"
              )}
            />
            <span className={cn(
              "pr-8 text-brand-dark text-md md:text-[18px] leading-[26px]",
              !destination?.name && "opacity-30"
            )}>
              {destination?.name || DESTINATION_PLACEHOLDER}
            </span>
          </button>

          <Suspense>
            {showMobileSheet && (
            <MobileDestinationDrawer
              options={comboboxOptions}
                  initialValue={currentValue} // הוספנו: העברת הערך הנוכחי
              onValueChangeAction={(v: string) => {
                handleDestinationChange(v);
                setShowMobileSheet(false);
              }}
              onCloseAction={() => setShowMobileSheet(false)}
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
            open={comboboxOpen}
            onOpenChange={(open) => {
              setComboboxOpen(open);
              if (open) handleDestinationChange("");
            }}
          />
        </div>
      )}
    </SelectorSection>
  );
}