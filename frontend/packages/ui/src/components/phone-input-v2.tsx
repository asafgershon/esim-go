"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import {
  isValidPhoneNumber as isValidPhoneNumberLib,
  parsePhoneNumber as parsePhoneNumberLib,
  type CountryCode,
} from "libphonenumber-js";

import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";
import { cn } from "../lib/utils";

import "react-phone-number-input/style.css";

// Our existing interface for backward compatibility
export interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "ref"> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  error?: boolean;
  showCountrySelect?: boolean;
}

const PhoneInputV2 = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = "",
      onChange,
      defaultCountry = "IL",
      placeholder = "Enter phone number",
      error = false,
      showCountrySelect = true,
      className,
      disabled,
      onBlur,
      ...props
    },
    ref
  ) => {
    // Convert onChange to match our existing API
    const handleChange = React.useCallback(
      (phoneValue: RPNInput.Value) => {
        if (!onChange) return;

        // Create a synthetic event that matches our existing interface
        const syntheticEvent = {
          target: {
            value: phoneValue || "",
            name: props.name,
            id: props.id,
          },
          currentTarget: {
            value: phoneValue || "",
            name: props.name,
            id: props.id,
          },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
      },
      [onChange, props.name, props.id]
    );

    // Handle blur event for validation
    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Validate on blur if needed
        if (onBlur) {
          onBlur(e);
        }
      },
      [onBlur]
    );

    return (
      <RPNInput.default
        ref={ref as any}
        className={cn("flex flex-row", className)}
        style={{ direction: "ltr" }}
        international
        defaultCountry={defaultCountry}
        flagComponent={FlagComponent}
        countrySelectComponent={showCountrySelect ? CountrySelect : undefined}
        inputComponent={InputComponent}
        value={value || undefined}
        onChange={(val) => handleChange(val || ("" as RPNInput.Value))}
        disabled={disabled}
        placeholder={placeholder}
        onBlur={handleBlur}
        {...(!showCountrySelect && { countries: [defaultCountry] })}
      />
    );
  }
);

PhoneInputV2.displayName = "PhoneInputV2";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn("rounded-e-lg rounded-s-none", className)}
    {...props}
    ref={ref}
  />
));
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Prioritize Israel in the country list
  const sortedCountryList = React.useMemo(() => {
    const israel = countryList.find((c) => c.value === "IL");
    const usa = countryList.find((c) => c.value === "US");
    const uk = countryList.find((c) => c.value === "GB");
    const others = countryList.filter(
      (c) => c.value !== "IL" && c.value !== "US" && c.value !== "GB"
    );

    const prioritized = [];
    if (israel) prioritized.push(israel);
    if (usa) prioritized.push(usa);
    if (uk) prioritized.push(uk);

    return [...prioritized, ...others];
  }, [countryList]);

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
          disabled={disabled}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    "[data-radix-scroll-area-viewport]"
                  );
                  if (viewportElement) {
                    viewportElement.scrollTop = 0;
                  }
                }
              }, 0);
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {sortedCountryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
    onSelectComplete();
  };

  return (
    <CommandItem className="gap-2" onSelect={handleSelect}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(
        country
      )}`}</span>
      <Check
        className={`ml-auto h-4 w-4 ${
          country === selectedCountry ? "opacity-100" : "opacity-0"
        }`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg]:!w-full [&_svg]:!h-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

// Helper function to format phone number (backward compatibility)
export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode?: CountryCode
) => {
  try {
    // Ensure the phone number has a + prefix for parsing
    const numberToParse = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    const parsed = countryCode
      ? parsePhoneNumberLib(numberToParse, countryCode)
      : parsePhoneNumberLib(numberToParse);

    if (parsed) {
      return parsed.formatInternational();
    }
  } catch (error) {
    // Return raw value if formatting fails
  }
  return phoneNumber;
};

export { PhoneInputV2 };
