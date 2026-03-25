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
 * @param {'today'|'7d'|'30d'|'90d'|'ytd'|'all'|'custom'} preset - The preset name.
 * @param {{ from?: string, to?: string }} [custom] - Custom date strings (YYYY-MM-DD) when preset is 'custom'.
 * @returns {{ from: string|null, to: string|null }}
 *
 * @example
 * getDateRange('7d')      // { from: '2026-03-17T00:00:00Z', to: '2026-03-24T23:59:59Z' }
 * getDateRange('ytd')     // { from: '2026-01-01T00:00:00Z', to: '2026-03-24T23:59:59Z' }
 * getDateRange('all')     // { from: null, to: null }
 * getDateRange('custom', { from: '2026-01-01', to: '2026-02-28' })
 */
export function getDateRange(preset, custom = {}) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  switch (preset) {
    case 'today':
      return { from: `${today}T00:00:00Z`, to: `${today}T23:59:59Z` };

    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: `${d.toISOString().slice(0, 10)}T00:00:00Z`, to: `${today}T23:59:59Z` };
    }

    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: `${d.toISOString().slice(0, 10)}T00:00:00Z`, to: `${today}T23:59:59Z` };
    }

    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { from: `${d.toISOString().slice(0, 10)}T00:00:00Z`, to: `${today}T23:59:59Z` };
    }

    case 'ytd':
      return { from: `${now.getFullYear()}-01-01T00:00:00Z`, to: `${today}T23:59:59Z` };

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
    case '7d':
    case '30d':
      return 'day';
    case '90d':
      return 'week';
    case 'ytd':
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
