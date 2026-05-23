# Changelog

All notable changes to `@arraypress/date-utils` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — Unreleased

### Added

- `byDateDesc(a, b)` and `byDateAsc(a, b)` sort comparators. Drop directly into `Array.prototype.sort`. Accept both Astro `CollectionEntry` shape (date at `item.data.date`) and flat `{ date }` shape. Both `Date` instances and date-strings work. Items with no date sort to the bottom (`desc`) or top (`asc`) so missing dates don't crash the sort.
- `DATE_PRESETS` — frozen array of every preset key `getDateRange` accepts. Useful for rendering select dropdowns or iterating without duplicating the literal union.
