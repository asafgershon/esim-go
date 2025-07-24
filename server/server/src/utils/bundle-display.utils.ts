/**
 * Utility functions for displaying bundle data
 */

/**
 * Convert price from cents back to dollars for display
 */
export function convertCentsToDollars(priceInCents?: number | null): number {
  if (!priceInCents) return 0;
  return priceInCents / 100;
}

/**
 * Convert bytes back to MB for display
 */
export function convertBytesToMB(bytes?: number | null): number | null {
  if (!bytes || bytes === -1) return null; // Unlimited
  return Math.round(bytes / (1024 * 1024));
}

/**
 * Format duration for display
 */
export function formatDuration(days?: number | null): string {
  if (!days) return 'N/A';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Check if data is unlimited
 */
export function isUnlimited(dataAmount?: number | null, unlimited?: boolean): boolean {
  return unlimited === true || dataAmount === -1;
}