"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { cn } from "../lib/utils";

export interface Country {
  id: string;
  name: string;
  iso: string;
  flag: string;
  keywords?: string[];
}

export interface MultiCountrySelectProps {
  countries?: Country[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onLoadCountries?: () => Promise<Country[]>;
  maxSelection?: number;
}

export function MultiCountrySelect({
  countries = [],
  value = [],
  onValueChange,
  placeholder = "Select countries...",
  searchPlaceholder = "Search countries...",
  emptyMessage = "No countries found.",
  className,
  disabled = false,
  loading = false,
  onLoadCountries,
  maxSelection,
}: MultiCountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
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

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!searchValue.trim()) return internalCountries;
    
    const searchLower = searchValue.toLowerCase();
    return internalCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.iso.toLowerCase().includes(searchLower) ||
        country.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  }, [searchValue, internalCountries]);

  // Get selected countries
  const selectedCountries = React.useMemo(
    () => internalCountries.filter((country) => value.includes(country.id)),
    [internalCountries, value]
  );

  const handleSelect = (countryId: string) => {
    const newValue = value.includes(countryId)
      ? value.filter((id) => id !== countryId)
      : maxSelection && value.length >= maxSelection
      ? value
      : [...value, countryId];
    
    onValueChange?.(newValue);
  };

  const handleRemove = (countryId: string) => {
    onValueChange?.(value.filter((id) => id !== countryId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select countries"
            className={cn("w-full justify-between", className)}
            disabled={disabled || isLoading}
          >
            <span className={cn("text-left", !value.length && "text-muted-foreground")}>
              {value.length > 0
                ? `${value.length} ${value.length === 1 ? 'country' : 'countries'} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {filteredCountries.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={country.id}
                      value={country.id}
                      onSelect={() => handleSelect(country.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {country.flag && (
                          <span className="text-lg">{country.flag}</span>
                        )}
                        <span>{country.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {country.iso}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value.includes(country.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected countries as badges */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCountries.map((country) => (
            <Badge
              key={country.id}
              variant="secondary"
              className="gap-1"
            >
              {country.flag && <span>{country.flag}</span>}
              <span>{country.name}</span>
              <button
                type="button"
                className="ml-1 hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(country.id);
                }}
                aria-label={`Remove ${country.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}