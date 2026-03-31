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
 * Format a date as a short date string.
 *
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted date like "Mar 24, 2026".
 *
 * @example
 * shortDate('2026-03-24T10:30:00Z')   // 'Mar 24, 2026'
 * shortDate('2026-03-24')              // 'Mar 24, 2026'
 */
export function shortDate(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Format a date as a date + time string.
 *
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted like "Mar 24, 2026, 10:30".
 *
 * @example
 * dateTime('2026-03-24T10:30:00Z')   // 'Mar 24, 2026, 10:30'
 */
export function dateTime(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  return `${date}, ${time}`;
}

/**
 * Format a date as a relative time string.
 *
 * Returns human-friendly strings like "2 hours ago", "3 days ago", "just now".
 *
 * @param {string} dateStr - ISO date string.
 * @returns {string} Relative time string.
 *
 * @example
 * relativeTime('2026-03-24T10:00:00Z')  // '2 hours ago' (if now is 12:00)
 * relativeTime('2026-03-23T10:00:00Z')  // '1 day ago'
 * relativeTime('2026-01-01T00:00:00Z')  // '2 months ago'
 */
export function relativeTime(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '';

  const now = Date.now();
  const diff = now - d.getTime();

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
