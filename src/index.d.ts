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
