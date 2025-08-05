/**
 * Represents a distinct bundle duration from the catalog
 */
export interface DistinctDuration {
  /**
   * The duration value as a string
   */
  value: string;

  /**
   * Human-readable label for the duration
   * @example "1 day", "7 days"
   */
  label: string;

  /**
   * Minimum number of days for this duration
   */
  minDays: number;

  /**
   * Maximum number of days for this duration
   */
  maxDays: number;
}