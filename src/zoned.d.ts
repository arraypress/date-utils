/** A report's granularity. */
export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

/** A local calendar date. `m` is 1–12. */
export interface LocalDate {
  y: number;
  m: number;
  d: number;
}

/** Whether a string names a time zone this runtime knows. */
export function isTimeZone(tz: string): boolean;

/** The calendar date an instant falls on in a time zone. */
export function localDate(ms: number, tz: string): LocalDate;

/** The instant a local date's midnight happens in a time zone (unix ms). */
export function startOfLocalDay(date: LocalDate, tz: string): number;

/** A date plus some days, on the calendar. */
export function addDays(date: LocalDate, days: number): LocalDate;

/** The first day of the period a date is in (weeks start on Monday). */
export function periodStart(date: LocalDate, period: Period): LocalDate;

/** The first day of a period `count` periods on (negative to go back). */
export function nextPeriod(start: LocalDate, period: Period, count?: number): LocalDate;

/** The first day of the period before. */
export function previousPeriod(start: LocalDate, period: Period): LocalDate;

/** A period's first day and its bounds in a time zone, in unix ms (`to` exclusive). */
export function periodBounds(date: LocalDate, period: Period, tz: string): { start: LocalDate; from: number; to: number };

/** `2026-10-09`, `2026-W41`, `2026-10`, `2026-Q4` or `2026`. */
export function periodLabel(start: LocalDate, period: Period): string;

/** Read `YYYY-MM-DD`; null for anything else, including dates that don't exist. */
export function parseLocalDate(text: string | null | undefined): LocalDate | null;

/** Write `YYYY-MM-DD`. */
export function formatLocalDate(date: LocalDate): string;
