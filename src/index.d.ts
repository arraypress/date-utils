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
export function shortDate(dateStr: string): string;
export function dateTime(dateStr: string): string;
export function relativeTime(dateStr: string): string;

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
