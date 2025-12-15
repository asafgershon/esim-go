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
  //const [comboboxOpen, setComboboxOpen] = useState(false);

  // ✅ נועל רק בגלילה של דסקטופ
  // useScrollSmootherLock({
  //   autoLock: !isMobile && comboboxOpen,
  //   preserveScrollPosition: false,
  //   preventTouchMove: false,
  // });
  

  const sharedButtonStyles =
    "w-full bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-lg md:rounded-[15px] h-[34px] md:h-[60px] px-3 flex items-center cursor-pointer hover:border-brand-purple transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 text-[16px] md:text-[18px]";

  const comboboxClassName =
    "[&>button]:bg-brand-white [&>button]:border [&>button]:border-[rgba(10,35,46,0.2)] [&>button]:rounded-lg [&>button]:md:rounded-[15px] [&>button]:h-[34px] [&>button]:md:h-[60px] [&>button]:px-3 [&>button]:flex [&>button]:items-center [&>button]:cursor-pointer [&>button]:hover:border-brand-purple [&>button]:transition-colors [&>button:focus]:outline-none [&>button:focus]:ring-2 [&>button:focus]:ring-brand-purple [&>button:focus]:ring-offset-2 [&>button]:text-[16px] [&>button]:md:text-[18px]";

  const { countries = [] } = useCountries();
  const { trips = [] } = useTrips();

const COUNTRY_SYNONYMS: Record<string, string[]> = {
  GB: ["אנגליה", "בריטניה", "לונדון", "UK", "United Kingdom", "Great Britain", "England", "Britain"],
  US: ["ארה״ב", "ארצות הברית", "אמריקה", "USA", "United States", "America", "NYC", "New York", "LA", "Los Angeles"],
  FR: ["צרפת", "פריז", "France", "Paris", "Marseille", "Bordeaux"],
  ES: ["ספרד", "מדריד", "ברצלונה", "Spain", "Madrid", "Barcelona", "Valencia"],
  IT: ["איטליה", "רומא", "מילאנו", "ונציה", "Italy", "Rome", "Milan", "Venice", "Naples"],
  DE: ["גרמניה", "ברלין", "Germany", "Berlin", "Munich", "Hamburg", "Frankfurt"],
  NL: ["הולנד", "אמסטרדם", "Netherlands", "Holland", "Amsterdam", "Rotterdam"],
  BE: ["בלגיה", "בריסל", "Belgium", "Brussels", "Antwerp"],
  AT: ["אוסטריה", "וינה", "אינסברוק", "זלצבורג", "Austria", "Vienna", "Innsbruck", "Salzburg"],
  CH: ["שוויץ", "ציריך", "Geneva", "Zurich", "Switzerland", "Basel"],
  PT: ["פורטוגל", "ליסבון", "פורטו", "Portugal", "Lisbon", "Porto"],
  GR: ["יוון", "אתונה", "סלוניקי", "Greece", "Athens", "Thessaloniki", "Crete", "Santorini"],
  NO: ["נורווגיה", "אוסלו", "Norway", "Oslo", "Bergen"],
  SE: ["שוודיה", "סטוקהולם", "Sweden", "Stockholm", "Gothenburg"],
  FI: ["פינלנד", "הלסינקי", "Finland", "Helsinki"],
  DK: ["דנמרק", "קופנהגן", "Denmark", "Copenhagen"],
  CZ: ["צ'כיה", "פראג", "Czechia", "Czech Republic", "Prague"],
  PL: ["פולין", "ורשה", "וורשה", "קרקוב", "Poland", "Warsaw", "Krakow"],
  HU: ["הונגריה", "בודפשט", "Hungary", "Budapest"],
  RO: ["רומניה", "בוקרשט", "Romania", "Bucharest", "Cluj"],
  BG: ["בולגריה", "סופיה", "Bulgaria", "Sofia", "Varna"],
  HR: ["קרואטיה", "זאגרב", "דוברובניק", "Croatia", "Zagreb", "Dubrovnik", "Split"],
  RS: ["סרביה", "בלגרד", "Serbia", "Belgrade"],
  UA: ["אוקראינה", "קייב", "Ukraine", "Kyiv", "Lviv"],
  IE: ["אירלנד", "דבלין", "Ireland", "Dublin"],
  IS: ["איסלנד", "רייקיאוויק", "Iceland", "Reykjavik"],
  LT: ["ליטא", "וילנה", "Lithuania", "Vilnius"],
  LV: ["לטביה", "ריגה", "Latvia", "Riga"],
  EE: ["אסטוניה", "טאלין", "Estonia", "Tallinn"],
  SK: ["סלובקיה", "ברטיסלבה", "Slovakia", "Bratislava"],
  SI: ["סלובניה", "ליובליאנה", "Slovenia", "Ljubljana"],
  MT: ["מלטה", "Valletta", "Malta"],
  CY: ["קפריסין", "ניקוסיה", "Cyprus", "Nicosia", "Ayia Napa", "Larnaca"],

  // 🌎 פופולריים נוספים
  TH: ["תאילנד", "Bangkok", "Thailand", "Phuket", "Chiang Mai"],
  JP: ["יפן", "Tokyo", "Osaka", "Japan", "Kyoto"],
  CN: ["סין", "Beijing", "Shanghai", "China"],
  TR: ["טורקיה", "איסטנבול", "Turkey", "Istanbul", "Antalya"],
  AE: ["איחוד האמירויות", "דובאי", "אבו דאבי", "UAE", "Dubai", "Abu Dhabi"],
  EG: ["מצרים", "קהיר", "Egypt", "Cairo", "Sharm"],
};


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
keywords: [
  country.nameHebrew,
  country.name,
  ...(COUNTRY_SYNONYMS[country.iso] || []),
].filter(Boolean) as string[],
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

  // ✅ פתיחה מחודשת דרך context — איפוס חיפוש בלבד
  useEffect(() => {
    if (shouldFocusDestinationSelector) {
      if (isMobile) {
        setShowMobileSheet(true);
      }
      // else {
      //   setComboboxOpen(true);
      // }
      setShouldFocusDestinationSelector(false);
    }
  }, [shouldFocusDestinationSelector, isMobile, setShouldFocusDestinationSelector]);

  return (
        <SelectorSection
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
          className="!mt-0 !pt-0 !mb-0 !pb-0"
        >
        <SelectorLabel>{DESTINATION_PLACEHOLDER}</SelectorLabel>
      {isMobile ? (
        <div className="relative min-h-[34px] md:min-h-[60px]">
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
            <ChevronsUpDownIcon
              size={isMobile ? 16 : 20}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                showMobileSheet && "rotate-180",
                "opacity-30"
              )}
            />
            <span
              className={cn(
                "pr-8 text-brand-dark text-md md:text-[18px] leading-[26px]",
                !destination?.name && "opacity-30"
              )}
            >
              {destination?.name || DESTINATION_PLACEHOLDER}
            </span>
          </button>

          <Suspense>
            {showMobileSheet && (
              <MobileDestinationDrawer
                options={comboboxOptions}
                initialValue={currentValue}
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
        <div className="relative min-h-[60px]">
          <FuzzyCombobox
            options={comboboxOptions}
            value={currentValue}
            onValueChange={handleDestinationChange}
            placeholder={DESTINATION_PLACEHOLDER}
            searchPlaceholder={SEARCH_PLACEHOLDER}
            emptyMessage={NO_RESULTS_MESSAGE}
            className={comboboxClassName}
            // open={comboboxOpen}
            // onOpenChange={(open) => {
            //   setComboboxOpen(open);
            // }}
          />
        </div>
      )}
    </SelectorSection>
  );
}
