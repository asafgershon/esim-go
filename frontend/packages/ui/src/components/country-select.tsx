"use client";

import * as React from "react";
import { FuzzyCombobox } from "./combobox";
import type { ComboboxOption } from "./combobox";
import { useMediaQuery } from "../hooks/use-media-query";
import { useCountries } from "../hooks/use-countries";
import { Drawer } from "vaul";
import { Input, Button } from "@workspace/ui";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export interface Country {
  id: string;
  name: string;
  iso: string;
  flag: string;
  keywords?: string[];
}

export interface CountrySelectProps {
  countries?: Country[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onLoadCountries?: () => Promise<Country[]>;
}

export function CountrySelect({
  countries = [],
  value,
  onValueChange,
  placeholder = "Select country...",
  searchPlaceholder = "Search countries...",
  emptyMessage = "No countries found.",
  className,
  disabled = false,
  loading = false,
  onLoadCountries,
}: CountrySelectProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [showMobileSheet, setShowMobileSheet] = React.useState(false);
  const [internalCountries, setInternalCountries] = React.useState(countries);
  const [isLoading, setIsLoading] = React.useState(loading);

  // Load countries if fetcher provided
  React.useEffect(() => {
    if (onLoadCountries && internalCountries.length === 0) {
      setIsLoading(true);
      onLoadCountries()
        .then(setInternalCountries)
        .catch(() => setInternalCountries([]))
        .finally(() => setIsLoading(false));
    }
  }, [onLoadCountries]);

  // Update internal countries if prop changes
  React.useEffect(() => {
    if (countries.length > 0) {
      setInternalCountries(countries);
    }
  }, [countries]);

  // Transform countries to ComboboxOption format
  const options: ComboboxOption[] = React.useMemo(
    () =>
      internalCountries.map((country) => ({
        value: country.id,
        label: country.name,
        icon: country.flag,
        keywords: country.keywords,
      })),
    [internalCountries]
  );

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    setShowMobileSheet(false);
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  // Mobile experience with sheet
  if (isMobile) {
    return (
      <>
        <div className="relative">
          <FuzzyCombobox
            options={options}
            value={value}
            onValueChange={() => {}} // No-op, handled by sheet
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            className={cn("pointer-events-none select-none", className)}
            disabled
          />
          {/* Overlay button to open sheet */}
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) setShowMobileSheet(true);
            }}
          />
        </div>
        {showMobileSheet && (
          <MobileCountrySheet
            options={options}
            value={value}
            onValueChange={handleValueChange}
            onClose={() => setShowMobileSheet(false)}
            isOpen={showMobileSheet}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
          />
        )}
      </>
    );
  }

  // Desktop experience with dropdown
  return (
    <FuzzyCombobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      className={className}
      disabled={disabled}
    />
  );
}

// Mobile sheet component
interface MobileCountrySheetProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  onClose: () => void;
  isOpen: boolean;
  searchPlaceholder: string;
  emptyMessage: string;
}

function MobileCountrySheet({
  options,
  value,
  onValueChange,
  onClose,
  isOpen,
  searchPlaceholder,
  emptyMessage,
}: MobileCountrySheetProps) {
  const [search, setSearch] = React.useState("");

  // Filter options by search
  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  }, [search, options]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-card text-card-foreground flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-card rounded-t-[10px] flex-1 flex flex-col">
            {/* Drag Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Drawer.Title className="text-lg font-semibold">
                Select Country
              </Drawer.Title>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-full pl-10 pr-4"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={value === opt.value ? "secondary" : "ghost"}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-lg justify-start min-h-[3rem]",
                        value === opt.value && "font-semibold"
                      )}
                      onClick={() => onValueChange(opt.value)}
                      type="button"
                    >
                      {opt.icon && (
                        <span className="text-xl flex-shrink-0">{opt.icon}</span>
                      )}
                      <span className="flex-1 text-left">{opt.label}</span>
                      {value === opt.value && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom spacing for safe area */}
            <div className="h-4 flex-shrink-0" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}