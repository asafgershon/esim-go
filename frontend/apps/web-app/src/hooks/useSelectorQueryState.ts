"use client";

import { useQueryStates, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';

// Types for the selector query state
export type ActiveTab = "countries" | "trips";

export interface SelectorQueryState {
  numOfDays: number;
  countryId: string;
  tripId: string;
  activeTab: ActiveTab;
}

export interface SelectorQueryStateActions {
  setNumOfDays: (days: number) => void;
  setCountryId: (id: string | null) => void;
  setTripId: (id: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setQueryStates: (values: Partial<SelectorQueryState>) => void;
}

/**
 * Custom hook for managing bundle selector URL query state
 * Provides centralized logic for URL parameter management
 */
export function useSelectorQueryState() {
  const [queryStates, setQueryStatesInternal] = useQueryStates(
    {
      numOfDays: parseAsInteger.withDefault(7),
      countryId: parseAsString.withDefault(""),
      tripId: parseAsString.withDefault(""),
      activeTab: parseAsStringLiteral(["countries", "trips"]).withDefault("countries"),
    },
    { shallow: true }
  );

  const { numOfDays, countryId, tripId, activeTab } = queryStates;

  // Individual setters
  const setNumOfDays = (days: number) => {
    setQueryStatesInternal((state) => ({ ...state, numOfDays: days }));
  };

  const setCountryId = (id: string | null) => {
    setQueryStatesInternal((state) => ({ ...state, countryId: id || "" }));
  };

  const setTripId = (id: string | null) => {
    setQueryStatesInternal((state) => ({ ...state, tripId: id || "" }));
  };

  const setActiveTab = (tab: ActiveTab) => {
    setQueryStatesInternal((state) => ({ ...state, activeTab: tab }));
  };

  // Batch setter for multiple values
  const setQueryStates = (values: Partial<SelectorQueryState>) => {
    setQueryStatesInternal((state) => ({ ...state, ...values }));
  };

  return {
    // State values
    numOfDays,
    countryId,
    tripId,
    activeTab,
    
    // Actions
    setNumOfDays,
    setCountryId,
    setTripId,
    setActiveTab,
    setQueryStates,
  };
}