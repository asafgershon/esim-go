/**
 * Simple Font Management Utilities
 * Basic font class constants for Hebrew (Rubik) and English (Agency) fonts
 */

/**
 * CSS class name constants
 */
export const FONT_CLASSES = {
  HEBREW: 'font-hebrew',
  ENGLISH: 'font-english',
  FALLBACK: 'font-fallback',
} as const;

/**
 * Font family constants
 */
export const FONT_FAMILIES = {
  HEBREW: 'var(--font-hebrew)',
  ENGLISH: 'var(--font-english)',
  FALLBACK: 'var(--font-fallback)',
} as const; 