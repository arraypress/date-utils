/**
 * Calendar periods in a time zone: where a store's days, weeks, months,
 * quarters and years begin, for reports that have to agree with the
 * calendar on the seller's wall.
 *
 * Dates are kept as local calendar dates (`{ y, m, d }`) and turned into
 * instants only at the edges, so a month is a month and a day is a day,
 * whatever daylight saving does in between. Time zones come from `Intl`;
 * there is no table to go stale.
 *
 * @module @arraypress/date-utils/zoned
 */

/** One `Intl.DateTimeFormat` per time zone: making them is the slow part. */
const formatters = new Map();

/** Months in each period that's a whole number of months. */
const MONTHS = Object.freeze({ month: 1, quarter: 3, year: 12 });

/** A day, in ms. */
const DAY_MS = 86_400_000;

/**
 * A number as two digits.
 *
 * @param {number} n The number.
 * @returns {string} e.g. `07`.
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * The formatter for a time zone, made once.
 *
 * @param {string} tz IANA time zone.
 * @returns {Intl.DateTimeFormat} A formatter giving numeric parts on a 24-hour clock.
 */
function formatterFor(tz) {
  let format = formatters.get(tz);
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    formatters.set(tz, format);
  }
  return format;
}

/**
 * What a wall clock in a time zone reads at an instant.
 *
 * @param {number} ms Unix ms.
 * @param {string} tz IANA time zone.
 * @returns {{ y: number, m: number, d: number, h: number, min: number, s: number }} The local date and time.
 */
function wallClock(ms, tz) {
  const parts = Object.fromEntries(formatterFor(tz).formatToParts(new Date(ms)).map((p) => [p.type, Number(p.value)]));
  return { y: parts.year, m: parts.month, d: parts.day, h: parts.hour, min: parts.minute, s: parts.second };
}

/**
 * A time zone's offset from UTC at an instant: its wall clock read as UTC,
 * minus the instant.
 *
 * @param {number} ms Unix ms.
 * @param {string} tz IANA time zone.
 * @returns {number} The offset in ms (positive east of Greenwich).
 */
function offsetAt(ms, tz) {
  const w = wallClock(ms, tz);
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.min, w.s) - ms;
}

/**
 * Whether a string names a time zone this runtime knows.
 *
 * @param {string} tz e.g. `Asia/Bangkok`.
 * @returns {boolean} True when `Intl` accepts it.
 */
export function isTimeZone(tz) {
  try {
    formatterFor(tz);
    return true;
  } catch {
    return false;
  }
}

/**
 * The calendar date an instant falls on in a time zone.
 *
 * @param {number} ms Unix ms.
 * @param {string} tz IANA time zone.
 * @returns {{ y: number, m: number, d: number }} The local date (`m` is 1–12).
 *
 * @example
 * localDate(Date.UTC(2026, 9, 9, 20), 'Asia/Bangkok') // { y: 2026, m: 10, d: 10 }
 */
export function localDate(ms, tz) {
  const { y, m, d } = wallClock(ms, tz);
  return { y, m, d };
}

/**
 * The instant a local date's midnight happens in a time zone.
 *
 * @param {{ y: number, m: number, d: number }} date The local date.
 * @param {string} tz IANA time zone.
 * @returns {number} Unix ms.
 *
 * @example
 * startOfLocalDay({ y: 2026, m: 3, d: 29 }, 'Europe/London') // the midnight before the clocks go forward
 */
export function startOfLocalDay(date, tz) {
  const guess = Date.UTC(date.y, date.m - 1, date.d);
  // Twice, so a midnight just after a daylight-saving change lands on the right side.
  const first = guess - offsetAt(guess, tz);
  return guess - offsetAt(first, tz);
}

/**
 * A date plus some days, on the calendar (no time zone involved).
 *
 * @param {{ y: number, m: number, d: number }} date The date.
 * @param {number} days Days to add (negative to go back).
 * @returns {{ y: number, m: number, d: number }} The new date.
 */
export function addDays(date, days) {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/**
 * The first day of the period a date is in. Weeks start on Monday (ISO 8601).
 *
 * @param {{ y: number, m: number, d: number }} date The date.
 * @param {'day'|'week'|'month'|'quarter'|'year'} period The period.
 * @returns {{ y: number, m: number, d: number }} Its first day.
 */
export function periodStart(date, period) {
  switch (period) {
    case 'day':
      return date;
    case 'week': {
      const weekday = new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay(); // 0 = Sunday
      return addDays(date, -((weekday + 6) % 7));
    }
    case 'month':
      return { y: date.y, m: date.m, d: 1 };
    case 'quarter':
      return { y: date.y, m: Math.floor((date.m - 1) / 3) * 3 + 1, d: 1 };
    case 'year':
      return { y: date.y, m: 1, d: 1 };
    default:
      throw new RangeError(`Unknown period: ${period}`);
  }
}

/**
 * The first day of a later (or earlier) period.
 *
 * @param {{ y: number, m: number, d: number }} start A period's first day.
 * @param {'day'|'week'|'month'|'quarter'|'year'} period The period.
 * @param {number} [count] How many periods on (negative to go back). Defaults to 1.
 * @returns {{ y: number, m: number, d: number }} The first day of that period.
 */
export function nextPeriod(start, period, count = 1) {
  if (period === 'day') return addDays(start, count);
  if (period === 'week') return addDays(start, 7 * count);
  if (!(period in MONTHS)) throw new RangeError(`Unknown period: ${period}`);
  const t = new Date(Date.UTC(start.y, start.m - 1 + MONTHS[period] * count, 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: 1 };
}

/**
 * The first day of the period before.
 *
 * @param {{ y: number, m: number, d: number }} start A period's first day.
 * @param {'day'|'week'|'month'|'quarter'|'year'} period The period.
 * @returns {{ y: number, m: number, d: number }} The previous period's first day.
 */
export function previousPeriod(start, period) {
  return nextPeriod(start, period, -1);
}

/**
 * The instants a period begins and ends in a time zone: for a database
 * query (`from <= t < to`).
 *
 * @param {{ y: number, m: number, d: number }} date Any day in the period.
 * @param {'day'|'week'|'month'|'quarter'|'year'} period The period.
 * @param {string} tz IANA time zone.
 * @returns {{ start: { y: number, m: number, d: number }, from: number, to: number }} The period's first day, and its bounds in unix ms (`to` exclusive).
 *
 * @example
 * // October 2026 in Bangkok, for `WHERE created_at >= from AND created_at < to`
 * periodBounds({ y: 2026, m: 10, d: 9 }, 'month', 'Asia/Bangkok')
 */
export function periodBounds(date, period, tz) {
  const start = periodStart(date, period);
  return { start, from: startOfLocalDay(start, tz), to: startOfLocalDay(nextPeriod(start, period), tz) };
}

/**
 * The ISO 8601 week a Monday starts: the week holding the year's first
 * Thursday is week 1.
 *
 * @param {{ y: number, m: number, d: number }} monday A week's first day.
 * @returns {{ year: number, week: number }} The ISO year (which can differ from the date's) and week.
 */
function isoWeek(monday) {
  const thursday = addDays(monday, 3);
  const days = (Date.UTC(thursday.y, thursday.m - 1, thursday.d) - Date.UTC(thursday.y, 0, 1)) / DAY_MS;
  return { year: thursday.y, week: Math.floor(days / 7) + 1 };
}

/**
 * A period's name, as a report shows it and a URL can carry it.
 *
 * @param {{ y: number, m: number, d: number }} start The period's first day.
 * @param {'day'|'week'|'month'|'quarter'|'year'} period The period.
 * @returns {string} `2026-10-09` (day), `2026-W41` (ISO week), `2026-10` (month), `2026-Q4`, or `2026`.
 */
export function periodLabel(start, period) {
  switch (period) {
    case 'day':
      return `${start.y}-${pad(start.m)}-${pad(start.d)}`;
    case 'week': {
      const { year, week } = isoWeek(start);
      return `${year}-W${pad(week)}`;
    }
    case 'month':
      return `${start.y}-${pad(start.m)}`;
    case 'quarter':
      return `${start.y}-Q${Math.floor((start.m - 1) / 3) + 1}`;
    case 'year':
      return String(start.y);
    default:
      throw new RangeError(`Unknown period: ${period}`);
  }
}

/**
 * Read `YYYY-MM-DD`, refusing dates that don't exist (`2026-02-30`).
 *
 * @param {string | null | undefined} text The date.
 * @returns {{ y: number, m: number, d: number } | null} The local date, or null when it isn't one.
 */
export function parseLocalDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? '');
  if (!match) return null;
  const date = { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  const check = addDays(date, 0);
  return check.y === date.y && check.m === date.m && check.d === date.d ? date : null;
}

/**
 * Write `YYYY-MM-DD`.
 *
 * @param {{ y: number, m: number, d: number }} date The local date.
 * @returns {string} The text.
 */
export function formatLocalDate(date) {
  return periodLabel(date, 'day');
}
