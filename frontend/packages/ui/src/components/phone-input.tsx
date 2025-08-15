"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { CircleFlag } from "react-circle-flags";
import { countries as countriesList, lookup } from "country-data-list";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ScrollArea } from "./scroll-area";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  error?: boolean;
  showCountrySelect?: boolean;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    value = "", 
    onChange, 
    defaultCountry = "IL", // Israel as default
    placeholder = "Enter phone number",
    error = false,
    showCountrySelect = true,
    className,
    ...props 
  }, ref) => {
    const [phoneNumber, setPhoneNumber] = useState(value);
    const [countryCode, setCountryCode] = useState<CountryCode>(defaultCountry);
    const [displayFlag, setDisplayFlag] = useState(defaultCountry.toLowerCase());
    const [countryData, setCountryData] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const innerRef = React.useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    // Get all countries for the dropdown
    const countries = React.useMemo(() => {
      try {
        const allCountries = countriesList.all
        if (!allCountries || allCountries.length === 0) {
          // Fallback countries if lookup fails
          return [
            { alpha2: "IL", name: "Israel", countryCallingCodes: ["972"] },
            { alpha2: "US", name: "United States", countryCallingCodes: ["1"] },
            { alpha2: "GB", name: "United Kingdom", countryCallingCodes: ["44"] },
          ];
        }
        // Move Israel to the top
        const israel = allCountries.find((c: any) => c.alpha2 === "IL");
        const otherCountries = allCountries.filter((c: any) => c.alpha2 !== "IL");
        return israel ? [israel, ...otherCountries] : allCountries;
      } catch (error) {
        console.error("Error loading countries:", error);
        // Fallback countries
        return [
          { alpha2: "IL", name: "Israel", countryCallingCodes: ["972"] },
          { alpha2: "US", name: "United States", countryCallingCodes: ["1"] },
          { alpha2: "GB", name: "United Kingdom", countryCallingCodes: ["44"] },
        ];
      }
    }, []);

    // Initialize country data
    useEffect(() => {
      try {
        const country = lookup.countries({ alpha2: defaultCountry })?.[0];
        if (country) {
          setCountryData(country);
          setDisplayFlag(defaultCountry.toLowerCase());
          setCountryCode(defaultCountry);
        } else {
          // Fallback for Israel
          setCountryData({ alpha2: "IL", name: "Israel", countryCallingCodes: ["972"] });
          setDisplayFlag("il");
          setCountryCode("IL");
        }
      } catch (error) {
        // Fallback for Israel
        setCountryData({ alpha2: "IL", name: "Israel", countryCallingCodes: ["972"] });
        setDisplayFlag("il");
        setCountryCode("IL");
      }
    }, [defaultCountry]);

    // Update value when external value changes
    useEffect(() => {
      if (value !== phoneNumber) {
        setPhoneNumber(value);
        // Try to parse the phone number to update country
        if (value) {
          try {
            const parsed = parsePhoneNumber(value);
            if (parsed && parsed.country) {
              setCountryCode(parsed.country);
              setDisplayFlag(parsed.country.toLowerCase());
              try {
                const country = lookup.countries({ alpha2: parsed.country })?.[0];
                if (country) {
                  setCountryData(country);
                }
              } catch (error) {
                // Keep current country data
              }
            }
          } catch (error) {
            // Keep current country if parsing fails
          }
        }
      }
    }, [value]);

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // Convert 00 to +
      if (inputValue.startsWith("00")) {
        inputValue = "+" + inputValue.slice(2);
      }

      // Remove any non-digit characters except + at the beginning
      if (inputValue.startsWith("+")) {
        inputValue = "+" + inputValue.slice(1).replace(/\D/g, "");
      } else {
        inputValue = inputValue.replace(/\D/g, "");
      }

      setPhoneNumber(inputValue);

      // Try to parse the phone number
      try {
        let parsed;
        if (inputValue.startsWith("+")) {
          parsed = parsePhoneNumber(inputValue);
        } else if (countryCode) {
          // If no + prefix, try with current country code
          const withCountryCode = `+${getCountryCallingCode(countryCode)}${inputValue}`;
          parsed = parsePhoneNumber(withCountryCode);
          if (parsed) {
            inputValue = withCountryCode;
            setPhoneNumber(inputValue);
          }
        }

        if (parsed && parsed.country) {
          setCountryCode(parsed.country);
          setDisplayFlag(parsed.country.toLowerCase());
          try {
            const country = lookup.countries({ alpha2: parsed.country })?.[0];
            if (country) {
              setCountryData(country);
            }
          } catch (error) {
            // Keep current country data
          }
        }
      } catch (error) {
        // Keep current country if parsing fails
      }

      onChange?.(inputValue);
    };

    const handleCountrySelect = (alpha2: string) => {
      try {
        const country = lookup.countries({ alpha2 })?.[0] || 
                       countries.find((c: any) => c.alpha2 === alpha2);
        if (country) {
          setCountryData(country);
          setCountryCode(alpha2 as CountryCode);
          setDisplayFlag(alpha2.toLowerCase());
          
          // Update phone number with new country code
          try {
            const countryCallingCode = getCountryCallingCode(alpha2 as CountryCode);
            let newPhoneNumber = phoneNumber;
            
            // Remove old country code if present
            if (phoneNumber.startsWith("+")) {
              const parsed = parsePhoneNumber(phoneNumber);
              if (parsed && parsed.nationalNumber) {
                newPhoneNumber = `+${countryCallingCode}${parsed.nationalNumber}`;
              } else {
                newPhoneNumber = `+${countryCallingCode}`;
              }
            } else if (phoneNumber) {
              newPhoneNumber = `+${countryCallingCode}${phoneNumber}`;
            } else {
              newPhoneNumber = `+${countryCallingCode}`;
            }
            
            setPhoneNumber(newPhoneNumber);
            onChange?.(newPhoneNumber);
          } catch (error) {
            // If we can't get the calling code, just update the flag
          }
        }
      } catch (error) {
        console.error("Error selecting country:", error);
      }
      setIsOpen(false);
    };

    // Format display value
    const getDisplayValue = () => {
      try {
        if (phoneNumber && phoneNumber.startsWith("+")) {
          const parsed = parsePhoneNumber(phoneNumber);
          if (parsed) {
            return parsed.formatInternational();
          }
        }
      } catch (error) {
        // Return raw value if formatting fails
      }
      return phoneNumber;
    };

    // Get calling code display
    const getCallingCode = () => {
      try {
        if (countryCode) {
          return `+${getCountryCallingCode(countryCode)}`;
        }
      } catch (error) {
        return "+972"; // Default to Israel
      }
      return "+972";
    };

    return (
      <div className={cn("flex gap-2", className)}>
        {showCountrySelect && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 px-3"
                aria-label="Select country"
              >
                <CircleFlag
                  countryCode={displayFlag}
                  height={20}
                  width={20}
                  className="rounded-full"
                />
                <span className="text-sm font-medium">{getCallingCode()}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              <ScrollArea className="h-[300px]">
                {countries.map((country: any) => (
                  <DropdownMenuItem
                    key={country.alpha2}
                    onClick={() => handleCountrySelect(country.alpha2)}
                    className="flex items-center gap-2"
                  >
                    <CircleFlag
                      countryCode={country.alpha2.toLowerCase()}
                      height={20}
                      width={20}
                      className="rounded-full"
                    />
                    <span className="flex-1">{country.name}</span>
                    <span className="text-sm text-muted-foreground">
                      +{country.countryCallingCodes?.[0]?.replace(/\D/g, "")}
                    </span>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Input
          ref={innerRef}
          type="tel"
          value={getDisplayValue()}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className={cn(
            "flex-1",
            error && "border-red-500 focus:border-red-500"
          )}
          dir="ltr"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

// Helper function to validate phone number
export const validatePhoneNumber = (phoneNumber: string, countryCode?: CountryCode) => {
  if (!phoneNumber) return false;
  
  try {
    if (countryCode) {
      return isValidPhoneNumber(phoneNumber, countryCode);
    } else {
      return isValidPhoneNumber(phoneNumber);
    }
  } catch (error) {
    return false;
  }
};

// Helper function to format phone number
export const formatPhoneNumber = (phoneNumber: string, countryCode?: CountryCode) => {
  try {
    const parsed = countryCode 
      ? parsePhoneNumber(phoneNumber, countryCode)
      : parsePhoneNumber(phoneNumber);
    
    if (parsed) {
      return parsed.formatInternational();
    }
  } catch (error) {
    // Return raw value if formatting fails
  }
  return phoneNumber;
};

export { PhoneInput };