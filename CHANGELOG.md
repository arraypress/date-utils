# Changelog

All notable changes to `@arraypress/date-utils` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-10-09

### Added

- Calendar periods in a time zone, for reports that must agree with the
  calendar on the seller's wall: `localDate()`, `startOfLocalDay()`,
  `addDays()`, `periodStart()`, `nextPeriod()`, `previousPeriod()`,
  `periodBounds()` (a period's `from`/`to` in unix ms, for a query),
  `periodLabel()` (`2026-10-09`, `2026-W41`, `2026-10`, `2026-Q4`, `2026`),
  `parseLocalDate()`, `formatLocalDate()`, `isTimeZone()`. Dates are kept as
  local calendar dates and turned into instants only at the edges, so days
  stay days across daylight saving; zones come from `Intl`. New types
  `Period` and `LocalDate`.

## [1.1.0] — 2026-05-23

### Added

- `byDateDesc(a, b)` and `byDateAsc(a, b)` sort comparators. Drop directly into `Array.prototype.sort`. Accept both Astro `CollectionEntry` shape (date at `item.data.date`) and flat `{ date }` shape. Both `Date` instances and date-strings work. Items with no date sort to the bottom (`desc`) or top (`asc`) so missing dates don't crash the sort.
- `DATE_PRESETS` — frozen array of every preset key `getDateRange` accepts. Useful for rendering select dropdowns or iterating without duplicating the literal union.
