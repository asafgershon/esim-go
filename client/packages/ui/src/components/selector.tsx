"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

// Main Selector Container
const Selector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="Selector"
    className={cn(
      "w-full mx-auto",
      className
    )}
    {...props}
  />
));
Selector.displayName = "Selector";

// Selector Card with consistent padding and responsive border radius
const SelectorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorCard"
    className={cn(
      "bg-white rounded-[20px] md:rounded-[30px] shadow-[0px_4px_28px_-6px_rgba(0,0,0,0.08)] relative",
      className
    )}
    style={{
      paddingTop: '24px',
      paddingBottom: '24px',
      paddingLeft: '20px',
      paddingRight: '20px',
      ...style
    }}
    {...props}
  />
));
SelectorCard.displayName = "SelectorCard";

// Selector Header with responsive margin
const SelectorHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorHeader"
    className={cn("text-right mb-6 md:mb-10", className)}
    {...props}
  />
));
SelectorHeader.displayName = "SelectorHeader";

// Selector Content with responsive gap
const SelectorContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorContent"
    className={cn("flex flex-col gap-4 md:gap-6", className)}
    {...props}
  />
));
SelectorContent.displayName = "SelectorContent";

// Selector Action (CTA button area)
const SelectorAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorAction"
    className={cn("", className)}
    {...props}
  />
));
SelectorAction.displayName = "SelectorAction";

// Selector Section with responsive gap
const SelectorSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorSection"
    className={cn("flex flex-col gap-2 md:gap-4", className)}
    {...props}
  />
));
SelectorSection.displayName = "SelectorSection";

// Selector Label with responsive text size
const SelectorLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-name="SelectorLabel"
    className={cn("text-[12px] md:text-[20px] text-[#0A232E] text-right", className)}
    {...props}
  />
));
SelectorLabel.displayName = "SelectorLabel";

// Selector Button (Primary CTA) - supports both purple and green variants
const SelectorButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { style?: React.CSSProperties }
>(({ className, style, ...props }, ref) => (
  <button
    ref={ref}
    data-name="SelectorButton"
    className={cn(
      "w-full h-9 md:h-[66px] rounded-lg md:rounded-[10px]",
      "bg-[#535FC8] hover:bg-[#535FC8]/90",
      "border border-[#0A232E]",
      "text-white text-[12px] md:text-[22px] font-medium",
      "hover:translate-y-[1px]",
      "active:translate-y-[2px]",
      "transition-all duration-100",
      "flex items-center justify-center gap-3",
      "cursor-pointer",
      className
    )}
    style={{
      boxShadow: "2px 3px 0px 0px #0A232E",
      ...style
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "2px 2px 0px 0px #0A232E";
      props.onMouseEnter?.(e);
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "2px 3px 0px 0px #0A232E";
      props.onMouseLeave?.(e);
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.boxShadow = "1px 1px 0px 0px #0A232E";
      props.onMouseDown?.(e);
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.boxShadow = "2px 2px 0px 0px #0A232E";
      props.onMouseUp?.(e);
    }}
    {...props}
  />
));
SelectorButton.displayName = "SelectorButton";

// Country/Region Selector with flags and search
interface Country {
  id: string;
  name: string;
  iso: string;
  flag: string;
  keywords?: string[];
}

interface CountrySelectorProps {
  countries: Country[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CountrySelector = React.forwardRef<
  HTMLDivElement,
  CountrySelectorProps
>(({ countries, value, onValueChange, placeholder = "בחר מדינה", className, disabled }, _ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  const selectedCountry = countries.find(c => c.id === value);
  
  const filteredCountries = React.useMemo(() => {
    if (!searchTerm) return countries;
    return countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.iso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [countries, searchTerm]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  React.useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={selectedCountry ? `Selected country: ${selectedCountry.name}` : placeholder}
        className={cn(
          "w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-[10px]",
          "bg-white border border-[#0A232E]",
          "flex items-center justify-between gap-2",
          "text-[12px] md:text-[16px] text-[#0A232E]",
          "hover:bg-gray-50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[#535FC8] focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <svg
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          role="listbox"
          aria-label="Select country"
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#0A232E] rounded-lg md:rounded-[10px] shadow-lg max-h-60 overflow-hidden"
        >
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="חפש מדינה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search countries"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#535FC8]"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-center text-sm">
                לא נמצאו מדינות
              </div>
            ) : (
              filteredCountries.map((country, index) => (
                <button
                  key={country.id}
                  type="button"
                  role="option"
                  aria-selected={value === country.id}
                  onClick={() => {
                    onValueChange?.(country.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onValueChange?.(country.id);
                      setIsOpen(false);
                      setSearchTerm("");
                    }
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors",
                    "flex items-center gap-2 text-[12px] md:text-[14px]",
                    "focus:outline-none focus:bg-gray-100",
                    value === country.id && "bg-[#535FC8]/10 text-[#535FC8]"
                  )}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
CountrySelector.displayName = "CountrySelector";

// Duration Selector with radio/toggle buttons
interface DurationOption {
  id: string;
  label: string;
  value: number;
  unit: 'days' | 'hours';
}

interface DurationSelectorProps {
  options: DurationOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const DurationSelector = React.forwardRef<
  HTMLDivElement,
  DurationSelectorProps
>(({ options, value, onValueChange, className, disabled }, ref) => {
  return (
    <div 
      ref={ref} 
      role="radiogroup"
      aria-label="Select duration"
      className={cn("flex flex-wrap gap-2 md:gap-3", className)}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          disabled={disabled}
          onClick={() => !disabled && onValueChange?.(option.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && onValueChange?.(option.id);
            }
          }}
          className={cn(
            "px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-[10px]",
            "text-[12px] md:text-[16px] font-medium",
            "border border-[#0A232E] transition-all duration-200",
            "hover:translate-y-[-1px] active:translate-y-[1px]",
            "focus:outline-none focus:ring-2 focus:ring-[#535FC8] focus:ring-offset-2",
            value === option.id
              ? "bg-[#535FC8] text-white shadow-[2px_3px_0px_0px_#0A232E]"
              : "bg-white text-[#0A232E] shadow-[1px_2px_0px_0px_#0A232E] hover:shadow-[2px_3px_0px_0px_#0A232E]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});
DurationSelector.displayName = "DurationSelector";

// Bundle Type Selector with card-style selections
interface BundleOption {
  id: string;
  title: string;
  data: string;
  price: string;
  originalPrice?: string;
  isPopular?: boolean;
  description?: string;
}

interface BundleTypeSelectorProps {
  options: BundleOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const BundleTypeSelector = React.forwardRef<
  HTMLDivElement,
  BundleTypeSelectorProps
>(({ options, value, onValueChange, className, disabled }, ref) => {
  return (
    <div 
      ref={ref} 
      role="radiogroup"
      aria-label="Select bundle type"
      className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4", className)}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          aria-label={`${option.data} ${option.title} - ${option.price}${option.originalPrice ? ` (original: ${option.originalPrice})` : ''}${option.isPopular ? ' - Popular' : ''}`}
          disabled={disabled}
          onClick={() => !disabled && onValueChange?.(option.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && onValueChange?.(option.id);
            }
          }}
          className={cn(
            "relative p-4 md:p-6 rounded-lg md:rounded-[15px] text-right",
            "border border-[#0A232E] transition-all duration-200",
            "hover:translate-y-[-1px] active:translate-y-[1px]",
            "focus:outline-none focus:ring-2 focus:ring-[#535FC8] focus:ring-offset-2",
            value === option.id
              ? "bg-[#00E095] text-[#0A232E] shadow-[2px_4px_0px_0px_#0A232E]"
              : "bg-white text-[#0A232E] shadow-[2px_3px_0px_0px_#0A232E] hover:shadow-[2px_4px_0px_0px_#0A232E]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {option.isPopular && (
            <div className="absolute top-2 left-2 bg-[#535FC8] text-white text-[10px] md:text-[12px] px-2 py-1 rounded-md">
              פופולרי
            </div>
          )}
          <div className="space-y-2">
            <div className="text-[18px] md:text-[24px] font-bold">{option.data}</div>
            <div className="text-[12px] md:text-[14px] text-gray-600">{option.title}</div>
            {option.description && (
              <div className="text-[10px] md:text-[12px] text-gray-500">{option.description}</div>
            )}
            <div className="flex items-center justify-end gap-2">
              {option.originalPrice && (
                <span className="text-[12px] md:text-[14px] text-gray-400 line-through">
                  {option.originalPrice}
                </span>
              )}
              <span className="text-[14px] md:text-[18px] font-bold text-[#535FC8]">
                {option.price}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});
BundleTypeSelector.displayName = "BundleTypeSelector";

// Payment Method Selector with credit card input and validation
interface PaymentMethodSelectorProps {
  onCardChange?: (cardData: { number: string; expiry: string; cvc: string; name: string }) => void;
  className?: string;
  disabled?: boolean;
}

const PaymentMethodSelector = React.forwardRef<
  HTMLDivElement,
  PaymentMethodSelectorProps
>(({ onCardChange, className, disabled }, ref) => {
  const [cardData, setCardData] = React.useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const [cardType, setCardType] = React.useState<'visa' | 'mastercard' | 'amex' | null>(null);

  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('34') || cleaned.startsWith('37')) return 'amex';
    return null;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substring(0, 19); // Limit to 16 digits + spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const newCardData = { ...cardData, number: formatted };
    setCardData(newCardData);
    setCardType(detectCardType(formatted));
    onCardChange?.(newCardData);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    const newCardData = { ...cardData, expiry: formatted };
    setCardData(newCardData);
    onCardChange?.(newCardData);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    const newCardData = { ...cardData, cvc: value };
    setCardData(newCardData);
    onCardChange?.(newCardData);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCardData = { ...cardData, name: e.target.value };
    setCardData(newCardData);
    onCardChange?.(newCardData);
  };

  return (
    <div ref={ref} className={cn("space-y-4", className)}>
      <div className="relative">
        <label htmlFor="card-number" className="sr-only">
          מספר כרטיס אשראי
        </label>
        <input
          id="card-number"
          type="text"
          placeholder="מספר כרטיס אשראי"
          value={cardData.number}
          onChange={handleCardNumberChange}
          disabled={disabled}
          autoComplete="cc-number"
          inputMode="numeric"
          aria-describedby={cardType ? "card-type" : undefined}
          className={cn(
            "w-full h-12 md:h-14 px-4 rounded-lg md:rounded-[10px]",
            "bg-white border border-[#0A232E]",
            "text-[14px] md:text-[16px] text-[#0A232E]",
            "focus:outline-none focus:ring-2 focus:ring-[#535FC8]",
            "placeholder:text-gray-400",
            disabled && "opacity-50 cursor-not-allowed",
            cardType && "pl-16" // Add left padding when card type is shown
          )}
        />
        {cardType && (
          <div 
            id="card-type"
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
            aria-label={`Card type: ${cardType}`}
          >
            <div className={cn(
              "w-8 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white",
              cardType === 'visa' && "bg-[#1434CB]",
              cardType === 'mastercard' && "bg-[#EB001B]",
              cardType === 'amex' && "bg-[#006FCF]"
            )}>
              {cardType === 'visa' && 'VISA'}
              {cardType === 'mastercard' && 'MC'}
              {cardType === 'amex' && 'AMEX'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="card-expiry" className="sr-only">
            תאריך תפוגה
          </label>
          <input
            id="card-expiry"
            type="text"
            placeholder="MM/YY"
            value={cardData.expiry}
            onChange={handleExpiryChange}
            disabled={disabled}
            maxLength={5}
            autoComplete="cc-exp"
            inputMode="numeric"
            className={cn(
              "w-full h-12 md:h-14 px-4 rounded-lg md:rounded-[10px]",
              "bg-white border border-[#0A232E]",
              "text-[14px] md:text-[16px] text-[#0A232E]",
              "focus:outline-none focus:ring-2 focus:ring-[#535FC8]",
              "placeholder:text-gray-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
        <div>
          <label htmlFor="card-cvc" className="sr-only">
            קוד CVC
          </label>
          <input
            id="card-cvc"
            type="text"
            placeholder="CVC"
            value={cardData.cvc}
            onChange={handleCvcChange}
            disabled={disabled}
            autoComplete="cc-csc"
            inputMode="numeric"
            className={cn(
              "w-full h-12 md:h-14 px-4 rounded-lg md:rounded-[10px]",
              "bg-white border border-[#0A232E]",
              "text-[14px] md:text-[16px] text-[#0A232E]",
              "focus:outline-none focus:ring-2 focus:ring-[#535FC8]",
              "placeholder:text-gray-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
      </div>

      <div>
        <label htmlFor="card-name" className="sr-only">
          שם בעל הכרטיס
        </label>
        <input
          id="card-name"
          type="text"
          placeholder="שם בעל הכרטיס"
          value={cardData.name}
          onChange={handleNameChange}
          disabled={disabled}
          autoComplete="cc-name"
          className={cn(
            "w-full h-12 md:h-14 px-4 rounded-lg md:rounded-[10px]",
            "bg-white border border-[#0A232E]",
            "text-[14px] md:text-[16px] text-[#0A232E]",
            "focus:outline-none focus:ring-2 focus:ring-[#535FC8]",
            "placeholder:text-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
    </div>
  );
});
PaymentMethodSelector.displayName = "PaymentMethodSelector";

// Export types for external usage
export type {
  Country,
  CountrySelectorProps,
  DurationOption,
  DurationSelectorProps,
  BundleOption,
  BundleTypeSelectorProps,
  PaymentMethodSelectorProps,
};

export {
  Selector,
  SelectorCard,
  SelectorHeader,
  SelectorContent,
  SelectorAction,
  SelectorSection,
  SelectorLabel,
  SelectorButton,
  CountrySelector,
  DurationSelector,
  BundleTypeSelector,
  PaymentMethodSelector,
};

/**
 * Selector Component Usage Examples:
 * 
 * 1. CountrySelector - Dropdown with flags and search functionality
 * 2. DurationSelector - Radio/toggle buttons for different durations
 * 3. BundleTypeSelector - Card-style selections for data amounts
 * 4. PaymentMethodSelector - Credit card input with validation
 * 
 * All selectors follow consistent styling with purple/green variants,
 * mobile responsiveness, smooth transitions, and support for disabled states.
 */