# Changelog

All notable changes to `@arraypress/date-utils` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] — 2026-11-15

### Added

- `relativeDay(dateStr, { now })`: how long ago in days, as people say it ("today", "yesterday", "3 days ago", "a week ago", "2 weeks ago", "a month ago", "a year ago"), for a post's date where `relativeTime()`'s hours are more than the reader needs. A future date is "today". From the Logomarks blog, which used its own copy.

## [1.5.0] — Unreleased

### Added

- `getDateRange(preset, { now })`: the moment the presets count from, for a report as of another time (and for tests).

### Fixed

- `getDateRange` is on the UTC calendar throughout, as the strings it returns are. It read the month and year from the machine's zone and the day from UTC, so in the hours a zone is a day ahead of or behind UTC a range started after it ended (`this_month` at 07:00 on 1 December in Sydney ran from 1 December to 30 November; `ytd` on 1 January likewise), and `last_month`, `last_year` and `this_quarter` disagreed about which month it was.
- `datetimeToUnix`, `shortDate`, `dateTime`, `relativeTime`: a date with a zone west of UTC (`2026-01-01T00:00:00-05:00`, `-0800`, `-05`) or a lowercase `z` was not a date at all (`null`, `''`).
- `startOfLocalDay`, `periodBounds`: on the day the clocks go forward at midnight west of UTC (Cuba, Chile; Brazil until 2019) the day started at 23:00 the evening before. It starts at 01:00, its first instant.
- `relativeTime` without a locale said “0 years ago” for 360 to 364 days.
- `formatPeriod(label, 'week')` reads the label `periodLabel` writes (“2026-W05” was “WW05”).
- `unixToDatetime` returns `null` for what is no number instead of throwing; `isTimeZone(undefined)` is `false`.

## [1.4.0] — 2026-10-12

### Added

- Lengths of time in milliseconds: `SECOND` (1000), `MINUTE`, `HOUR`, `DAY`
  (24 hours) and `WEEK`, typed as their literal values.

## [1.3.0] — 2026-10-11

### Added

- Display formatting in any language. `shortDate(dateStr, { locale, timeZone })`
  and `dateTime(dateStr, { locale, timeZone })` write the same fields in a
  BCP 47 locale and an IANA zone (defaults `'en-US'` and UTC, as before);
  `dateTime` with a locale is joined as that language joins it, still 24-hour.
  `relativeTime(dateStr, { locale, now })` uses `Intl.RelativeTimeFormat` in
  the locale at the English thresholds (`'vor 2 Stunden'`, `'gestern'`), and
  `now` sets the moment to measure from. An unknown locale or zone keeps the
  default. New types `DisplayOptions` and `RelativeTimeOptions`. Without the
  new options, output is unchanged.

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
