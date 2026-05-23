# @arraypress/date-utils

Date utilities for dashboards and admin UIs — range presets, period formatting, and display formatting. Not a date library replacement — just the handful of functions every analytics dashboard needs.

Zero dependencies. Uses native `Date` and `Intl`. Works in any JS runtime.

## Installation

```bash
npm install @arraypress/date-utils
```

## Usage

```js
import {
  getDateRange, getGroupBy, formatPeriod,
  unixToDatetime, datetimeToUnix,
  shortDate, dateTime, relativeTime,
  byDateDesc, byDateAsc, DATE_PRESETS,
} from '@arraypress/date-utils';

// Date range presets for report filters
getDateRange('7d')            // { from: '2026-03-17T00:00:00Z', to: '2026-03-24T23:59:59Z' }
getDateRange('yesterday')     // { from: '2026-03-23T00:00:00Z', to: '2026-03-23T23:59:59Z' }
getDateRange('this_month')    // { from: '2026-03-01T00:00:00Z', to: '2026-03-24T23:59:59Z' }
getDateRange('last_quarter')  // { from: '2025-10-01T00:00:00Z', to: '2025-12-31T23:59:59Z' }
getDateRange('last_year')     // { from: '2025-01-01T00:00:00Z', to: '2025-12-31T23:59:59Z' }
getDateRange('all')           // { from: null, to: null }
getDateRange('custom', { from: '2026-01-01', to: '2026-02-28' })

// Auto-select chart granularity
getGroupBy('7d')       // 'day'
getGroupBy('90d')      // 'week'
getGroupBy('ytd')      // 'month'

// Format chart axis labels
formatPeriod('2026-03-24', 'day')    // 'Mar 24'
formatPeriod('2026-03', 'month')     // 'Mar 2026'
formatPeriod('2026-12', 'week')      // 'W12'

// Unix timestamp conversion (for databases)
unixToDatetime(1700000000)           // '2023-11-14 22:13:20'
datetimeToUnix('2023-11-14 22:13:20') // 1700000000

// Display formatting
shortDate('2026-03-24T10:30:00Z')    // 'Mar 24, 2026'
dateTime('2026-03-24T10:30:00Z')     // 'Mar 24, 2026, 10:30'
relativeTime('2026-03-24T08:00:00Z') // '2 hours ago'

// Sort comparators — Astro CollectionEntry or flat shape
posts.sort(byDateDesc)                // newest first
archive.sort(byDateAsc)               // oldest first

// Preset keys — for rendering a select / iterating
for (const preset of DATE_PRESETS) {
  console.log(preset, getDateRange(preset));
}
```

## API

### `getDateRange(preset, custom?)`

Get `{ from, to }` ISO strings for a named preset:

`'today'`, `'yesterday'`, `'7d'`, `'30d'`, `'90d'`, `'this_month'`, `'last_month'`, `'this_quarter'`, `'last_quarter'`, `'ytd'`/`'this_year'`, `'last_year'`, `'all'`, or `'custom'`.

### `getGroupBy(preset)`

Get the recommended chart granularity (`'day'`, `'week'`, or `'month'`) for a date preset.

### `formatPeriod(period, groupBy)`

Format a SQL GROUP BY period string for chart axis labels.

### `unixToDatetime(ts)`

Convert a Unix timestamp (seconds) to a SQL-friendly `'YYYY-MM-DD HH:MM:SS'` string (UTC). Returns `null` for falsy input.

### `datetimeToUnix(dateStr)`

Convert a SQL datetime or ISO string to a Unix timestamp (seconds). Returns `null` for invalid input.

### `shortDate(dateStr)`

Format as `'Mar 24, 2026'`.

### `dateTime(dateStr)`

Format as `'Mar 24, 2026, 10:30'`.

### `relativeTime(dateStr)`

Format as `'2 hours ago'`, `'3 days ago'`, `'just now'`, etc.

### `byDateDesc(a, b)` / `byDateAsc(a, b)`

Sort comparators. Drop directly into `Array.prototype.sort`. Accept both Astro `CollectionEntry` shape (`item.data.date`) and flat `{ date }` shape. Both `Date` instances and date-strings work. Items with no date sort to the bottom (`desc`) or top (`asc`).

```js
posts.sort(byDateDesc)
[...news].sort(byDateAsc).slice(0, 5)
```

### `DATE_PRESETS`

Frozen array of every preset key `getDateRange` accepts (`'today'`, `'yesterday'`, `'7d'`, `'30d'`, `'90d'`, `'this_month'`, `'last_month'`, `'this_quarter'`, `'last_quarter'`, `'ytd'`, `'this_year'`, `'last_year'`, `'all'`, `'custom'`). Use to render dropdowns or iterate without duplicating the literal.

## License

MIT
