/**
 * Real-world edges: presets in a zone a day ahead of or behind UTC, dates
 * written with a zone, days whose midnight the clocks skip, and the labels
 * the library writes itself.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  getDateRange, DATE_PRESETS, datetimeToUnix, shortDate, relativeTime, formatPeriod, unixToDatetime, isTimeZone,
  startOfLocalDay, localDate, periodBounds, periodLabel, periodStart, HOUR,
} from '../src/index.js';

describe('getDateRange is on the UTC calendar, whatever the machine’s zone', () => {
  /** @type {[string, string, string, string][]} now, preset, from, to */
  const cases = [
    // 07:00 on 1 December in Sydney is still 30 November in UTC.
    ['2026-11-30T20:00:00Z', 'today', '2026-11-30T00:00:00Z', '2026-11-30T23:59:59Z'],
    ['2026-11-30T20:00:00Z', 'yesterday', '2026-11-29T00:00:00Z', '2026-11-29T23:59:59Z'],
    ['2026-11-30T20:00:00Z', 'this_month', '2026-11-01T00:00:00Z', '2026-11-30T23:59:59Z'],
    ['2026-11-30T20:00:00Z', 'last_month', '2026-10-01T00:00:00Z', '2026-10-31T23:59:59Z'],
    // 19:00 on 31 December in Los Angeles is already 1 January in UTC.
    ['2027-01-01T03:00:00Z', 'this_month', '2027-01-01T00:00:00Z', '2027-01-01T23:59:59Z'],
    ['2027-01-01T03:00:00Z', 'last_month', '2026-12-01T00:00:00Z', '2026-12-31T23:59:59Z'],
    ['2027-01-01T03:00:00Z', 'this_quarter', '2027-01-01T00:00:00Z', '2027-01-01T23:59:59Z'],
    ['2027-01-01T03:00:00Z', 'last_quarter', '2026-10-01T00:00:00Z', '2026-12-31T23:59:59Z'],
    ['2027-01-01T03:00:00Z', 'ytd', '2027-01-01T00:00:00Z', '2027-01-01T23:59:59Z'],
    ['2027-01-01T03:00:00Z', 'last_year', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z'],
    // Month ends and a leap day.
    ['2028-03-31T12:00:00Z', 'last_month', '2028-02-01T00:00:00Z', '2028-02-29T23:59:59Z'],
    ['2026-03-01T00:30:00Z', 'yesterday', '2026-02-28T00:00:00Z', '2026-02-28T23:59:59Z'],
    ['2026-03-28T23:30:00Z', 'yesterday', '2026-03-27T00:00:00Z', '2026-03-27T23:59:59Z'],
    ['2026-01-05T12:00:00Z', '7d', '2025-12-29T00:00:00Z', '2026-01-05T23:59:59Z'],
    ['2026-05-15T12:00:00Z', 'last_quarter', '2026-01-01T00:00:00Z', '2026-03-31T23:59:59Z'],
  ];
  for (const [now, preset, from, to] of cases) {
    it(`${preset} at ${now}`, () => {
      assert.deepEqual(getDateRange(/** @type {any} */ (preset), { now: new Date(now) }), { from, to });
      assert.deepEqual(getDateRange(/** @type {any} */ (preset), { now: Date.parse(now) }), { from, to });
    });
  }

  it('no preset starts after it ends, in any zone, at any hour of a month’s or year’s edge', () => {
    const script = `
      import { getDateRange, DATE_PRESETS } from ${JSON.stringify(fileURLToPath(new URL('../src/index.js', import.meta.url)))};
      const bad = [];
      for (const now of ['2026-11-30T20:00:00Z', '2026-12-31T20:00:00Z', '2026-12-01T02:00:00Z', '2027-01-01T03:00:00Z', '2026-03-28T23:30:00Z']) {
        for (const preset of DATE_PRESETS) {
          const { from, to } = getDateRange(preset, { now: new Date(now) });
          if (from && to && from > to) bad.push(preset + ' at ' + now);
        }
      }
      console.log(JSON.stringify([bad, getDateRange('this_month', { now: new Date('2026-11-30T20:00:00Z') }).from]));`;
    for (const TZ of ['Australia/Sydney', 'America/Los_Angeles', 'Europe/London', 'Pacific/Kiritimati', 'UTC']) {
      const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' });
      assert.deepEqual(JSON.parse(out), [[], '2026-11-01T00:00:00Z'], TZ);
    }
    assert.ok(DATE_PRESETS.length > 10);
  });
});

describe('dates written with a zone', () => {
  /** @type {[string, number | null][]} */
  const cases = [
    ['2023-11-14T22:13:20Z', 1700000000],
    ['2023-11-14T22:13:20z', 1700000000],
    ['2023-11-14T17:13:20-05:00', 1700000000],
    ['2023-11-14T14:13:20-0800', 1700000000],
    ['2023-11-14T17:13:20-05', 1700000000],
    ['2023-11-15T03:43:20+05:30', 1700000000],
    ['2023-11-14T22:13:20.250+00:00', 1700000000],
    ['2023-11-14 22:13:20', 1700000000],
    ['2023-11-14', 1699920000],
    ['2023-11-14T22:13:20-25:00', null],
    ['not-a-date', null],
  ];
  for (const [text, unix] of cases) it(text, () => assert.equal(datetimeToUnix(text), unix));

  it('shortDate reads them too', () => {
    assert.equal(shortDate('2026-01-01T00:00:00-05:00'), 'Jan 1, 2026');
    assert.equal(shortDate('2025-12-31T23:00:00-05:00'), 'Jan 1, 2026');
  });
});

describe('a day starts at its first instant, where the clocks skip midnight', () => {
  /** @type {[string, number, number, number, string, number][]} zone, y, m, d, the start in UTC, the day's hours */
  const cases = [
    ['America/Havana', 2026, 3, 8, '2026-03-08T05:00:00.000Z', 23],
    ['America/Havana', 2026, 11, 1, '2026-11-01T04:00:00.000Z', 25],
    ['America/Santiago', 2026, 9, 6, '2026-09-06T04:00:00.000Z', 23],
    ['America/Santiago', 2026, 4, 4, '2026-04-04T03:00:00.000Z', 25],
    ['America/Sao_Paulo', 2018, 11, 4, '2018-11-04T03:00:00.000Z', 23],
    ['Africa/Cairo', 2026, 4, 24, '2026-04-23T22:00:00.000Z', 23],
    ['Asia/Beirut', 2026, 3, 29, '2026-03-28T22:00:00.000Z', 23],
    ['Europe/London', 2026, 3, 29, '2026-03-29T00:00:00.000Z', 23],
    ['America/New_York', 2026, 11, 1, '2026-11-01T04:00:00.000Z', 25],
    ['Pacific/Kiritimati', 2026, 1, 1, '2025-12-31T10:00:00.000Z', 24],
    ['Asia/Kolkata', 2026, 6, 15, '2026-06-14T18:30:00.000Z', 24],
  ];
  for (const [tz, y, m, d, start, hours] of cases) {
    it(`${tz} ${y}-${m}-${d}`, () => {
      const from = startOfLocalDay({ y, m, d }, tz);
      assert.equal(new Date(from).toISOString(), start);
      assert.deepEqual(localDate(from, tz), { y, m, d });
      assert.notDeepEqual(localDate(from - 1, tz), { y, m, d });
      const bounds = periodBounds({ y, m, d }, 'day', tz);
      assert.equal((bounds.to - bounds.from) / HOUR, hours);
    });
  }
});

describe('labels and small edges', () => {
  it('formatPeriod reads the week label periodLabel writes', () => {
    const label = periodLabel(periodStart({ y: 2026, m: 1, d: 29 }, 'week'), 'week');
    assert.equal(label, '2026-W05');
    assert.equal(formatPeriod(label, 'week'), 'W05');
    assert.equal(formatPeriod('2026-05', 'week'), 'W05');
  });

  it('relativeTime never says “0 years ago”', () => {
    const now = Date.UTC(2026, 10, 12);
    for (const days of [359, 360, 364, 365, 729, 730]) {
      const said = relativeTime(new Date(now - days * 24 * HOUR).toISOString(), { now });
      assert.equal(said, days < 360 ? '11 months ago' : days < 730 ? '1 year ago' : '2 years ago', String(days));
    }
  });

  it('unixToDatetime is null for what is no number, not an error', () => {
    assert.equal(unixToDatetime(/** @type {any} */ ('abc')), null);
    assert.equal(unixToDatetime(NaN), null);
    assert.equal(unixToDatetime(1e20), null);
    assert.equal(unixToDatetime(/** @type {any} */ ('1700000000')), '2023-11-14 22:13:20');
  });

  it('isTimeZone is false for no zone at all', () => {
    for (const tz of [undefined, null, '', 42]) assert.equal(isTimeZone(/** @type {any} */ (tz)), false);
    assert.equal(isTimeZone('America/Havana'), true);
  });
});
