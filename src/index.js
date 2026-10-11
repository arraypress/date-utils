/**
 * @arraypress/date-utils
 *
 * Practical date utilities for dashboards and admin UIs.
 * Date range presets, period formatting, and display formatting.
 *
 * All functions work with ISO date strings and return ISO strings.
 * No date library dependency — uses native Date and Intl.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module @arraypress/date-utils
 */

import { isTimeZone } from './zoned.js';

// ── Date Range Presets ──────────────────────

/**
 * Get a date range from a named preset.
 *
 * Returns `{ from, to }` as ISO strings, or null values for 'all'.
 * Useful for report filters, analytics dashboards, and date pickers.
 *
 * @param {'today'|'yesterday'|'7d'|'30d'|'90d'|'ytd'|'this_month'|'last_month'|'this_quarter'|'last_quarter'|'this_year'|'last_year'|'all'|'custom'} preset - The preset name.
 * @param {{ from?: string, to?: string }} [custom] - Custom date strings (YYYY-MM-DD) when preset is 'custom'.
 * @returns {{ from: string|null, to: string|null }}
 *
 * @example
 * getDateRange('7d')           // { from: '2026-03-17T00:00:00Z', to: '2026-03-24T23:59:59Z' }
 * getDateRange('yesterday')    // { from: '2026-03-23T00:00:00Z', to: '2026-03-23T23:59:59Z' }
 * getDateRange('this_month')   // { from: '2026-03-01T00:00:00Z', to: '2026-03-24T23:59:59Z' }
 * getDateRange('last_quarter') // { from: '2025-10-01T00:00:00Z', to: '2025-12-31T23:59:59Z' }
 * getDateRange('all')          // { from: null, to: null }
 * getDateRange('custom', { from: '2026-01-01', to: '2026-02-28' })
 */
export function getDateRange(preset, custom = {}) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const startOf = (d) => `${d.toISOString().slice(0, 10)}T00:00:00Z`;
  const endOf = (d) => `${d.toISOString().slice(0, 10)}T23:59:59Z`;
  const pad = (n) => String(n).padStart(2, '0');

  switch (preset) {
    case 'today':
      return { from: `${today}T00:00:00Z`, to: `${today}T23:59:59Z` };

    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { from: startOf(d), to: endOf(d) };
    }

    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: startOf(d), to: endOf(now) };
    }

    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: startOf(d), to: endOf(now) };
    }

    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { from: startOf(d), to: endOf(now) };
    }

    case 'this_month':
      return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01T00:00:00Z`, to: endOf(now) };

    case 'last_month': {
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const m = now.getMonth() === 0 ? 12 : now.getMonth();
      const lastDay = new Date(y, m, 0).getDate();
      return { from: `${y}-${pad(m)}-01T00:00:00Z`, to: `${y}-${pad(m)}-${lastDay}T23:59:59Z` };
    }

    case 'this_quarter': {
      const q = Math.floor(now.getUTCMonth() / 3);
      const m = q * 3 + 1; // 1-indexed month
      return { from: `${now.getUTCFullYear()}-${pad(m)}-01T00:00:00Z`, to: endOf(now) };
    }

    case 'last_quarter': {
      let q = Math.floor(now.getUTCMonth() / 3) - 1;
      let y = now.getUTCFullYear();
      if (q < 0) { q = 3; y--; }
      const startMonth = q * 3 + 1; // 1-indexed
      const endMonth = q * 3 + 3;
      const lastDay = new Date(Date.UTC(y, endMonth, 0)).getUTCDate();
      return { from: `${y}-${pad(startMonth)}-01T00:00:00Z`, to: `${y}-${pad(endMonth)}-${lastDay}T23:59:59Z` };
    }

    case 'this_year':
    case 'ytd':
      return { from: `${now.getFullYear()}-01-01T00:00:00Z`, to: endOf(now) };

    case 'last_year': {
      const y = now.getFullYear() - 1;
      return { from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` };
    }

    case 'custom':
      return {
        from: custom.from ? `${custom.from}T00:00:00Z` : null,
        to: custom.to ? `${custom.to}T23:59:59Z` : null,
      };

    case 'all':
    default:
      return { from: null, to: null };
  }
}

/**
 * Get the recommended groupBy for a date preset.
 *
 * Returns the appropriate aggregation granularity for charts.
 *
 * @param {'today'|'7d'|'30d'|'90d'|'ytd'|'all'|'custom'} preset
 * @returns {'day'|'week'|'month'}
 *
 * @example
 * getGroupBy('7d')    // 'day'
 * getGroupBy('90d')   // 'week'
 * getGroupBy('ytd')   // 'month'
 */
export function getGroupBy(preset) {
  switch (preset) {
    case 'today':
    case 'yesterday':
    case '7d':
    case '30d':
    case 'this_month':
    case 'last_month':
      return 'day';
    case '90d':
    case 'this_quarter':
    case 'last_quarter':
      return 'week';
    case 'ytd':
    case 'this_year':
    case 'last_year':
    case 'all':
    case 'custom':
    default:
      return 'month';
  }
}

// ── Period Formatting ───────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a period label for chart axes.
 *
 * Handles day, week, and month period strings from SQL GROUP BY.
 *
 * @param {string} period - The period string (e.g. '2026-03-24', '2026-12', '2026-W12').
 * @param {'day'|'week'|'month'} groupBy - The grouping granularity.
 * @returns {string} Formatted label.
 *
 * @example
 * formatPeriod('2026-03-24', 'day')    // 'Mar 24'
 * formatPeriod('2026-03', 'month')     // 'Mar 2026'
 * formatPeriod('2026-12', 'week')      // 'W12'
 */
export function formatPeriod(period, groupBy) {
  if (!period) return '';

  if (groupBy === 'month') {
    const parts = period.split('-');
    if (parts.length >= 2) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${MONTHS[monthIdx] || parts[1]} ${parts[0]}`;
    }
    return period;
  }

  if (groupBy === 'week') {
    const parts = period.split('-');
    return parts.length >= 2 ? `W${parts[1]}` : period;
  }

  // day
  const d = new Date(period + 'T00:00:00Z');
  if (isNaN(d.getTime())) return period;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ── Timestamp Conversion ──────────────────────

/**
 * Convert a Unix timestamp (seconds) to a SQL-friendly datetime string.
 *
 * Returns format `YYYY-MM-DD HH:MM:SS` (UTC), suitable for SQLite,
 * MySQL, and other databases.
 *
 * @param {number} ts - Unix timestamp in seconds.
 * @returns {string|null} Datetime string, or null if input is falsy.
 *
 * @example
 * unixToDatetime(1700000000)   // '2023-11-14 22:13:20'
 * unixToDatetime(0)            // null
 * unixToDatetime(null)         // null
 */
export function unixToDatetime(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Convert a SQL datetime string to a Unix timestamp (seconds).
 *
 * Accepts ISO strings or `YYYY-MM-DD HH:MM:SS` format.
 *
 * @param {string} dateStr - Datetime string.
 * @returns {number|null} Unix timestamp in seconds, or null if invalid.
 *
 * @example
 * datetimeToUnix('2023-11-14 22:13:20')    // 1700000000
 * datetimeToUnix('2023-11-14T22:13:20Z')   // 1700000000
 * datetimeToUnix(null)                      // null
 */
export function datetimeToUnix(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

// ── Display Formatting ──────────────────────

/**
 * Ensure a date string is parsed as UTC.
 */
function toDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

/**
 * A locale the runtime knows, or null for none or an unknown one (so the
 * caller keeps its English default).
 */
function knownLocale(locale, Format) {
  if (!locale) return null;
  try {
    return Format.supportedLocalesOf(locale).length ? locale : null;
  } catch {
    return null;
  }
}

/**
 * Format a date as a short date string.
 *
 * @param {string} dateStr - ISO date string.
 * @param {Object} [options]
 * @param {string} [options.locale] - BCP 47 language tag (e.g. 'de', 'pt-BR').
 *   Default 'en-US'; an unknown locale keeps the default.
 * @param {string} [options.timeZone] - IANA time zone. Default 'UTC'; an
 *   unknown zone keeps the default.
 * @returns {string} Formatted date like "Mar 24, 2026".
 *
 * @example
 * shortDate('2026-03-24T10:30:00Z')                     // 'Mar 24, 2026'
 * shortDate('2026-03-24')                                // 'Mar 24, 2026'
 * shortDate('2026-03-24T10:30:00Z', { locale: 'de' })    // '24. März 2026'
 */
export function shortDate(dateStr, options = {}) {
  const d = toDate(dateStr);
  if (!d) return '';
  const locale = knownLocale(options.locale, Intl.DateTimeFormat) || 'en-US';
  const timeZone = options.timeZone && isTimeZone(options.timeZone) ? options.timeZone : 'UTC';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone });
}

/**
 * Format a date as a date + time string.
 *
 * With a locale, the same fields (short month, day, year, 24-hour time)
 * in that language, joined as the language joins them.
 *
 * @param {string} dateStr - ISO date string.
 * @param {Object} [options]
 * @param {string} [options.locale] - BCP 47 language tag (e.g. 'de', 'pt-BR').
 *   Default 'en-US'; an unknown locale keeps the default.
 * @param {string} [options.timeZone] - IANA time zone. Default 'UTC'; an
 *   unknown zone keeps the default.
 * @returns {string} Formatted like "Mar 24, 2026, 10:30".
 *
 * @example
 * dateTime('2026-03-24T10:30:00Z')                       // 'Mar 24, 2026, 10:30'
 * dateTime('2026-03-24T10:30:00Z', { locale: 'de' })     // '24. März 2026, 10:30'
 * dateTime('2026-03-24T10:30:00Z', { timeZone: 'Asia/Bangkok' })  // 'Mar 24, 2026, 17:30'
 */
export function dateTime(dateStr, options = {}) {
  const d = toDate(dateStr);
  if (!d) return '';
  const locale = knownLocale(options.locale, Intl.DateTimeFormat);
  const timeZone = options.timeZone && isTimeZone(options.timeZone) ? options.timeZone : 'UTC';

  if (locale) {
    return d.toLocaleString(locale, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
    });
  }

  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone });
  return `${date}, ${time}`;
}

/**
 * Format a date as a relative time string.
 *
 * Returns human-friendly strings like "2 hours ago", "3 days ago", "just now".
 * With a locale, the same units through Intl.RelativeTimeFormat in that
 * language ("vor 2 Stunden", "gestern", "jetzt"). Units step up at the same
 * points: seconds under a minute are "now", then minutes, hours, days under
 * 30, months (30 days) under 12, then years (365 days). A future date is
 * "now", as in English.
 *
 * @param {string} dateStr - ISO date string.
 * @param {Object} [options]
 * @param {string} [options.locale] - BCP 47 language tag (e.g. 'de', 'pt-BR').
 *   Without one, or with an unknown one, the English strings above.
 * @param {Date|number} [options.now] - The moment to measure from. Default: now.
 * @returns {string} Relative time string.
 *
 * @example
 * relativeTime('2026-03-24T10:00:00Z')  // '2 hours ago' (if now is 12:00)
 * relativeTime('2026-03-23T10:00:00Z')  // '1 day ago'
 * relativeTime('2026-01-01T00:00:00Z')  // '2 months ago'
 * relativeTime('2026-03-24T10:00:00Z', { locale: 'de', now: Date.parse('2026-03-24T12:00:00Z') })  // 'vor 2 Stunden'
 */
export function relativeTime(dateStr, options = {}) {
  const d = toDate(dateStr);
  if (!d) return '';

  const now = options.now == null ? Date.now() : Number(options.now);
  const diff = now - d.getTime();

  const locale = knownLocale(options.locale, Intl.RelativeTimeFormat);
  if (locale) return relativeIn(locale, diff);

  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

/**
 * relativeTime() in a language, at the English thresholds.
 *
 * @private
 * @param {string} locale
 * @param {number} diff - Milliseconds since the date (negative: future).
 * @returns {string}
 */
function relativeIn(locale, diff) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const seconds = Math.floor(Math.max(diff, 0) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return rtf.format(0, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 30) return rtf.format(-days, 'day');
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.max(years, 1), 'year'); // 360–364 days: 12 months, not yet 365
}

// ── Sort comparators ────────────────────────

/**
 * Resolve a Date out of an item-shaped input. Accepts either an
 * `Astro CollectionEntry` (where the date lives on `item.data.date`)
 * or a flat record with a top-level `date` field. Returns a number
 * (ms since epoch) so sort callbacks can subtract directly. Items
 * with no date fall to `0` so they sort to the bottom in `desc`
 * mode and to the top in `asc` mode — usually what you want when
 * draft/unpublished entries leak into a published-only list.
 *
 * @private
 * @param {*} item
 * @returns {number}
 */
function _resolveDate(item) {
  if (!item) return 0;
  /* CollectionEntry shape: { data: { date: Date | string } } */
  if (item.data && item.data.date) {
    const d = item.data.date instanceof Date ? item.data.date : new Date(item.data.date);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }
  /* Flat shape: { date: Date | string } */
  if (item.date) {
    const d = item.date instanceof Date ? item.date : new Date(item.date);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
}

/**
 * Sort comparator — DESCENDING (newest first). Drop into any
 * `Array.prototype.sort` call where you want the most-recent item
 * at index 0. Accepts both the Astro `CollectionEntry` shape
 * (date at `data.date`) and the flat `{ date }` shape. Items with
 * no date sort to the bottom.
 *
 * Replaces the recurring inline expression
 * `(a, b) => b.data.date.getTime() - a.data.date.getTime()`.
 *
 * @param {*} a - First item.
 * @param {*} b - Second item.
 * @returns {number} Negative if `a` is newer, positive if `b` is newer.
 *
 * @example
 * posts.sort(byDateDesc)
 * news.toSorted(byDateDesc).slice(0, 5)  // top 5 most recent
 */
export function byDateDesc(a, b) {
  return _resolveDate(b) - _resolveDate(a);
}

/**
 * Sort comparator — ASCENDING (oldest first). Mirror image of
 * `byDateDesc`. Items with no date sort to the top.
 *
 * @param {*} a - First item.
 * @param {*} b - Second item.
 * @returns {number} Negative if `a` is older, positive if `b` is older.
 *
 * @example
 * archive.sort(byDateAsc)
 */
export function byDateAsc(a, b) {
  return _resolveDate(a) - _resolveDate(b);
}

/**
 * Every preset key `getDateRange` accepts, frozen as a tuple so
 * consumers can iterate / type-narrow / render a dropdown without
 * duplicating the literal list. Order matches typical UI
 * presentation (most-recent first, all/custom last).
 *
 * @example
 * import { DATE_PRESETS, getDateRange } from '@arraypress/date-utils';
 *
 * // Render a select element
 * for (const preset of DATE_PRESETS) {
 *   console.log(preset, getDateRange(preset));
 * }
 */
export const DATE_PRESETS = Object.freeze([
  'today',
  'yesterday',
  '7d',
  '30d',
  '90d',
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'ytd',
  'this_year',
  'last_year',
  'all',
  'custom',
]);

// ── Calendar periods in a time zone ────────

export {
  isTimeZone,
  localDate,
  startOfLocalDay,
  addDays,
  periodStart,
  nextPeriod,
  previousPeriod,
  periodBounds,
  periodLabel,
  parseLocalDate,
  formatLocalDate,
} from './zoned.js';
