export type Preset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'ytd' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'all' | 'custom';
export type GroupBy = 'day' | 'week' | 'month';

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface CustomRange {
  from?: string;
  to?: string;
}

export function getDateRange(preset: Preset, custom?: CustomRange): DateRange;
export function getGroupBy(preset: Preset): GroupBy;
export function formatPeriod(period: string, groupBy: GroupBy): string;
export function unixToDatetime(ts: number): string | null;
export function datetimeToUnix(dateStr: string): number | null;

/** Options for `shortDate()` and `dateTime()`. */
export interface DisplayOptions {
  /** BCP 47 language tag ('de', 'pt-BR'). Default 'en-US'; an unknown one keeps the default. */
  locale?: string;
  /** IANA time zone ('Asia/Bangkok'). Default 'UTC'; an unknown one keeps the default. */
  timeZone?: string;
}

/** Options for `relativeTime()`. */
export interface RelativeTimeOptions {
  /**
   * BCP 47 language tag: the same units through `Intl.RelativeTimeFormat`
   * ('vor 2 Stunden', 'gestern'). Without one, or an unknown one, English.
   */
  locale?: string;
  /** The moment to measure from. Default: now. */
  now?: Date | number;
}

export function shortDate(dateStr: string, options?: DisplayOptions): string;
export function dateTime(dateStr: string, options?: DisplayOptions): string;
export function relativeTime(dateStr: string, options?: RelativeTimeOptions): string;

/**
 * Item with a date on either `item.data.date` (Astro CollectionEntry
 * shape) or `item.date` (flat shape). Both `Date` instances and
 * date-strings are accepted.
 */
export interface DatedItem {
  data?: { date?: Date | string };
  date?: Date | string;
}

/**
 * Sort comparator — DESCENDING (newest first). Drop into `Array.sort`.
 * Items with no date sort to the bottom.
 *
 * @example posts.sort(byDateDesc)
 */
export function byDateDesc(a: DatedItem, b: DatedItem): number;

/**
 * Sort comparator — ASCENDING (oldest first). Items with no date
 * sort to the top.
 *
 * @example archive.sort(byDateAsc)
 */
export function byDateAsc(a: DatedItem, b: DatedItem): number;

/**
 * Every preset key `getDateRange` accepts, frozen. Useful for
 * rendering a select / iterating without duplicating the union.
 */
export const DATE_PRESETS: readonly Preset[];

export * from './zoned.js';
