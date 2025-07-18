import React from 'react';
import { cn } from '../lib/utils';
import { getFontClass, getTextDirection, getLanguage } from '../lib/font-utils';

interface AutoFontTextProps {
  /**
   * The text content to display
   */
  children: React.ReactNode;
  /**
   * HTML element to render as
   */
  as?: React.ElementType;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Force a specific font (overrides auto-detection)
   */
  forceFont?: 'hebrew' | 'english' | 'fallback';
  /**
   * Force a specific direction (overrides auto-detection)
   */
  forceDirection?: 'ltr' | 'rtl';
  /**
   * Additional props to pass to the element
   */
  [key: string]: any;
}

/**
 * A text component that automatically applies the correct font and direction
 * based on the text content (Hebrew vs English)
 */
export function AutoFontText({
  children,
  as = 'span',
  className,
  forceFont,
  forceDirection,
  ...props
}: AutoFontTextProps) {
  const textContent = typeof children === 'string' ? children : '';
  
  // Determine font and direction
  const fontClass = forceFont ? `font-${forceFont}` : getFontClass(textContent);
  const direction = forceDirection || getTextDirection(textContent);
  const language = getLanguage(textContent);
  
  const Component = as;
  
  return (
    <Component
      {...props}
      className={cn(fontClass, className)}
      dir={direction}
      lang={language}
    >
      {children}
    </Component>
  );
}

// Preset components for common use cases
export function HebrewText({ children, className, ...props }: Omit<AutoFontTextProps, 'forceFont' | 'forceDirection'>) {
  return (
    <AutoFontText
      forceFont="hebrew"
      forceDirection="rtl"
      className={className}
      {...props}
    >
      {children}
    </AutoFontText>
  );
}

export function EnglishText({ children, className, ...props }: Omit<AutoFontTextProps, 'forceFont' | 'forceDirection'>) {
  return (
    <AutoFontText
      forceFont="english"
      forceDirection="ltr"
      className={className}
      {...props}
    >
      {children}
    </AutoFontText>
  );
} 