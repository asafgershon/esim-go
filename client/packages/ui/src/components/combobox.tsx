"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
  keywords?: string[];
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

// Basic Combobox following shadcn/ui pattern
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span className="text-lg">{selectedOption.icon}</span>
                )}
                <span>{selectedOption.label}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full max-w-sm p-0 bg-background"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const selectedValue =
                      currentValue === value ? "" : currentValue;
                    onValueChange?.(selectedValue);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {option.icon && (
                      <span className="text-lg">{option.icon}</span>
                    )}
                    <span>{option.label}</span>
                  </div>
                  {value === option.value && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Enhanced Combobox with Fuse.js integration for fuzzy search
interface FuzzyComboboxProps extends ComboboxProps {
  searchPlaceholder?: string;
  fuseOptions?: {
    threshold?: number;
    distance?: number;
    minMatchCharLength?: number;
  };
}

export function FuzzyCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  fuseOptions = {},
}: FuzzyComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Configure Fuse.js for fuzzy search
  const fuse = React.useMemo(() => {
    // Try to import Fuse.js dynamically
    let Fuse: any;
    try {
      Fuse = require("fuse.js");
    } catch (e) {
      console.warn("Fuse.js not found. Install with: npm install fuse.js");
      return null;
    }

    // Prepare data for Fuse.js with all searchable text
    const fuseData = options.map((option) => ({
      ...option,
      searchableText: [option.label, ...(option.keywords || [])].join(" "),
    }));

    return new Fuse(fuseData, {
      keys: [
        { name: "label", weight: 0.7 },
        { name: "keywords", weight: 0.3 },
        { name: "searchableText", weight: 0.5 },
      ],
      threshold: fuseOptions.threshold || 0.4,
      distance: fuseOptions.distance || 100,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: fuseOptions.minMatchCharLength || 1,
    });
  }, [options, fuseOptions]);

  // Get filtered options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) {
      return options;
    }

    // Fall back to simple filter if Fuse.js is not available
    if (!fuse) {
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          option.keywords?.some((keyword) =>
            keyword.toLowerCase().includes(searchValue.toLowerCase())
          )
      );
    }

    const results = fuse.search(searchValue.trim());
    return results.map((result: any) => result.item);
  }, [fuse, searchValue, options]);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full flex justify-end",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex w-full items-center gap-2">
            <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />

            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span className="text-lg">{selectedOption.icon}</span>
                )}
                <span>{selectedOption.label}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full max-w-sm p-0 bg-background"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList
            className="overflow-y-auto"
            style={{ maxHeight: "200px" }}
          >
            {filteredOptions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option: ComboboxOption) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      const selectedValue =
                        currentValue === value ? "" : currentValue;
                      onValueChange?.(selectedValue);
                      setOpen(false);
                      setSearchValue(""); // Clear search when selecting
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1" dir="rtl">
                      {option.icon && (
                        <span className="text-lg">{option.icon}</span>
                      )}
                      <span>{option.label}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
